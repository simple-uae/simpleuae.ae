import { NextResponse } from 'next/server';
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { model } = require('@/lib/jsondb');
const logger   = require('@/lib/logger');

const Settings = model('Settings');

// Simple in-memory rate limiter for auth (max 20 per 15min per IP)
const authAttempts = new Map();

function checkAuthRateLimit(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const max = parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20');
  const entry = authAttempts.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    authAttempts.set(ip, { count: 1, start: now });
    return false;
  }
  if (entry.count >= max) return true;
  entry.count++;
  authAttempts.set(ip, entry);
  return false;
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (checkAuthRateLimit(ip)) {
      return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
    }

    const { key } = await request.json();
    if (!key) return NextResponse.json({ success: false, message: 'Admin key required' }, { status: 400 });

    const storedSetting = await Settings.findOne({ key: 'admin_key_hash' });
    const storedHash    = storedSetting?.value || process.env.ADMIN_KEY_HASH;

    let valid = false;
    if (storedHash && storedHash !== '$2a$10$CHANGEME_USE_bcryptjs_hash_of_your_real_key') {
      valid = await bcrypt.compare(key, storedHash);
    } else {
      const plainKey = process.env.ADMIN_PLAIN_KEY || 'SIMPLEAE2025';
      valid = (key === plainKey);
    }

    if (!valid) {
      await logger.log('admin', 'auth.failed', `Failed login attempt from ${ip}`, { ip });
      return NextResponse.json({ success: false, message: 'Invalid admin key' }, { status: 401 });
    }

    const token = jwt.sign(
      { isAdmin: true, ip },
      process.env.JWT_SECRET || 'fallback_secret_change_me',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    await logger.log('admin', 'auth.login', `Admin logged in from ${ip}`, { ip });
    return NextResponse.json({ success: true, token });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
