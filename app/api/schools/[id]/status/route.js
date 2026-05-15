import { NextResponse } from 'next/server';
const { model } = require('@/lib/jsondb');
const { requireAdmin } = require('@/lib/auth');
const logger = require('@/lib/logger');

const School = model('School');

export async function PATCH(request, { params }) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const { status } = await request.json();
    if (!['live','pending','draft'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
    }
    const school = await School.findByIdAndUpdate(id, { status }, { new: true });
    if (!school) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    await logger.log('admin', 'school.status', `School "${school.name}" → ${status}`, { schoolId: school._id });
    return NextResponse.json({ success: true, data: school });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
