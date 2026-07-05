const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const AppError = require('../utils/AppError');

const search = async (query, { limit = 10 } = {}) => {
  const q = query?.trim();
  if (!q || q.length < 2) throw new AppError('Search query must be at least 2 characters', 400);

  const safeLimit = Math.min(parseInt(limit, 10) || 10, 25);

  let medicineMatches = [];
  try {
    medicineMatches = await sequelize.query(
      `SELECT id, name, type, address, latitude, longitude, "isOpen", "medicineStock"
       FROM facilities
       WHERE "medicineStock"::text ILIKE :pattern
       ORDER BY "trustScore" DESC
       LIMIT :limit`,
      { replacements: { pattern: `%${q}%`, limit: safeLimit }, type: QueryTypes.SELECT }
    );
  } catch {
    medicineMatches = [];
  }

  const facilities = await sequelize.query(
    `SELECT id, name, type, address, latitude, longitude, "isOpen", "waitTimeMinutes", "crowdLevel"
     FROM facilities
     WHERE to_tsvector('english', name || ' ' || address || ' ' || COALESCE(services::text, ''))
       @@ plainto_tsquery('english', :q)
     ORDER BY "trustScore" DESC
     LIMIT :limit`,
    { replacements: { q, limit: safeLimit }, type: QueryTypes.SELECT }
  );

  let reports = [];
  try {
    reports = await sequelize.query(
      `SELECT fr.id, fr.notes, fr.status, fr."createdAt", f.name AS "facilityName", f.type AS "facilityType"
       FROM facility_reports fr
       JOIN facilities f ON f.id = fr."facilityId"
       WHERE to_tsvector('english', COALESCE(fr.notes, '') || ' ' || f.name)
         @@ plainto_tsquery('english', :q)
       ORDER BY fr."createdAt" DESC
       LIMIT :limit`,
      { replacements: { q, limit: safeLimit }, type: QueryTypes.SELECT }
    );
  } catch {
    reports = [];
  }

  return { facilities, medicineMatches, reports, query: q };
};

module.exports = { search };
