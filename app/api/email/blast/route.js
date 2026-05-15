import { NextResponse } from 'next/server';
const nodemailer = require('nodemailer');
const { readAll, writeAll, model } = require('@/lib/jsondb');
const { requireAdmin } = require('@/lib/auth');
const logger = require('@/lib/logger');


const Lead = model('Lead');

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
  if (!host || !user || !pass) throw new Error('SMTP not configured.');
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
    const { subject, body, status = 'new' } = await request.json();
    if (!subject || !body) {
      return NextResponse.json({ success: false, message: 'subject and body required' }, { status: 400 });
    }

    const cfg         = getSmtpConfig();
    const transporter = buildTransporter(cfg);
    const from        = buildFromAddress(cfg);

    const filter = status === 'all' ? {} : { status };
    const leads  = await Lead.find(filter).lean();

    if (!leads.length) {
      return NextResponse.json({ success: true, count: 0, message: 'No matching leads found' });
    }

    let sentCount = 0;
    const errors  = [];

    for (const lead of leads) {
      const personalBody = body
        .replace(/{name}/gi,    lead.fullName  || 'there')
        .replace(/{license}/gi, lead.licenseType || '')
        .replace(/{emirate}/gi, (lead.emirates || []).join(', ') || 'UAE');

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          ${personalBody.replace(/\n/g, '<br>')}
          <hr style="margin:32px 0;border:none;border-top:1px solid #eee;">
          <p style="color:#999;font-size:12px;">SimpleUAE · UAE Driving School Comparison</p>
        </div>
      `;

      try {
        await transporter.sendMail({ from, to: lead.email, subject, html, text: personalBody });
        logEmail({ to: lead.email, subject, type: 'blast', status: 'sent', leadId: lead._id });
        sentCount++;
      } catch (e) {
        errors.push({ email: lead.email, error: e.message });
        logEmail({ to: lead.email, subject, type: 'blast', status: 'failed', error: e.message });
      }
      await new Promise(r => setTimeout(r, 100));
    }

    await logger.log('admin', 'email.blast', `Blast sent to ${sentCount}/${leads.length} leads`, { subject, errors: errors.length });
    return NextResponse.json({ success: true, count: sentCount, total: leads.length, errors });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
