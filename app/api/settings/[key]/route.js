import { NextResponse } from 'next/server';
const { model } = require('@/lib/jsondb');
const { requireAdmin } = require('@/lib/auth');

const Settings = model('Settings');

export async function GET(request, { params }) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const { key } = await params;
    const s = await Settings.findOne({ key });
    if (!s || s.sensitive) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, value: s.value });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
