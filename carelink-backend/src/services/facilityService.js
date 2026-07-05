const { Op } = require('sequelize');
const { Facility } = require('../models');
const AppError = require('../utils/AppError');
const { haversineKm } = require('../utils/geo');

const getAll = async ({ type, isOpen, search, page = 1, limit = 20 }) => {
  const where = {};
  if (type) where.type = type;
  if (isOpen !== undefined) where.isOpen = isOpen === 'true' || isOpen === true;
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { address: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const offset = (page - 1) * limit;
  const { rows, count } = await Facility.findAndCountAll({
    where,
    order: [['name', 'ASC']],
    limit,
    offset,
  });

  return { facilities: rows, total: count, page, limit };
};

const getById = async (id) => {
  const facility = await Facility.findByPk(id);
  if (!facility) throw new AppError('Facility not found', 404);
  return facility;
};

const getNearby = async ({ latitude, longitude, radiusKm = 10, type, isOpen }) => {
  if (!latitude || !longitude) {
    throw new AppError('latitude and longitude are required', 400);
  }

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);
  const radius = parseFloat(radiusKm);

  const where = {};
  if (type) where.type = type;
  if (isOpen !== undefined) where.isOpen = isOpen === 'true' || isOpen === true;

  const facilities = await Facility.findAll({ where });

  const nearby = facilities
    .map((f) => ({
      ...f.toJSON(),
      distanceKm: Math.round(haversineKm(lat, lon, f.latitude, f.longitude) * 100) / 100,
    }))
    .filter((f) => f.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return nearby;
};

const create = async (data) => {
  return Facility.create(data);
};

const update = async (id, data) => {
  const facility = await getById(id);
  const allowed = [
    'name', 'type', 'address', 'latitude', 'longitude', 'phone',
    'isOpen', 'waitTimeMinutes', 'crowdLevel', 'medicineStock',
    'services', 'openingHours', 'trustScore',
  ];
  allowed.forEach((key) => {
    if (data[key] !== undefined) facility[key] = data[key];
  });
  facility.lastUpdatedAt = new Date();
  await facility.save();
  return facility;
};

const remove = async (id) => {
  const facility = await getById(id);
  await facility.destroy();
  return { message: 'Facility deleted' };
};

module.exports = { getAll, getById, getNearby, create, update, remove };
