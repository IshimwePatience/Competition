const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const { Facility } = require('../models');
const AppError = require('../utils/AppError');
const { getPublicUsageStats } = require('./publicUsageService');

const ADMIN_AI_PROMPT = `You are CareLink Admin Assistant. You help platform administrators understand pharmacy medicine stock and public patient usage (anonymous visitors on the free symptoms/medicine page — no login).

Answer using ONLY the platform snapshot data provided. Be concise, factual, and use bullet points when listing medicines or pharmacies.
If data is missing, say so. Never invent facilities or numbers.
Focus on: which pharmacies carry which medicines, stock levels, how many public patients used symptom check vs medicine search, and common symptoms.`;

const buildMedicineSummary = (pharmacies) => {
  const summary = {};
  pharmacies.forEach((p) => {
    (p.medicines || []).forEach((m) => {
      const key = String(m.name || '').toLowerCase();
      if (!key) return;
      if (!summary[key]) {
        summary[key] = { name: m.name, pharmacyCount: 0, totalQuantity: 0, pharmacies: [] };
      }
      summary[key].pharmacyCount += 1;
      summary[key].totalQuantity += Number(m.quantity) || 0;
      summary[key].pharmacies.push({ facility: p.name, quantity: m.quantity, status: m.status });
    });
  });
  return Object.values(summary).sort((a, b) => b.pharmacyCount - a.pharmacyCount);
};

const getAdminSnapshot = async () => {
  const [pharmacies, publicUsage] = await Promise.all([
    Facility.findAll({
      where: { type: 'pharmacy' },
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'address', 'phone', 'isOpen', 'medicineStock'],
    }),
    getPublicUsageStats(),
  ]);

  const pharmacyStock = pharmacies.map((f) => {
    const medicines = (f.medicineStock || [])
      .filter((m) => m && m.status !== 'out_of_stock')
      .map((m) => ({
        name: m.name,
        category: m.category,
        quantity: m.quantity,
        status: m.status,
      }));
    return {
      id: f.id,
      name: f.name,
      address: f.address,
      phone: f.phone,
      isOpen: f.isOpen,
      medicineCount: medicines.length,
      medicines,
    };
  });

  const medicineSummary = buildMedicineSummary(pharmacyStock);

  return {
    pharmacyCount: pharmacyStock.length,
    pharmaciesWithStock: pharmacyStock.filter((p) => p.medicineCount > 0).length,
    totalMedicineEntries: medicineSummary.length,
    pharmacyStock,
    medicineSummary,
    publicUsage,
  };
};

const fallbackAnswer = (question, snapshot) => {
  const q = question.toLowerCase();
  const { publicUsage, pharmacyStock, medicineSummary } = snapshot;
  const lines = [];

  if (q.includes('patient') || q.includes('public') || q.includes('symptom') || q.includes('used') || q.includes('visit')) {
    lines.push(
      `Public page usage (anonymous patients, no accounts):`,
      `• Symptom checks: ${publicUsage.totalSymptomChecks}`,
      `• Medicine searches: ${publicUsage.totalMedicineSearches}`,
      `• Total public sessions: ${publicUsage.totalPublicPatients}`,
      `• Last 7 days: ${publicUsage.last7Days.total} sessions (${publicUsage.last7Days.symptomChecks} symptom, ${publicUsage.last7Days.medicineSearches} medicine)`
    );
    if (publicUsage.topSymptoms.length > 0) {
      lines.push(`• Top symptoms (7d): ${publicUsage.topSymptoms.map((s) => `${s.symptom} (${s.count})`).join(', ')}`);
    }
  }

  if (q.includes('medicine') || q.includes('pharmacy') || q.includes('stock') || lines.length === 0) {
    lines.push(
      `Pharmacy network: ${snapshot.pharmacyCount} pharmacies, ${snapshot.pharmaciesWithStock} listing medicines in stock.`
    );
    if (medicineSummary.length > 0) {
      lines.push('Medicines across pharmacies:');
      medicineSummary.slice(0, 15).forEach((m) => {
        lines.push(`• ${m.name}: ${m.pharmacyCount} pharmacy/pharmacies, ~${m.totalQuantity} units total`);
      });
    } else {
      lines.push('No medicines listed in pharmacy stock yet.');
    }
    const stocked = pharmacyStock.filter((p) => p.medicineCount > 0);
    if (stocked.length > 0 && (q.includes('which') || q.includes('pharmacy') || q.includes('who'))) {
      lines.push('Pharmacies with stock:');
      stocked.slice(0, 10).forEach((p) => {
        lines.push(`• ${p.name}: ${p.medicines.map((m) => m.name).join(', ')}`);
      });
    }
  }

  return lines.join('\n');
};

const queryAdminAi = async (question) => {
  const trimmed = String(question || '').trim();
  if (trimmed.length < 3) throw new AppError('Ask a question about pharmacy stock or public page usage', 400);

  const snapshot = await getAdminSnapshot();
  let answer;
  let usedAi = false;

  if (config.gemini.apiKey && config.gemini.apiKey !== 'your-gemini-api-key-here') {
    try {
      const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
      const model = genAI.getGenerativeModel({ model: config.gemini.model });
      const response = await model.generateContent([
        { text: ADMIN_AI_PROMPT },
        { text: `Platform snapshot:\n${JSON.stringify(snapshot, null, 2)}` },
        { text: `Admin question: ${trimmed}` },
      ]);
      answer = response.response.text().trim();
      usedAi = true;
    } catch (err) {
      console.warn('[AdminAI] Gemini failed, using fallback:', err.message);
      answer = fallbackAnswer(trimmed, snapshot);
    }
  } else {
    answer = fallbackAnswer(trimmed, snapshot);
  }

  return { answer, snapshot, usedAi };
};

module.exports = { getAdminSnapshot, queryAdminAi };
