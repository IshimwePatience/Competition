const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const { TriageSession } = require('../models');
const AppError = require('../utils/AppError');
const facilityOwnerService = require('./facilityOwnerService');

const TRIAGE_PROMPT = `You are a healthcare routing assistant for CareLink. You do NOT diagnose conditions.
Given patient symptoms, respond with ONLY valid JSON (no markdown, no extra text):
{
  "urgency": "low" | "medium" | "high",
  "recommended_facility_type": "pharmacy" | "clinic" | "hospital" | "emergency",
  "likely_medicine_category": "short category string e.g. pain reliever, antimalarial, antibiotic",
  "reason": "brief plain-language explanation (non-diagnostic, may say this may be related to...)"
}

Rules:
- urgency "high" or recommended_facility_type "emergency" for life-threatening symptoms
- urgency "medium" for symptoms needing same-day medical attention
- urgency "low" for minor ailments manageable with OTC or routine care
- likely_medicine_category helps match pharmacy stock — use simple category labels
- NEVER provide a medical diagnosis — only urgency routing
- reason must be under 200 characters`;

const parseGeminiResponse = (text) => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleaned);
  const urgency = parsed.urgency?.toLowerCase();
  const facility = (parsed.recommended_facility_type || parsed.recommended_facility || '').toLowerCase();

  const validUrgency = ['low', 'medium', 'high'];
  const validFacility = ['pharmacy', 'clinic', 'hospital', 'emergency'];

  if (!validUrgency.includes(urgency)) {
    throw new Error(`Invalid urgency: ${urgency}`);
  }
  if (!validFacility.includes(facility)) {
    throw new Error(`Invalid facility: ${facility}`);
  }

  return {
    urgency,
    recommendedFacility: facility,
    likelyMedicineCategory: parsed.likely_medicine_category || parsed.likelyMedicineCategory || 'general',
    reason: parsed.reason || 'Based on reported symptoms.',
  };
};

const fallbackTriage = (symptoms) => {
  const lower = symptoms.toLowerCase();
  const emergencyKeywords = [
    'chest pain', 'cannot breathe', "can't breathe", 'unconscious',
    'severe bleeding', 'stroke', 'heart attack', 'seizure', 'shortness of breath',
  ];
  const mediumKeywords = [
    'fever', 'vomiting', 'injury', 'infection', 'pain', 'swelling', 'rash', 'cough',
  ];

  if (emergencyKeywords.some((k) => lower.includes(k))) {
    return {
      urgency: 'high',
      recommendedFacility: 'emergency',
      likelyMedicineCategory: 'emergency care',
      reason: 'Symptoms may indicate a medical emergency. Seek immediate care.',
    };
  }
  if (mediumKeywords.some((k) => lower.includes(k))) {
    return {
      urgency: 'medium',
      recommendedFacility: 'clinic',
      likelyMedicineCategory: 'antibiotic',
      reason: 'This may be related to an infection — visit a clinic for evaluation today.',
    };
  }
  return {
    urgency: 'low',
    recommendedFacility: 'pharmacy',
    likelyMedicineCategory: 'pain reliever',
    reason: 'Minor symptoms may be managed with pharmacy consultation or self-care.',
  };
};

const runTriageAI = async (symptomsText) => {
  let result;
  let aiRawResponse = null;
  let usedFallback = false;

  if (config.gemini.apiKey && config.gemini.apiKey !== 'your-gemini-api-key-here') {
    try {
      const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
      const model = genAI.getGenerativeModel({
        model: config.gemini.model,
        generationConfig: { responseMimeType: 'application/json' },
      });

      const response = await model.generateContent([
        { text: TRIAGE_PROMPT },
        { text: `Patient symptoms: ${symptomsText}` },
      ]);

      const text = response.response.text();
      aiRawResponse = { raw: text };
      result = parseGeminiResponse(text);
    } catch (err) {
      console.warn('[Triage] Gemini failed, using fallback:', err.message);
      result = fallbackTriage(symptomsText);
      usedFallback = true;
      aiRawResponse = { error: err.message, fallback: true };
    }
  } else {
    result = fallbackTriage(symptomsText);
    usedFallback = true;
    aiRawResponse = { fallback: true, reason: 'No Gemini API key configured' };
  }

  return { result, aiRawResponse, usedFallback };
};

const analyzeSymptoms = async (userId, symptoms) => {
  if (!symptoms?.trim()) throw new AppError('Symptoms description is required', 400);

  const { result, aiRawResponse, usedFallback } = await runTriageAI(symptoms);

  const session = await TriageSession.create({
    userId,
    symptoms,
    urgency: result.urgency,
    recommendedFacility: result.recommendedFacility,
    likelyMedicineCategory: result.likelyMedicineCategory,
    reason: result.reason,
    aiRawResponse: { ...aiRawResponse, usedFallback },
  });

  const { emitToUser } = require('./socketService');
  emitToUser(userId, 'triage:complete', {
    sessionId: session.id,
    urgency: result.urgency,
    recommendedFacility: result.recommendedFacility,
    likelyMedicineCategory: result.likelyMedicineCategory,
    reason: result.reason,
  });

  return session;
};

const analyzePublicSymptoms = async ({ symptoms, latitude, longitude }) => {
  const list = Array.isArray(symptoms) ? symptoms : [symptoms];
  const cleaned = list.map((s) => String(s).trim()).filter(Boolean);
  if (cleaned.length === 0) throw new AppError('Select at least one symptom', 400);

  const symptomsText = cleaned.join(', ');
  const { result, aiRawResponse, usedFallback } = await runTriageAI(symptomsText);

  let match = { facility: null, stockConfirmed: false, alternatives: [] };
  if (latitude != null && longitude != null) {
    match = await facilityOwnerService.matchByMedicine({
      latitude,
      longitude,
      facilityType: result.recommendedFacility === 'pharmacy' || result.recommendedFacility === 'clinic'
        ? result.recommendedFacility
        : undefined,
      medicineCategory: result.likelyMedicineCategory,
    });
  }

  return {
    symptoms: cleaned,
    urgency: result.urgency,
    recommendedFacility: result.recommendedFacility,
    likelyMedicineCategory: result.likelyMedicineCategory,
    reason: result.reason,
    conditionSummary: result.reason,
    matchedFacility: match.facility,
    stockConfirmed: match.stockConfirmed,
    alternativeFacilities: match.alternatives,
    aiRawResponse: { ...aiRawResponse, usedFallback },
  };
};

const getHistory = async (userId, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await TriageSession.findAndCountAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
  return { sessions: rows, total: count, page, limit };
};

module.exports = { analyzeSymptoms, analyzePublicSymptoms, getHistory };
