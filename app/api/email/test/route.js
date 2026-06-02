import { NextResponse } from 'next/server';
const { requireAdmin } = require('@/lib/auth');
const logger = require('@/lib/logger');
const { getSmtpConfig, buildTransporter, buildFromAddress, logEmail } = require('@/lib/emailHelpers');
export async function POST(request) {
  const authErr = requireAdmin(request); if (authErr) return authErr;
  try {
    const { to } = await request.json();
    if (!to) return NextResponse.json({ success:false, message:'Recipient email required' },{ status:400 });
    const cfg=await getSmtpConfig(), transporter=buildTransporter(cfg);
    await transporter.sendMail({ from:buildFromAddress(cfg), to, subject:'SimpleUAE — SMTP Test Email ✔',
      html:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;"><h2 style="color:#B8844A;">SimpleUAE Admin Panel</h2><p>SMTP configuration is working correctly.</p><table style="border-collapse:collapse;width:100%;margin:16px 0;"><tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;">SMTP Host</td><td style="padding:8px;">${cfg.smtp_host}</td></tr><tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;">Port</td><td style="padding:8px;">${cfg.smtp_port}</td></tr><tr><td style="padding:8px;background:#f5f5f5;font-weight:bold;">Sent At</td><td style="padding:8px;">${new Date().toLocaleString()}</td></tr></table></div>` });
    await logEmail({ to, subject:'SimpleUAE — SMTP Test Email ✔', type:'test', status:'sent' });
    await logger.log('admin','email.test_sent',`Test email sent to ${to}`);
    return NextResponse.json({ success:true, message:`Test email sent to ${to}` });
  } catch(err) { await logEmail({ to:null, subject:'Test', type:'test', status:'failed', error:err.message }); return NextResponse.json({ success:false, message:err.message },{ status:500 }); }
}
