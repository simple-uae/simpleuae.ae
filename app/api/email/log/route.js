import { NextResponse } from 'next/server';
const { readAll } = require('@/lib/jsondb');
const { requireAdmin } = require('@/lib/auth');

export async function GET(request) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const rows  = readAll('emaillog').slice(0, limit);
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
