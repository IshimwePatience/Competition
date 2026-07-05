const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const { Facility } = require('../models');
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

const splitMedicineText = (raw) =>
  String(raw || '')
    .split(/[,\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

const levenshtein = (a, b) => {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
};

let medicineCatalogCache = null;
let medicineCatalogCacheAt = 0;

const getMedicineCatalog = async () => {
  const now = Date.now();
  if (medicineCatalogCache && now - medicineCatalogCacheAt < 60_000) {
    return medicineCatalogCache;
  }
  const facilities = await Facility.findAll({ attributes: ['medicineStock'] });
  const names = new Set(COMMON_MEDICINES.map((m) => m.name));
  facilities.forEach((f) => {
    (f.medicineStock || []).forEach((item) => {
      if (item?.name) names.add(String(item.name).trim());
    });
  });
  medicineCatalogCache = [...names].filter(Boolean);
  medicineCatalogCacheAt = now;
  return medicineCatalogCache;
};

const findCatalogMatch = (term, catalog) => {
  const lower = term.toLowerCase();
  return catalog.find((name) => name.toLowerCase() === lower) || null;
};

const findSuggestions = (term, catalog) => {
  const lower = term.toLowerCase();
  const scored = catalog
    .map((name) => {
      const nameLower = name.toLowerCase();
      const dist = levenshtein(lower, nameLower);
      const prefixBonus = nameLower.startsWith(lower.slice(0, 3)) || lower.startsWith(nameLower.slice(0, 3)) ? -1 : 0;
      return { name, score: dist + prefixBonus };
    })
    .filter((x) => x.score <= 3)
    .sort((a, b) => a.score - b.score);

  const unique = [];
  scored.forEach((x) => {
    if (!unique.some((u) => u.toLowerCase() === x.name.toLowerCase())) unique.push(x.name);
  });
  return unique.slice(0, 4);
};

const resolveMedicineInputs = async (parts) => {
  const catalog = await getMedicineCatalog();
  const resolved = [];
  const prompts = [];
  const unrecognized = [];

  for (const part of parts) {
    const exact = findCatalogMatch(part, catalog);
    if (exact) {
      resolved.push(exact);
      continue;
    }

    let suggestions = findSuggestions(part, catalog);
    try {
      const normalized = await normalizeMedicineNames(part);
      const aiName = normalized.medicines?.[0];
      if (aiName && aiName.toLowerCase() !== part.toLowerCase()) {
        suggestions = [...new Set([aiName, ...suggestions])].slice(0, 4);
      } else if (aiName && findCatalogMatch(aiName, catalog)) {
        suggestions = [...new Set([aiName, ...suggestions])].slice(0, 4);
      }
    } catch {
      // keep fuzzy suggestions only
    }

    if (suggestions.length > 0) {
      prompts.push({ typed: part, suggestions });
    } else {
      unrecognized.push(part);
    }
  }

  return { resolved, prompts, unrecognized };
};

const searchMedicineResults = async (names) => {
  const { facilities } = await facilityOwnerService.findFacilitiesWithMedicines(names);
  await logPublicUsage('medicine_search', { medicines: names, matchCount: facilities.length });

  return {
    status: 'results',
    medicines: names,
    facilities,
    message: facilities.length > 0
      ? `Found ${facilities.length} facilit${facilities.length === 1 ? 'y' : 'ies'} with your medicine${names.length > 1 ? 's' : ''} in stock`
      : 'No facilities currently list these medicines in stock. Please check the medicine name and try again.',
  };
};

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
  if (Array.isArray(medicines) && medicines.length > 0) {
    const names = medicines.map((m) => String(m).trim()).filter(Boolean);
    if (names.length === 0) throw new AppError('Enter at least one medicine name', 400);
    return searchMedicineResults(names);
  }

  const parts = splitMedicineText(medicineText);
  if (parts.length === 0) throw new AppError('Enter at least one medicine name', 400);

  const { resolved, prompts, unrecognized } = await resolveMedicineInputs(parts);

  if (prompts.length > 0) {
    return {
      status: 'confirm',
      prompts,
      resolved,
      message: 'Please confirm the medicine names below before we search.',
    };
  }

  if (unrecognized.length > 0) {
    return {
      status: 'unrecognized',
      unrecognized,
      message: `We couldn't recognize: ${unrecognized.join(', ')}. Please check the spelling and enter the correct medicine name.`,
    };
  }

  return searchMedicineResults(resolved);
};

module.exports = { analyzePublicSymptoms, findPublicMedicines };
