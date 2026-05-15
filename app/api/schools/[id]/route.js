import { NextResponse } from 'next/server';
const { model } = require('@/lib/jsondb');
const { requireAdmin } = require('@/lib/auth');
const logger = require('@/lib/logger');

const School = model('School');

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const school = await School.findById(id);
    if (!school) return NextResponse.json({ success: false, message: 'School not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: school });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const body = await request.json();
    const school = await School.findByIdAndUpdate(id, body, { new: true });
    if (!school) return NextResponse.json({ success: false, message: 'School not found' }, { status: 404 });
    await logger.log('admin', 'school.updated', `School "${school.name}" updated`, { schoolId: school._id });
    return NextResponse.json({ success: true, data: school });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const school = await School.findByIdAndDelete(id);
    if (!school) return NextResponse.json({ success: false, message: 'School not found' }, { status: 404 });
    await logger.log('admin', 'school.deleted', `School "${school.name}" deleted`, { schoolId: id });
    return NextResponse.json({ success: true, message: 'School deleted' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
