import { NextResponse } from 'next/server';
const logger = require('@/lib/logger');

export async function POST(request) {
  try {
    const { query } = await request.json();
    if (!query) return NextResponse.json({ success: false, message: 'query required' }, { status: 400 });
    const results = [];
    await logger.log('ai', 'ai.search', `Searcher hook: "${query}"`);
    return NextResponse.json({ success: true, hook: 'searcher', query, results });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
