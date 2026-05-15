import { NextResponse } from 'next/server';
const { requireAdmin } = require('@/lib/auth');
const logger = require('@/lib/logger');

export async function POST(request) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    await logger.log('admin', 'auth.logout', `Admin logged out from ${ip}`, { ip });
    return NextResponse.json({ success: true, message: 'Logged out' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
