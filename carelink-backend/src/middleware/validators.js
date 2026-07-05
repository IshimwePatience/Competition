const { body, query, param } = require('express-validator');

const registerRules = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().notEmpty().withMessage('Last name required'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

const triageRules = [
  body('symptoms').trim().isLength({ min: 3, max: 2000 }).withMessage('Describe symptoms (3-2000 chars)'),
];

const facilityCreateRules = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('type').isIn(['pharmacy', 'clinic', 'hospital', 'emergency']).withMessage('Invalid facility type'),
  body('address').trim().notEmpty().withMessage('Address required'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('phone').optional().isString(),
  body('isOpen').optional().isBoolean(),
  body('waitTimeMinutes').optional().isInt({ min: 0 }),
  body('crowdLevel').optional().isIn(['low', 'moderate', 'high']),
  body('medicineStock').optional().isArray(),
  body('services').optional().isArray(),
];

const reportRules = [
  body('isOpen').optional().isBoolean(),
  body('waitTimeMinutes').optional().isInt({ min: 0 }),
  body('crowdLevel').optional().isIn(['low', 'moderate', 'high']),
  body('medicineStock').optional().isArray(),
  body('notes').optional().isString().isLength({ max: 500 }),
];

const nearbyRules = [
  query('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  query('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  query('radiusKm').optional().isFloat({ min: 0.1, max: 100 }),
  query('type').optional().isIn(['pharmacy', 'clinic', 'hospital', 'emergency']),
  query('isOpen').optional().isBoolean(),
];

const creditActionRules = [
  body('actionType').isIn(['checkup', 'blood_donation']).withMessage('Invalid action type'),
  body('description').optional().isString(),
];

const uuidParam = (name) => param(name).isUUID().withMessage(`Valid ${name} required`);

const facilityRegisterRules = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().notEmpty().withMessage('Contact first name required'),
  body('lastName').trim().notEmpty().withMessage('Contact last name required'),
  body('facilityName').trim().notEmpty().withMessage('Facility name required'),
  body('facilityType').isIn(['clinic', 'pharmacy']).withMessage('Facility type must be clinic or pharmacy'),
  body('address').trim().notEmpty().withMessage('Address required'),
  body('phone').optional().isString(),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('openingHours').optional().isString(),
];

const publicTriageRules = [
  body('symptoms').isArray({ min: 1 }).withMessage('Select at least one symptom'),
  body('symptoms.*').trim().notEmpty(),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
];

const stockRules = [
  body('medicineStock').isArray().withMessage('Medicine stock must be an array'),
  body('medicineStock.*.name').trim().notEmpty(),
  body('medicineStock.*.quantity').optional().isInt({ min: 0 }),
  body('medicineStock.*.status').optional().isIn(['in_stock', 'low_stock', 'out_of_stock']),
  body('medicineStock.*.category').optional().isString(),
];

module.exports = {
  registerRules,
  loginRules,
  facilityRegisterRules,
  publicTriageRules,
  stockRules,
  triageRules,
  facilityCreateRules,
  reportRules,
  nearbyRules,
  creditActionRules,
  uuidParam,
};
