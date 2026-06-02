import { NextResponse } from 'next/server';
const { model } = require('@/lib/pgdb');
const { requireAdmin } = require('@/lib/auth');
const School=model('schools');
export async function GET(request) {
  const authErr=requireAdmin(request); if(authErr) return authErr;
  try {
    const [total,live,draft,pending]=await Promise.all([School.countDocuments(),School.countDocuments({ status:'live' }),School.countDocuments({ status:'draft' }),School.countDocuments({ status:'pending' })]);
    return NextResponse.json({ success:true, total, live, draft, pending });
  } catch(err) { return NextResponse.json({ success:false, message:err.message },{ status:500 }); }
}
