const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const AppError = require('../utils/AppError');
const facilityOwnerService = require('./facilityOwnerService');
const { logPublicUsage } = require('./publicUsageService');
const { COMMON_MEDICINES } = require('../constants/medicines');

const MEDICINE_NORMALIZE_PROMPT = `You help match medicine names patients were told to find at a pharmacy.
Given medicine names (brand names, misspellings, or local names), respond with ONLY valid JSON:
{ "medicines": ["standardized generic name 1", "standardized generic name 2"] }
Use common names like Paracetamol, Amoxicillin, Ibuprofen.`;

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

const analyzePublicSymptoms = async ({ symptoms, latitude, longitude }) => {
  const list = Array.isArray(symptoms) ? symptoms : [symptoms];
  const cleaned = list.map((s) => String(s).trim()).filter(Boolean);
  if (cleaned.length === 0) throw new AppError('Select at least one symptom', 400);

  const symptomsText = cleaned.join(', ');
  const { result, aiRawResponse, usedFallback } = await runTriageAI(symptomsText);

  let match = { facility: null, stockConfirmed: false, alternatives: [], allMatches: [] };
  const facilityType = result.recommendedFacility === 'pharmacy' || result.recommendedFacility === 'clinic'
    ? result.recommendedFacility
    : undefined;

  if (latitude != null && longitude != null) {
    match = await facilityOwnerService.matchByMedicine({
      latitude,
      longitude,
      facilityType,
      medicineCategory: result.likelyMedicineCategory,
    });
  } else {
    match = await facilityOwnerService.matchByCategoryNoLocation({
      facilityType,
      medicineCategory: result.likelyMedicineCategory,
    });
  }

  await logPublicUsage('symptoms', {
    symptoms: cleaned,
    urgency: result.urgency,
    recommendedFacility: result.recommendedFacility,
    likelyMedicineCategory: result.likelyMedicineCategory,
  });

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
    facilityMatches: match.allMatches || [],
    aiRawResponse: { ...aiRawResponse, usedFallback },
  };
};

const fallbackNormalizeMedicines = (parts) =>
  parts.map((part) => {
    const lower = part.toLowerCase();
    const known = COMMON_MEDICINES.find(
      (m) => m.name.toLowerCase().includes(lower) || lower.includes(m.name.toLowerCase())
    );
    return known ? known.name : part;
  });

const normalizeMedicineNames = async (raw) => {
  const parts = String(raw || '')
    .split(/[,\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) throw new AppError('Enter at least one medicine name', 400);

  if (config.gemini.apiKey && config.gemini.apiKey !== 'your-gemini-api-key-here') {
    try {
      const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
      const model = genAI.getGenerativeModel({
        model: config.gemini.model,
        generationConfig: { responseMimeType: 'application/json' },
      });
      const response = await model.generateContent([
        { text: MEDICINE_NORMALIZE_PROMPT },
        { text: `Medicines: ${parts.join(', ')}` },
      ]);
      let cleaned = response.response.text().trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed.medicines) && parsed.medicines.length > 0) {
        return { medicines: parsed.medicines.map((m) => String(m).trim()).filter(Boolean), usedAi: true };
      }
    } catch (err) {
      console.warn('[Triage] Medicine normalize fallback:', err.message);
    }
  }

  return { medicines: fallbackNormalizeMedicines(parts), usedAi: false };
};

const findPublicMedicines = async ({ medicines, medicineText }) => {
  let names = [];
  if (Array.isArray(medicines) && medicines.length > 0) {
    names = medicines.map((m) => String(m).trim()).filter(Boolean);
  } else if (medicineText) {
    const normalized = await normalizeMedicineNames(medicineText);
    names = normalized.medicines;
  }
  if (names.length === 0) throw new AppError('Enter at least one medicine name', 400);

  const { facilities } = await facilityOwnerService.findFacilitiesWithMedicines(names);

  await logPublicUsage('medicine_search', { medicines: names, matchCount: facilities.length });

  return {
    medicines: names,
    facilities,
    message: facilities.length > 0
      ? `Found ${facilities.length} facilit${facilities.length === 1 ? 'y' : 'ies'} with your medicine${names.length > 1 ? 's' : ''} in stock`
      : 'No facilities currently list these medicines in stock — try a different name or call ahead',
  };
};

module.exports = { analyzePublicSymptoms, findPublicMedicines };
