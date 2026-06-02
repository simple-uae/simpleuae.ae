import { NextResponse } from 'next/server';
const { model } = require('@/lib/pgdb');
const { requireAdmin } = require('@/lib/auth');
const logger = require('@/lib/logger');
const { getSmtpConfig, buildTransporter, buildFromAddress, logEmail } = require('@/lib/emailHelpers');
const Lead = model('leads');
export async function POST(request) {
  const authErr = requireAdmin(request); if (authErr) return authErr;
  try {
    const { subject, body, status='new' } = await request.json();
    if (!subject||!body) return NextResponse.json({ success:false, message:'subject and body required' },{ status:400 });
    const cfg=await getSmtpConfig(), transporter=buildTransporter(cfg), from=buildFromAddress(cfg);
    const filter=status==='all'?{}:{ status };
    const leads=await Lead.find(filter).lean();
    if (!leads.length) return NextResponse.json({ success:true, count:0, message:'No matching leads found' });
    let sentCount=0; const errors=[];
    for (const lead of leads) {
      const personalBody=body.replace(/{name}/gi,lead.fullName||'there').replace(/{license}/gi,lead.licenseType||'').replace(/{emirate}/gi,(lead.emirates||[]).join(', ')||'UAE');
      const html=`<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">${personalBody.replace(/\n/g,'<br>')}<hr style="margin:32px 0;border:none;border-top:1px solid #eee;"><p style="color:#999;font-size:12px;">SimpleUAE · UAE Driving School Comparison</p></div>`;
      try { await transporter.sendMail({ from, to:lead.email, subject, html, text:personalBody }); await logEmail({ to:lead.email, subject, type:'blast', status:'sent', leadId:lead._id }); sentCount++; }
      catch(e) { errors.push({ email:lead.email, error:e.message }); await logEmail({ to:lead.email, subject, type:'blast', status:'failed', error:e.message }); }
      await new Promise(r=>setTimeout(r,100));
    }
    await logger.log('admin','email.blast',`Blast sent to ${sentCount}/${leads.length} leads`,{ subject, errors:errors.length });
    return NextResponse.json({ success:true, count:sentCount, total:leads.length, errors });
  } catch(err) { return NextResponse.json({ success:false, message:err.message },{ status:500 }); }
}
