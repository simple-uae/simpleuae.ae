import { NextResponse } from 'next/server';
const { requireAdmin } = require('@/lib/auth');
const logger = require('@/lib/logger');
const { getSmtpConfig, buildTransporter, buildFromAddress, logEmail } = require('@/lib/emailHelpers');
export async function POST(request) {
  const authErr = requireAdmin(request); if (authErr) return authErr;
  try {
    const { to, subject, body } = await request.json();
    if (!to||!subject||!body) return NextResponse.json({ success:false, message:'to, subject and body required' },{ status:400 });
    const cfg=await getSmtpConfig(), transporter=buildTransporter(cfg);
    const html=`<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">${body.replace(/\n/g,'<br>')}<hr style="margin:32px 0;"><p style="color:#999;font-size:12px;">Sent via SimpleUAE Admin Panel</p></div>`;
    await transporter.sendMail({ from:buildFromAddress(cfg), to, subject, html, text:body });
    await logEmail({ to, subject, type:'manual', status:'sent' });
    await logger.log('admin','email.sent',`Manual email sent to ${to}`,{ subject });
    return NextResponse.json({ success:true, message:`Email sent to ${to}` });
  } catch(err) { await logEmail({ to:null, subject:null, type:'manual', status:'failed', error:err.message }); return NextResponse.json({ success:false, message:err.message },{ status:500 }); }
}
