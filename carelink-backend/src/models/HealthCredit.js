const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HealthCredit = sequelize.define(
    'HealthCredit',
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
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(
          'report',
          'checkup',
          'blood_donation',
          'redemption',
          'bonus',
          'admin_grant'
        ),
        allowNull: false,
      },
      description: DataTypes.STRING,
      referenceId: DataTypes.UUID,
    },
    { tableName: 'health_credits' }
  );

  return HealthCredit;
};
