const facilityOwnerService = require('../services/facilityOwnerService');

const getMine = async (req, res, next) => {
  try {
    const facility = await facilityOwnerService.getOwnedFacility(req.user.id);
    res.json({ success: true, data: facility });
  } catch (err) {
    next(err);
  }
};

const updateMine = async (req, res, next) => {
  try {
    const facility = await facilityOwnerService.updateOwnedFacility(req.user.id, req.body);
    res.json({ success: true, data: facility });
  } catch (err) {
    next(err);
  }
};

const getStock = async (req, res, next) => {
  try {
    const stock = await facilityOwnerService.getStock(req.user.id);
    res.json({ success: true, data: stock });
  } catch (err) {
    next(err);
  }
};

const setStock = async (req, res, next) => {
  try {
    const stock = await facilityOwnerService.setStock(req.user.id, req.body.medicineStock);
    res.json({ success: true, data: stock });
  } catch (err) {
    next(err);
  }
};

const medicineSuggestions = async (req, res) => {
  res.json({ success: true, data: facilityOwnerService.listMedicineSuggestions() });
};

module.exports = { getMine, updateMine, getStock, setStock, medicineSuggestions };
