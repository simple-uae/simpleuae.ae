import { NextResponse } from 'next/server';
const nodemailer = require('nodemailer');
const { readAll, writeAll } = require('@/lib/jsondb');
const { requireAdmin } = require('@/lib/auth');
const logger = require('@/lib/logger');


function getSmtpConfig() {
  const rows = readAll('settings');
  const cfg  = {};
  const keys = ['smtp_host','smtp_port','smtp_secure','smtp_user','smtp_pass','smtp_from_name','smtp_admin_email'];
  rows.forEach(r => { if (keys.includes(r.key)) cfg[r.key] = r.value; });
  return cfg;
}

function buildTransporter(cfg) {
  const host   = cfg.smtp_host   || process.env.SMTP_HOST;
  const port   = parseInt(cfg.smtp_port || process.env.SMTP_PORT || '587');
  const secure = (cfg.smtp_secure || process.env.SMTP_SECURE) === 'true';
  const user   = cfg.smtp_user   || process.env.SMTP_USER;
  const pass   = cfg.smtp_pass   || process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error('SMTP not configured.');
  }
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass }, tls: { rejectUnauthorized: false } });
}

function buildFromAddress(cfg) {
  const name  = cfg.smtp_from_name || process.env.SMTP_FROM_NAME || 'SimpleUAE';
  const email = cfg.smtp_user       || process.env.SMTP_USER       || 'noreply@simpleuae.com';
  return `${name} <${email}>`;
}

function logEmail(entry) {
  const rows = readAll('emaillog');
  rows.unshift({ _id: crypto.randomUUID(), ...entry, createdAt: new Date().toISOString() });
  writeAll('emaillog', rows.slice(0, 500));
}

export async function POST(request) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const { to, subject, body } = await request.json();
    if (!to || !subject || !body) {
      return NextResponse.json({ success: false, message: 'to, subject and body required' }, { status: 400 });
    }

    const cfg         = getSmtpConfig();
    const transporter = buildTransporter(cfg);
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        ${body.replace(/\n/g, '<br>')}
        <hr style="margin:32px 0;border:none;border-top:1px solid #eee;">
        <p style="color:#999;font-size:12px;">
          Sent via SimpleUAE Admin Panel · <a href="https://simpleuae.com" style="color:#B8844A;">simpleuae.com</a>
        </p>
      </div>
    `;

    await transporter.sendMail({ from: buildFromAddress(cfg), to, subject, html, text: body });
    logEmail({ to, subject, type: 'manual', status: 'sent' });
    await logger.log('admin', 'email.sent', `Manual email sent to ${to}`, { subject });
    return NextResponse.json({ success: true, message: `Email sent to ${to}` });
  } catch (err) {
    logEmail({ to: null, subject: null, type: 'manual', status: 'failed', error: err.message });
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
