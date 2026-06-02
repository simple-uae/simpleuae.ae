const nodemailer = require('nodemailer');
const { model } = require('@/lib/pgdb');
const EmailLog = model('emaillog');
async function getSmtpConfig() {
  const Settings = model('settings');
  const rows = await Settings.find({}).lean();
  const cfg = {};
  ['smtp_host','smtp_port','smtp_secure','smtp_user','smtp_pass','smtp_from_name','smtp_admin_email'].forEach(k => {
    const r = rows.find(r => r.key === k); if (r) cfg[k] = r.value;
  });
  return cfg;
}
function buildTransporter(cfg) {
  const host=cfg.smtp_host||process.env.SMTP_HOST, port=parseInt(cfg.smtp_port||process.env.SMTP_PORT||'587');
  const secure=(cfg.smtp_secure||process.env.SMTP_SECURE)==='true';
  const user=cfg.smtp_user||process.env.SMTP_USER, pass=cfg.smtp_pass||process.env.SMTP_PASS;
  if (!host||!user||!pass) throw new Error('SMTP not configured.');
  return nodemailer.createTransport({ host, port, secure, auth:{ user, pass }, tls:{ rejectUnauthorized:false } });
}
function buildFromAddress(cfg) {
  const name=cfg.smtp_from_name||process.env.SMTP_FROM_NAME||'SimpleUAE';
  const email=cfg.smtp_user||process.env.SMTP_USER||'noreply@simpleuae.com';
  return `${name} <${email}>`;
}
async function logEmail(entry) {
  try { await EmailLog.create(entry); } catch(e) { console.error('Email log error:', e.message); }
}
module.exports = { getSmtpConfig, buildTransporter, buildFromAddress, logEmail };
