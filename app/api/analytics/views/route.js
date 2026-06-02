import { NextResponse } from 'next/server';
const { model } = require('@/lib/pgdb');
const Analytics = model('analytics');
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')||'30');
    const rows = await Analytics.find({}).sort({ date:1 }).lean();
    const totalViews=rows.reduce((s,r)=>s+(r.pageViews||0),0);
    const totalLeads=rows.reduce((s,r)=>s+(r.leads||0),0);
    return NextResponse.json({ success:true, totalViews, totalLeads, days });
  } catch(err) { return NextResponse.json({ success:false, message:err.message },{ status:500 }); }
}
