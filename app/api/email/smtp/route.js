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

function saveToSettings(obj) {
  const rows = readAll('settings');
  for (const [key, value] of Object.entries(obj)) {
    const idx = rows.findIndex(r => r.key === key);
    if (idx >= 0) rows[idx].value = value;
    else rows.push({ key, value });
  }
  writeAll('settings', rows);
}

export async function POST(request) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const body = await request.json();
    const { smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, smtp_from_name, smtp_admin_email } = body;
    const toSave = {};
    if (smtp_host        !== undefined) toSave.smtp_host         = smtp_host;
    if (smtp_port        !== undefined) toSave.smtp_port         = smtp_port;
    if (smtp_secure      !== undefined) toSave.smtp_secure       = smtp_secure;
    if (smtp_user        !== undefined) toSave.smtp_user         = smtp_user;
    if (smtp_from_name   !== undefined) toSave.smtp_from_name    = smtp_from_name;
    if (smtp_admin_email !== undefined) toSave.smtp_admin_email  = smtp_admin_email;
    if (smtp_pass && smtp_pass.trim())  toSave.smtp_pass         = smtp_pass;

    saveToSettings(toSave);
    await logger.log('admin', 'email.smtp_saved', `SMTP config updated: ${smtp_host}`);
    return NextResponse.json({ success: true, message: 'SMTP settings saved' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function GET(request) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const cfg = getSmtpConfig();
    delete cfg.smtp_pass;
    return NextResponse.json({ success: true, data: cfg });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
