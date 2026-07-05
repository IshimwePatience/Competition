const { OAuth2Client } = require('google-auth-library');
const config = require('../config');
const AppError = require('../utils/AppError');

const getClient = () => {
  if (!config.google.clientId) {
    throw new AppError('Google OAuth is not configured', 503);
  }
  return new OAuth2Client(
    config.google.clientId,
    config.google.clientSecret,
    config.google.callbackUrl
  );
};

const verifyIdToken = async (idToken) => {
  const client = getClient();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: config.google.clientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new AppError('Google account email not available', 400);
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    firstName: payload.given_name || 'User',
    lastName: payload.family_name || '',
    emailVerified: payload.email_verified === true,
    picture: payload.picture,
  };
};

const getAuthUrl = () => {
  const client = getClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    prompt: 'select_account',
  });
};

const exchangeCodeForProfile = async (code) => {
  const client = getClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) {
    throw new AppError('Failed to get Google ID token', 400);
  }
  return verifyIdToken(tokens.id_token);
};

module.exports = { verifyIdToken, getAuthUrl, exchangeCodeForProfile };
