import { NextResponse } from 'next/server';
const { requireAdmin } = require('@/lib/auth');
const logger = require('@/lib/logger');
export async function POST(request) {
  const authErr = requireAdmin(request); if (authErr) return authErr;
  try {
    const { mode, minRating } = await request.json();
    await logger.log('ai','ai.filter.run',`Filter AI triggered: mode=${mode}, minRating=${minRating}`);
    return NextResponse.json({ success:true, hook:'filter', mode, minRating, passed:0, removed:0 });
  } catch(err) { return NextResponse.json({ success:false, message:err.message },{ status:500 }); }
}
