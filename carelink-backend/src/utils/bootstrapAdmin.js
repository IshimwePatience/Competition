const config = require('../config');
const { User } = require('../models');

const bootstrapAdmin = async () => {
  const existingAdmin = await User.findOne({ where: { role: 'admin' } });
  if (existingAdmin) return;

  const { email, password, firstName, lastName } = config.admin;
  if (!email || !password) {
    console.warn('[Bootstrap] No admin account found. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env');
    return;
  }

  await User.create({
    email,
    password,
    firstName: firstName || 'Admin',
    lastName: lastName || 'CareLink',
    role: 'admin',
    isVerified: true,
    emailVerified: true,
  });

  console.log(`[Bootstrap] Admin account created: ${email}`);
};

module.exports = bootstrapAdmin;
