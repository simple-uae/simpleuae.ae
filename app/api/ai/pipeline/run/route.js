import { NextResponse } from 'next/server';
const { requireAdmin } = require('@/lib/auth');
const logger = require('@/lib/logger');
export async function POST(request) {
  const authErr = requireAdmin(request); if (authErr) return authErr;
  try {
    const { autoPublish } = await request.json();
    await logger.log('ai','ai.pipeline',`Full pipeline triggered, autoPublish=${autoPublish}`);
    return NextResponse.json({ success:true, hook:'pipeline', published:false });
  } catch(err) { return NextResponse.json({ success:false, message:err.message },{ status:500 }); }
}
