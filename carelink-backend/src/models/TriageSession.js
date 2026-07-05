const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TriageSession = sequelize.define(
    'TriageSession',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      symptoms: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      urgency: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        allowNull: false,
      },
      recommendedFacility: {
        type: DataTypes.ENUM('pharmacy', 'clinic', 'hospital', 'emergency'),
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      aiRawResponse: DataTypes.JSONB,
    },
    { tableName: 'triage_sessions' }
  );

  return TriageSession;
};
