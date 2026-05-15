import { NextResponse } from 'next/server';
const { model } = require('@/lib/jsondb');
const { requireAdmin } = require('@/lib/auth');
const logger = require('@/lib/logger');

const Lead = model('Lead');

export async function POST(request) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const { leadId } = await request.json();
    if (!leadId) return NextResponse.json({ success: false, message: 'leadId required' }, { status: 400 });
    const lead = await Lead.findById(leadId);
    if (!lead) return NextResponse.json({ success: false, message: 'Lead not found' }, { status: 404 });
    const aiResult = { score: null, label: null, reason: 'AI filtration not yet connected' };
    await Lead.findByIdAndUpdate(leadId, { aiScore: aiResult.score, aiLabel: aiResult.label, aiReason: aiResult.reason });
    await logger.log('ai', 'ai.filter', `Lead scoring hook called for ${leadId}`);
    return NextResponse.json({ success: true, hook: 'filtration', result: aiResult });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
