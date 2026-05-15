import { NextResponse } from 'next/server';
const { model } = require('@/lib/jsondb');
const { requireAdmin } = require('@/lib/auth');

const Log = model('Log');

export async function DELETE(request) {
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
