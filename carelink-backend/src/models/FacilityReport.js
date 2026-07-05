const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FacilityReport = sequelize.define(
    'FacilityReport',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      facilityId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      isOpen: DataTypes.BOOLEAN,
      waitTimeMinutes: DataTypes.INTEGER,
      crowdLevel: {
        type: DataTypes.ENUM('low', 'moderate', 'high'),
      },
      medicineStock: DataTypes.JSONB,
      notes: DataTypes.TEXT,
      status: {
        type: DataTypes.ENUM('pending', 'verified', 'rejected'),
        defaultValue: 'pending',
      },
      verifiedById: DataTypes.UUID,
      creditsAwarded: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    { tableName: 'facility_reports' }
  );

  return FacilityReport;
};
