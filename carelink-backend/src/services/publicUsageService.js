const { Op } = require('sequelize');
const { PublicUsageLog } = require('../models');

const logPublicUsage = async (type, details = {}) => {
  try {
    await PublicUsageLog.create({ type, details });
  } catch (err) {
    console.warn('[PublicUsage] Log failed:', err.message);
  }
};

const getPublicUsageStats = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [symptomChecks, medicineSearches, recentLogs] = await Promise.all([
    PublicUsageLog.count({ where: { type: 'symptoms' } }),
    PublicUsageLog.count({ where: { type: 'medicine_search' } }),
    PublicUsageLog.findAll({
      where: { createdAt: { [Op.gte]: sevenDaysAgo } },
      order: [['createdAt', 'DESC']],
      limit: 200,
    }),
  ]);

  const last7DaysSymptoms = recentLogs.filter((l) => l.type === 'symptoms').length;
  const last7DaysMedicine = recentLogs.filter((l) => l.type === 'medicine_search').length;

  const symptomCounts = {};
  recentLogs
    .filter((l) => l.type === 'symptoms')
    .forEach((l) => {
      const list = l.details?.symptoms || [];
      list.forEach((s) => {
        const key = String(s).toLowerCase();
        symptomCounts[key] = (symptomCounts[key] || 0) + 1;
      });
    });

  const topSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([symptom, count]) => ({ symptom, count }));

  return {
    totalSymptomChecks: symptomChecks,
    totalMedicineSearches: medicineSearches,
    totalPublicPatients: symptomChecks + medicineSearches,
    last7Days: {
      symptomChecks: last7DaysSymptoms,
      medicineSearches: last7DaysMedicine,
      total: last7DaysSymptoms + last7DaysMedicine,
    },
    topSymptoms,
  };
};

module.exports = { logPublicUsage, getPublicUsageStats };
