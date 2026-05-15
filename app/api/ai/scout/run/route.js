import { NextResponse } from 'next/server';
const { requireAdmin } = require('@/lib/auth');
const logger = require('@/lib/logger');

export async function POST(request) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const { task, emirate } = await request.json();
    await logger.log('ai', 'ai.scout', `Scout AI triggered: "${task}" / ${emirate}`);
    const results = [];
    return NextResponse.json({ success: true, hook: 'searcher', task, emirate, results });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
