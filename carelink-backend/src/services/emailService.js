const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!config.smtp.host || !config.smtp.user || !config.smtp.pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  return transporter;
};

const sendVerificationEmail = async (email, firstName, code) => {
  const transport = getTransporter();

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#0d9488">CareLink — Verify Your Email</h2>
      <p>Hi ${firstName},</p>
      <p>Your verification code is:</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#0d9488">${code}</p>
      <p>This code expires in ${config.verification.codeExpiryMinutes} minutes.</p>
      <p>If you didn't register, ignore this email.</p>
    </div>
  `;

  if (!transport) {
    console.warn('[Email] SMTP not configured. Verification code:', code);
    return { sent: false, devCode: code };
  }

  await transport.sendMail({
    from: `"CareLink" <${config.smtp.from}>`,
    to: email,
    subject: 'CareLink — Your verification code',
    html,
  });

  return { sent: true };
};

module.exports = { sendVerificationEmail };
