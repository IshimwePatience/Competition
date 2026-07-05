require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      `${process.env.CLIENT_URL || 'http://localhost:5173'}/api/v1/auth/google/callback`,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  allowedOrigins: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'https://carelink-frontend-beta.vercel.app',
  ].filter((origin, index, list) => origin && list.indexOf(origin) === index),
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
    lastName: process.env.ADMIN_LAST_NAME || 'CareLink',
  },
  verification: {
    codeExpiryMinutes: 15,
    codeLength: 6,
  },
  credits: {
    reportVerified: 10,
    reportPending: 5,
    healthWorkerBonus: 5,
    checkup: 20,
    bloodDonation: 50,
    screeningCost: 100,
  },
};
