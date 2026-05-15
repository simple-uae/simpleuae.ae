import { NextResponse } from 'next/server';
const { model } = require('@/lib/jsondb');
const { requireAdmin } = require('@/lib/auth');

const Log = model('Log');

export async function GET(request) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const { searchParams } = new URL(request.url);
    const type   = searchParams.get('type');
    const action = searchParams.get('action');
    const page   = parseInt(searchParams.get('page') || '1');
    const limit  = parseInt(searchParams.get('limit') || '100');

    const filter = {};
    if (type)   filter.type   = type;
    if (action) filter.action = { $regex: action, $options: 'i' };

    const all  = await Log.find(filter).sort({ createdAt: -1 }).lean();
    const skip = (page - 1) * limit;
    const data = all.slice(skip, skip + limit);

    return NextResponse.json({ success: true, total: all.length, data });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

async function clearHandler(request) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    let body = {};
    try { body = await request.json(); } catch {}
    const olderThanDays = body?.olderThanDays || 0;
    if (olderThanDays > 0) {
      const cutoff = new Date(Date.now() - olderThanDays * 86400000).toISOString();
      await Log.deleteMany({ createdAt: { $lt: cutoff } });
    } else {
      await Log.deleteMany({});
    }
    return NextResponse.json({ success: true, message: 'Logs cleared.' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export { clearHandler as DELETE };
