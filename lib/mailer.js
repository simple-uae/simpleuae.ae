const nodemailer = require('nodemailer');
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({ host:process.env.SMTP_HOST, port:parseInt(process.env.SMTP_PORT||'587'), secure:process.env.SMTP_SECURE==='true', auth:{ user:process.env.SMTP_USER, pass:process.env.SMTP_PASS } });
  return transporter;
}
exports.sendLeadConfirmation = async (lead) => {
  const t = getTransporter(); if (!t) return;
  await t.sendMail({ from:process.env.EMAIL_FROM||'SimpleUAE <noreply@simpleuae.com>', to:lead.email, subject:'Your SimpleUAE Comparison Request',
    html:`<p>Hi ${lead.fullName},</p><p>Thank you for submitting your request. We'll send personalised school recommendations shortly.</p><p>License type: <strong>${lead.licenseType}</strong></p><p>Emirates: <strong>${(lead.emirates||[]).join(', ')||'—'}</strong></p><p>The SimpleUAE Team</p>` });
};
exports.sendAdminLeadAlert = async (lead) => {
  const t = getTransporter(); if (!t) return;
  await t.sendMail({ from:process.env.EMAIL_FROM||'SimpleUAE <noreply@simpleuae.com>', to:process.env.ADMIN_EMAIL||'admin@simpleuae.com', subject:`New Lead: ${lead.fullName} — ${lead.licenseType}`,
    html:`<p>New comparison request received.</p><ul><li>Name: ${lead.fullName}</li><li>Email: ${lead.email}</li><li>Phone: ${lead.phone}</li><li>License: ${lead.licenseType}</li><li>Emirates: ${(lead.emirates||[]).join(', ')||'—'}</li></ul>` });
};
