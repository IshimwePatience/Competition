const config = require('../config');
const { User, sequelize } = require('../models');
const { normalizeEmail, emailWhere } = require('./email');

const applyAdminFields = (user, { normalizedEmail, password, firstName, lastName }) => {
  user.email = normalizedEmail;
  user.role = 'admin';
  user.password = password;
  user.firstName = firstName || user.firstName;
  user.lastName = lastName || user.lastName;
  user.isVerified = true;
  user.emailVerified = true;
};

const bootstrapAdmin = async () => {
  const { email, password, firstName, lastName } = config.admin;
  if (!email || !password) {
    console.warn('[Bootstrap] Set ADMIN_EMAIL and ADMIN_PASSWORD in .env to create the admin account');
    return;
  }

  const normalizedEmail = normalizeEmail(email);

  const matches = await User.findAll({ where: emailWhere(sequelize, normalizedEmail) });

  if (matches.length > 1) {
    const keeper = matches.find((u) => u.role === 'admin') || matches[0];
    for (const dup of matches) {
      if (dup.id === keeper.id) continue;
      if (!keeper.googleId && dup.googleId) keeper.googleId = dup.googleId;
      if (keeper.authProvider !== 'google' && dup.authProvider === 'google') {
        keeper.authProvider = 'google';
      }
      await dup.destroy();
    }
    applyAdminFields(keeper, { normalizedEmail, password, firstName, lastName });
    await keeper.save();
    console.log(`[Bootstrap] Admin ready (merged duplicates): ${normalizedEmail}`);
    return;
  }

  if (matches.length === 1) {
    applyAdminFields(matches[0], { normalizedEmail, password, firstName, lastName });
    await matches[0].save();
    console.log(`[Bootstrap] Admin ready: ${normalizedEmail}`);
    return;
  }

  const legacyAdmin = await User.findOne({ where: { role: 'admin' } });
  if (legacyAdmin) {
    applyAdminFields(legacyAdmin, { normalizedEmail, password, firstName, lastName });
    await legacyAdmin.save();
    console.log(`[Bootstrap] Admin account updated to: ${normalizedEmail}`);
    return;
  }

  await User.create({
    email: normalizedEmail,
    password,
    firstName: firstName || 'Admin',
    lastName: lastName || 'CareLink',
    role: 'admin',
    isVerified: true,
    emailVerified: true,
  });

  console.log(`[Bootstrap] Admin account created: ${normalizedEmail}`);
};

module.exports = bootstrapAdmin;
