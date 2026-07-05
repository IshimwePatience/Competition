const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Facility = sequelize.define(
    'Facility',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('pharmacy', 'clinic', 'hospital', 'emergency'),
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      latitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      longitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      phone: DataTypes.STRING,
      isOpen: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      waitTimeMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      crowdLevel: {
        type: DataTypes.ENUM('low', 'moderate', 'high'),
        defaultValue: 'low',
      },
      medicineStock: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      services: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      openingHours: {
        type: DataTypes.STRING,
        defaultValue: 'Mon-Fri 8:00-17:00',
      },
      lastUpdatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      trustScore: {
        type: DataTypes.FLOAT,
        defaultValue: 1.0,
      },
      ownerId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    { tableName: 'facilities' }
  );

  return Facility;
};
