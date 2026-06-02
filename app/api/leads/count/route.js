import { NextResponse } from 'next/server';
const { model } = require('@/lib/pgdb');
const { requireAdmin } = require('@/lib/auth');
const Lead=model('leads');
export async function GET(request) {
  const authErr=requireAdmin(request); if(authErr) return authErr;
  try {
    const [total,newLeads,contacted,converted]=await Promise.all([Lead.countDocuments(),Lead.countDocuments({ status:'new' }),Lead.countDocuments({ status:'contacted' }),Lead.countDocuments({ status:'converted' })]);
    return NextResponse.json({ success:true, total, new:newLeads, contacted, converted });
  } catch(err) { return NextResponse.json({ success:false, message:err.message },{ status:500 }); }
}
