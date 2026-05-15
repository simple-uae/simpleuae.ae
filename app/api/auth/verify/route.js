import { NextResponse } from 'next/server';
const { verifyToken } = require('@/lib/auth');

export async function GET(request) {
  const admin = verifyToken(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 401 });
  }
  return NextResponse.json({ success: true, message: 'Token valid', admin });
}
