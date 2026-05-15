import { NextResponse } from 'next/server';
const { model } = require('@/lib/jsondb');
const { verifyToken, requireAdmin } = require('@/lib/auth');
const logger = require('@/lib/logger');
const { seedSchools } = require('@/lib/seed');

const School = model('School');

// Auto-seed real UAE driving schools on first run (when database is empty)
let seeded = false;
async function ensureSeeded() {
  if (seeded) return;
  const count = await School.countDocuments();
  if (count === 0) {
    await seedSchools();
    await logger.log('system', 'db.seeded', 'Database seeded with UAE driving schools on first launch');
  }
  seeded = true;
}

export async function GET(request) {
  try {
    await ensureSeeded();

    const { searchParams } = new URL(request.url);
    const emirate = searchParams.get('emirate');
    const license = searchParams.get('license');
    const status  = searchParams.get('status');
    const search  = searchParams.get('search');
    const sort    = searchParams.get('sort') || 'priceFrom';
    const limit   = parseInt(searchParams.get('limit') || '50');

    const isAdmin = !!(request.headers.get('authorization')?.startsWith('Bearer '));
    const filter  = {};

    if (!isAdmin) {
      filter.status = 'live';
    } else if (status && status !== 'all') {
      filter.status = status;
    }

    if (emirate) filter.emirate = emirate;
    if (license) filter.tags   = { $in: [license] };
    if (search)  filter.$or = [
      { name:     { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
    ];

    const sortMap = {
      priceFrom: { priceFrom: 1 },
      rating:    { rating: -1 },
      name:      { name:  1 },
      newest:    { createdAt: -1 },
    };

    const schools = await School
      .find(filter)
      .sort(sortMap[sort] || { priceFrom: 1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, count: schools.length, data: schools });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const body = await request.json();
    const { name, code, emirate, priceFrom } = body;
    if (!name || !code || !emirate || priceFrom == null) {
      return NextResponse.json({ success: false, message: 'name, code, emirate and priceFrom are required' }, { status: 400 });
    }
    const school = await School.create(body);
    await logger.log('admin', 'school.created', `School "${school.name}" created`, { schoolId: school._id });
    return NextResponse.json({ success: true, data: school }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
