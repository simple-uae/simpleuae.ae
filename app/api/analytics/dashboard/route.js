import { NextResponse } from 'next/server';
const { model } = require('@/lib/pgdb');
const { requireAdmin } = require('@/lib/auth');
const Lead=model('leads'),School=model('schools'),Log=model('logs'),Analytics=model('analytics');
export async function GET(request) {
  const authErr = requireAdmin(request); if (authErr) return authErr;
  try {
    const [totalLeads,newLeads,liveSchoolCount,recentLogs] = await Promise.all([
      Lead.countDocuments(), Lead.countDocuments({ status:'new' }),
      School.countDocuments({ status:'live' }),
      Log.find({}).sort({ createdAt:-1 }).limit(20).lean(),
    ]);
    const converted = await Lead.countDocuments({ status:'converted' });
    const convRate = totalLeads>0?Math.round((converted/totalLeads)*100):0;
    const today = new Date().toISOString().slice(0,10);
    const todayA = await Analytics.findOne({ date:today });
    const pageViewsToday = todayA?.pageViews||0;
    const allLeads = await Lead.find({}).lean();
    const byLicense={},byEmirate={},byStatus={};
    allLeads.forEach(l => {
      byLicense[l.licenseType]=(byLicense[l.licenseType]||0)+1;
      (l.emirates||[]).forEach(e=>{byEmirate[e]=(byEmirate[e]||0)+1;});
      byStatus[l.status]=(byStatus[l.status]||0)+1;
    });
    return NextResponse.json({ success:true, data:{ totalLeads,newLeads,converted,convRate,liveSchools:liveSchoolCount,pageViewsToday,byLicense,byEmirate,byStatus,recentActivity:recentLogs } });
  } catch(err) { return NextResponse.json({ success:false, message:err.message },{ status:500 }); }
}
