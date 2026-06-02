import { NextResponse } from 'next/server';
const { model } = require('@/lib/pgdb');
const { requireAdmin } = require('@/lib/auth');
const logger = require('@/lib/logger');
const Settings = model('settings');
async function getSmtpConfig() {
  const rows=await Settings.find({}).lean(); const cfg={};
  ['smtp_host','smtp_port','smtp_secure','smtp_user','smtp_pass','smtp_from_name','smtp_admin_email'].forEach(k=>{ const r=rows.find(r=>r.key===k); if(r) cfg[k]=r.value; });
  return cfg;
}
export async function POST(request) {
  const authErr = requireAdmin(request); if (authErr) return authErr;
  try {
    const body=await request.json();
    const { smtp_host,smtp_port,smtp_secure,smtp_user,smtp_pass,smtp_from_name,smtp_admin_email }=body;
    const toSave={};
    if(smtp_host!==undefined) toSave.smtp_host=smtp_host;
    if(smtp_port!==undefined) toSave.smtp_port=smtp_port;
    if(smtp_secure!==undefined) toSave.smtp_secure=smtp_secure;
    if(smtp_user!==undefined) toSave.smtp_user=smtp_user;
    if(smtp_from_name!==undefined) toSave.smtp_from_name=smtp_from_name;
    if(smtp_admin_email!==undefined) toSave.smtp_admin_email=smtp_admin_email;
    if(smtp_pass&&smtp_pass.trim()) toSave.smtp_pass=smtp_pass;
    for(const[key,value]of Object.entries(toSave)) await Settings.findOneAndUpdate({ key },{ $set:{ value } },{ upsert:true });
    await logger.log('admin','email.smtp_saved',`SMTP config updated: ${smtp_host}`);
    return NextResponse.json({ success:true, message:'SMTP settings saved' });
  } catch(err) { return NextResponse.json({ success:false, message:err.message },{ status:500 }); }
}
export async function GET(request) {
  const authErr = requireAdmin(request); if (authErr) return authErr;
  try { const cfg=await getSmtpConfig(); delete cfg.smtp_pass; return NextResponse.json({ success:true, data:cfg }); }
  catch(err) { return NextResponse.json({ success:false, message:err.message },{ status:500 }); }
}
