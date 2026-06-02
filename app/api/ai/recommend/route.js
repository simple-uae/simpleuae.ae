import { NextResponse } from 'next/server';
const { model } = require('@/lib/pgdb');
const { requireAdmin } = require('@/lib/auth');
const Lead = model('leads'); const School = model('schools');
export async function POST(request) {
  const authErr = requireAdmin(request); if (authErr) return authErr;
  try {
    const { leadId, topN=3 } = await request.json();
    if (!leadId) return NextResponse.json({ success:false, message:'leadId required' },{ status:400 });
    const lead = await Lead.findById(leadId);
    if (!lead) return NextResponse.json({ success:false, message:'Lead not found' },{ status:404 });
    const filter = { status:'live' };
    if (lead.emirates?.length) filter.emirate = { $in: lead.emirates };
    if (lead.licenseType)      filter.tags    = { $in: [lead.licenseType] };
    const schools = await School.find(filter).sort({ rating:-1 }).limit(parseInt(topN)).lean();
    return NextResponse.json({ success:true, hook:'recommend', leadId, recommendations:schools });
  } catch(err) { return NextResponse.json({ success:false, message:err.message },{ status:500 }); }
}
