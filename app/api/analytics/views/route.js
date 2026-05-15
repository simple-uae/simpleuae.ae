import { NextResponse } from 'next/server';
const { model } = require('@/lib/jsondb');

const Analytics = model('Analytics');

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const rows = await Analytics.find({}).sort({ date: 1 }).lean();
    const totalViews = rows.reduce((sum, r) => sum + (r.pageViews || 0), 0);
    const totalLeads = rows.reduce((sum, r) => sum + (r.leads || 0), 0);
    return NextResponse.json({ success: true, totalViews, totalLeads, days });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
