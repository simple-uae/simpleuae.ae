import { NextResponse } from 'next/server';
const { model } = require('@/lib/jsondb');
const { requireAdmin } = require('@/lib/auth');

const Analytics = model('Analytics');

export async function GET(request) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const rows = await Analytics.find({}).sort({ date: 1 }).lean();

    const map = {};
    rows.forEach(r => { map[r.date] = r; });

    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({
        date:        key,
        pageViews:   map[key]?.pageViews   || 0,
        comparisons: map[key]?.comparisons || 0,
        leads:       map[key]?.leads       || 0,
      });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
