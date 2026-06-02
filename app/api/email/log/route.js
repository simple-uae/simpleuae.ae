import { NextResponse } from 'next/server';
const { model } = require('@/lib/pgdb');
const { requireAdmin } = require('@/lib/auth');
const EmailLog = model('emaillog');
export async function GET(request) {
  const authErr = requireAdmin(request); if (authErr) return authErr;
  try {
    const { searchParams } = new URL(request.url);
    const limit=parseInt(searchParams.get('limit')||'100');
    const rows=await EmailLog.find({}).sort({ createdAt:-1 }).limit(limit).lean();
    return NextResponse.json({ success:true, data:rows });
  } catch(err) { return NextResponse.json({ success:false, message:err.message },{ status:500 }); }
}
