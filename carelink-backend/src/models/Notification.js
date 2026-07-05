const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define(
    'Notification',
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
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('campaign', 'checkup', 'alert', 'credit', 'system'),
        defaultValue: 'system',
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      metadata: DataTypes.JSONB,
    },
    { tableName: 'notifications' }
  );

  return Notification;
};
