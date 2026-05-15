import { NextResponse } from 'next/server';
const bcrypt = require('bcryptjs');
const { requireAdmin } = require('@/lib/auth');
const { model } = require('@/lib/jsondb');
const logger = require('@/lib/logger');

const Settings = model('Settings');

export async function PUT(request) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const { newKey } = await request.json();
    if (!newKey || newKey.length < 8) {
      return NextResponse.json({ success: false, message: 'Key must be at least 8 characters' }, { status: 400 });
    }
    const hash = await bcrypt.hash(newKey, 10);
    await Settings.findOneAndUpdate(
      { key: 'admin_key_hash' },
      { key: 'admin_key_hash', value: hash, sensitive: true },
      { upsert: true }
    );
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    await logger.log('admin', 'auth.key_changed', 'Admin key updated', { ip });
    return NextResponse.json({ success: true, message: 'Admin key updated. New key is active immediately.' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
