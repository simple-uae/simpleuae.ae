import { NextResponse } from 'next/server';
const { model } = require('@/lib/jsondb');

const Analytics = model('Analytics');

export async function POST(request) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    await Analytics.findOneAndUpdate({ date: today }, { $inc: { pageViews: 1 } }, { upsert: true });
  } catch (e) {}
  return NextResponse.json({ success: true });
}
