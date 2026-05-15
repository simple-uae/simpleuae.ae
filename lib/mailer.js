// ================================================================
//  Mailer Service — nodemailer wrapper (optional)
//  If SMTP_HOST is not set, emails are silently skipped.
// ================================================================
const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

exports.sendLeadConfirmation = async (lead) => {
  const t = getTransporter();
  if (!t) return;
  await t.sendMail({
    from:    process.env.EMAIL_FROM || 'SimpleUAE <noreply@simpleuae.com>',
    to:      lead.email,
    subject: 'Your SimpleUAE Comparison Request',
    html: `<p>Hi ${lead.fullName},</p>
           <p>Thank you for submitting your request. We'll send personalised school recommendations shortly.</p>
           <p>License type: <strong>${lead.licenseType}</strong></p>
           <p>Emirates: <strong>${(lead.emirates||[]).join(', ') || '—'}</strong></p>
           <p>The SimpleUAE Team</p>`,
  });
};

exports.sendAdminLeadAlert = async (lead) => {
  const t = getTransporter();
  if (!t) return;
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@simpleuae.com';
  await t.sendMail({
    from:    process.env.EMAIL_FROM || 'SimpleUAE <noreply@simpleuae.com>',
    to:      adminEmail,
    subject: `New Lead: ${lead.fullName} — ${lead.licenseType}`,
    html: `<p>New comparison request received.</p>
           <ul>
             <li>Name: ${lead.fullName}</li>
             <li>Email: ${lead.email}</li>
             <li>Phone: ${lead.phone}</li>
             <li>License: ${lead.licenseType}</li>
             <li>Emirates: ${(lead.emirates||[]).join(', ') || '—'}</li>
           </ul>`,
  });
};

exports.sendWeeklyReport = async () => {
  const t = getTransporter();
  if (!t) return;
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@simpleuae.com';
  await t.sendMail({
    from:    process.env.EMAIL_FROM || 'SimpleUAE <noreply@simpleuae.com>',
    to:      adminEmail,
    subject: 'SimpleUAE Weekly Report',
    html:    '<p>Weekly summary — check your admin panel for details.</p>',
  });
};
