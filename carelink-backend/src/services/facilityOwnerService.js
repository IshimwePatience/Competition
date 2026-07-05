const { Facility } = require('../models');
const AppError = require('../utils/AppError');
const { haversineKm } = require('../utils/geo');
const { COMMON_MEDICINES } = require('../constants/medicines');

const normalizeStock = (items = []) =>
  items.map((item) => {
    const known = COMMON_MEDICINES.find(
      (m) => m.name.toLowerCase() === String(item.name || '').trim().toLowerCase()
    );
    const quantity = Math.max(0, parseInt(item.quantity, 10) || 0);
    let status = item.status;
    if (!status || !['in_stock', 'low_stock', 'out_of_stock'].includes(status)) {
      status = quantity === 0 ? 'out_of_stock' : quantity <= 10 ? 'low_stock' : 'in_stock';
    }
    return {
      name: String(item.name || '').trim(),
      category: known?.category || String(item.category || '').trim().toLowerCase(),
      quantity,
      status,
    };
  }).filter((item) => item.name);

const getOwnedFacility = async (userId) => {
  const facility = await Facility.findOne({ where: { ownerId: userId } });
  if (!facility) throw new AppError('Facility profile not found', 404);
  return facility;
};

const updateOwnedFacility = async (userId, data) => {
  const facility = await getOwnedFacility(userId);
  const allowed = [
    'name', 'type', 'address', 'latitude', 'longitude', 'phone',
    'isOpen', 'openingHours', 'waitTimeMinutes', 'crowdLevel',
  ];
  allowed.forEach((key) => {
    if (data[key] !== undefined) facility[key] = data[key];
  });
  if (data.type && !['clinic', 'pharmacy'].includes(data.type)) {
    throw new AppError('Facility type must be clinic or pharmacy', 400);
  }
  facility.lastUpdatedAt = new Date();
  await facility.save();
  return facility;
};

const getStock = async (userId) => {
  const facility = await getOwnedFacility(userId);
  return facility.medicineStock || [];
};

const setStock = async (userId, items) => {
  const facility = await getOwnedFacility(userId);
  const stock = normalizeStock(items);
  facility.medicineStock = stock;
  facility.lastUpdatedAt = new Date();
  await facility.save();

  const { broadcast } = require('./socketService');
  broadcast('facility:stock-updated', {
    facilityId: facility.id,
    facilityName: facility.name,
    medicineStock: stock,
  });

  return stock;
};

const matchByMedicine = async ({ latitude, longitude, facilityType, medicineCategory, radiusKm = 25 }) => {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    throw new AppError('Patient location is required', 400);
  }

  const where = {};
  if (facilityType) where.type = facilityType;

  const facilities = await Facility.findAll({ where });
  const category = String(medicineCategory || '').trim().toLowerCase();

  const withDistance = facilities.map((f) => ({
    ...f.toJSON(),
    distanceKm: Math.round(haversineKm(lat, lon, f.latitude, f.longitude) * 100) / 100,
  })).filter((f) => f.distanceKm <= radiusKm);

  const hasStock = (stock = []) => {
    if (!category) return false;
    return stock.some((item) => {
      if (!item || item.status === 'out_of_stock') return false;
      const name = String(item.name || '').toLowerCase();
      const cat = String(item.category || '').toLowerCase();
      return cat.includes(category) || category.includes(cat) || name.includes(category);
    });
  };

  const stocked = withDistance
    .filter((f) => hasStock(f.medicineStock))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  if (stocked.length > 0) {
    return { facility: stocked[0], stockConfirmed: true, alternatives: stocked.slice(1, 3) };
  }

  const fallback = withDistance
    .filter((f) => !facilityType || f.type === facilityType)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  if (fallback.length === 0) return { facility: null, stockConfirmed: false, alternatives: [] };

  return {
    facility: fallback[0],
    stockConfirmed: false,
    alternatives: fallback.slice(1, 3),
  };
};

module.exports = {
  getOwnedFacility,
  updateOwnedFacility,
  getStock,
  setStock,
  normalizeStock,
  matchByMedicine,
  listMedicineSuggestions: () => COMMON_MEDICINES,
};
