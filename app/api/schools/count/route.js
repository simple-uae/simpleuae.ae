import { NextResponse } from 'next/server';
const { model } = require('@/lib/jsondb');
const { requireAdmin } = require('@/lib/auth');

const School = model('School');

export async function GET(request) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const total   = await School.countDocuments();
    const live    = await School.countDocuments({ status: 'live' });
    const draft   = await School.countDocuments({ status: 'draft' });
    const pending = await School.countDocuments({ status: 'pending' });
    return NextResponse.json({ success: true, total, live, draft, pending });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
