const facilityService = require('../services/facilityService');

const getAll = async (req, res, next) => {
  try {
    const result = await facilityService.getAll(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const facility = await facilityService.getById(req.params.id);
    res.json({ success: true, data: facility });
  } catch (err) {
    next(err);
  }
};

const getNearby = async (req, res, next) => {
  try {
    const facilities = await facilityService.getNearby(req.query);
    res.json({ success: true, data: facilities });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const facility = await facilityService.create(req.body);
    res.status(201).json({ success: true, data: facility });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const facility = await facilityService.update(req.params.id, req.body);
    res.json({ success: true, data: facility });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await facilityService.remove(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, getNearby, create, update, remove };
