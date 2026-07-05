const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PublicUsageLog = sequelize.define(
    'PublicUsageLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: DataTypes.ENUM('symptoms', 'medicine_search'),
        allowNull: false,
      },
      details: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
    },
    { tableName: 'public_usage_logs' }
  );

  return PublicUsageLog;
};
