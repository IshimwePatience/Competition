const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

const User = require('./User')(sequelize);
const Facility = require('./Facility')(sequelize);
const FacilityReport = require('./FacilityReport')(sequelize);
const TriageSession = require('./TriageSession')(sequelize);
const HealthCredit = require('./HealthCredit')(sequelize);
const Notification = require('./Notification')(sequelize);
const PublicUsageLog = require('./PublicUsageLog')(sequelize);

// User associations
User.hasMany(FacilityReport, { foreignKey: 'userId', as: 'reports' });
User.hasMany(TriageSession, { foreignKey: 'userId', as: 'triageSessions' });
User.hasMany(HealthCredit, { foreignKey: 'userId', as: 'credits' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

// Facility associations
Facility.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
User.hasOne(Facility, { foreignKey: 'ownerId', as: 'ownedFacility' });
Facility.hasMany(FacilityReport, { foreignKey: 'facilityId', as: 'reports' });
FacilityReport.belongsTo(Facility, { foreignKey: 'facilityId', as: 'facility' });
FacilityReport.belongsTo(User, { foreignKey: 'userId', as: 'reporter' });
FacilityReport.belongsTo(User, { foreignKey: 'verifiedById', as: 'verifier' });

TriageSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });
HealthCredit.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Facility,
  FacilityReport,
  TriageSession,
  HealthCredit,
  Notification,
  PublicUsageLog,
};
