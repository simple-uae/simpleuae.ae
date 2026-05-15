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
    throw new Error('SMTP not configured. Go to Email panel → SMTP Configuration and fill in your credentials.');
  }
  return nodemailer.createTransport({
    host, port, secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
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

export { getSmtpConfig, buildTransporter, buildFromAddress, logEmail };

export async function POST(request) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const { to } = await request.json();
    if (!to) return NextResponse.json({ success: false, message: 'Recipient email required' }, { status: 400 });

    const cfg         = getSmtpConfig();
    const transporter = buildTransporter(cfg);

    await transporter.sendMail({
      from:    buildFromAddress(cfg),
      to,
      subject: 'SimpleUAE — SMTP Test Email ✓',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#B8844A;">SimpleUAE Admin Panel</h2>
          <p>This is a test email confirming your SMTP configuration is working correctly.</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0;">
            <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;">SMTP Host</td><td style="padding:8px;">${cfg.smtp_host}</td></tr>
            <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;">Port</td><td style="padding:8px;">${cfg.smtp_port}</td></tr>
            <tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;">Sent At</td><td style="padding:8px;">${new Date().toLocaleString()}</td></tr>
          </table>
          <p style="color:#666;font-size:13px;">If you received this, your email system is fully operational.</p>
        </div>
      `,
    });

    logEmail({ to, subject: 'SimpleUAE — SMTP Test Email ✓', type: 'test', status: 'sent' });
    await logger.log('admin', 'email.test_sent', `Test email sent to ${to}`);
    return NextResponse.json({ success: true, message: `Test email sent to ${to}` });
  } catch (err) {
    logEmail({ to: null, subject: 'Test', type: 'test', status: 'failed', error: err.message });
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
