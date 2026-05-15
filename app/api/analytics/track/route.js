import { NextResponse } from 'next/server';
const { model } = require('@/lib/jsondb');

const Analytics = model('Analytics');

export async function POST(request) {
  try {
    const { page, event } = await request.json();
    const today = new Date().toISOString().slice(0, 10);
    const inc   = { pageViews: 1 };
    if (event === 'comparison') inc.comparisons = 1;
    await Analytics.findOneAndUpdate({ date: today }, { $inc: inc }, { upsert: true });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
