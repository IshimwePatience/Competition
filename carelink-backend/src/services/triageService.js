const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const { TriageSession } = require('../models');
const AppError = require('../utils/AppError');

const TRIAGE_PROMPT = `You are a healthcare routing assistant for CareLink. You do NOT diagnose conditions.
Given patient symptoms, respond with ONLY valid JSON (no markdown, no extra text):
{
  "urgency": "low" | "medium" | "high",
  "recommended_facility": "pharmacy" | "clinic" | "hospital" | "emergency",
  "reason": "brief explanation of urgency level and why this facility type fits"
}

Rules:
- urgency "high" or recommended_facility "emergency" for life-threatening symptoms (chest pain, severe bleeding, difficulty breathing, stroke signs, unconsciousness)
- urgency "medium" for symptoms needing same-day medical attention
- urgency "low" for minor ailments manageable with OTC or routine care
- NEVER provide a medical diagnosis — only urgency routing
- reason must be under 200 characters`;

const parseGeminiResponse = (text) => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleaned);
  const urgency = parsed.urgency?.toLowerCase();
  const facility = parsed.recommended_facility?.toLowerCase();

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
    reason: parsed.reason || 'Based on reported symptoms.',
  };
};

const fallbackTriage = (symptoms) => {
  const lower = symptoms.toLowerCase();
  const emergencyKeywords = [
    'chest pain', 'cannot breathe', "can't breathe", 'unconscious',
    'severe bleeding', 'stroke', 'heart attack', 'seizure',
  ];
  const mediumKeywords = [
    'fever', 'vomiting', 'injury', 'infection', 'pain', 'swelling', 'rash',
  ];

  if (emergencyKeywords.some((k) => lower.includes(k))) {
    return {
      urgency: 'high',
      recommendedFacility: 'emergency',
      reason: 'Symptoms may indicate a medical emergency. Seek immediate care.',
    };
  }
  if (mediumKeywords.some((k) => lower.includes(k))) {
    return {
      urgency: 'medium',
      recommendedFacility: 'clinic',
      reason: 'Symptoms suggest you should visit a clinic for evaluation today.',
    };
  }
  return {
    urgency: 'low',
    recommendedFacility: 'pharmacy',
    reason: 'Minor symptoms may be managed with pharmacy consultation or self-care.',
  };
};

const analyzeSymptoms = async (userId, symptoms) => {
  if (!symptoms?.trim()) throw new AppError('Symptoms description is required', 400);

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
        { text: `Patient symptoms: ${symptoms}` },
      ]);

      const text = response.response.text();
      aiRawResponse = { raw: text };
      result = parseGeminiResponse(text);
    } catch (err) {
      console.warn('[Triage] Gemini failed, using fallback:', err.message);
      result = fallbackTriage(symptoms);
      usedFallback = true;
      aiRawResponse = { error: err.message, fallback: true };
    }
  } else {
    result = fallbackTriage(symptoms);
    usedFallback = true;
    aiRawResponse = { fallback: true, reason: 'No Gemini API key configured' };
  }

  const session = await TriageSession.create({
    userId,
    symptoms,
    urgency: result.urgency,
    recommendedFacility: result.recommendedFacility,
    reason: result.reason,
    aiRawResponse: { ...aiRawResponse, usedFallback },
  });

  const { emitToUser } = require('./socketService');
  emitToUser(userId, 'triage:complete', {
    sessionId: session.id,
    urgency: result.urgency,
    recommendedFacility: result.recommendedFacility,
    reason: result.reason,
  });

  return session;
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

module.exports = { analyzeSymptoms, getHistory };
