const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('user', 'health_worker', 'admin'),
        defaultValue: 'user',
      },
      authProvider: {
        type: DataTypes.ENUM('local', 'google'),
        defaultValue: 'local',
      },
      googleId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      emailVerificationCode: DataTypes.STRING,
      emailVerificationExpires: DataTypes.DATE,
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      healthCredits: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      latitude: DataTypes.FLOAT,
      longitude: DataTypes.FLOAT,
    },
    {
      tableName: 'users',
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password') && user.password) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        },
      },
    }
  );

  User.prototype.comparePassword = function (candidate) {
    if (!this.password) return Promise.resolve(false);
    return bcrypt.compare(candidate, this.password);
  };

  User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    delete values.emailVerificationCode;
    delete values.emailVerificationExpires;
    return values;
  };

  return User;
};
