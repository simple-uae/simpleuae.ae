import { NextResponse } from 'next/server';
const { model } = require('@/lib/jsondb');
const { requireAdmin } = require('@/lib/auth');
const logger = require('@/lib/logger');

const Lead = model('Lead');

export async function GET(request, { params }) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const lead = await Lead.findById(id);
    if (!lead) return NextResponse.json({ success: false, message: 'Lead not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: lead });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const { status, notes, assignedSchool, aiScore, aiLabel, aiReason } = await request.json();
    const update = {};
    if (status !== undefined)         update.status         = status;
    if (notes !== undefined)          update.notes          = notes;
    if (assignedSchool !== undefined) update.assignedSchool = assignedSchool;
    if (aiScore  !== undefined)       update.aiScore        = aiScore;
    if (aiLabel  !== undefined)       update.aiLabel        = aiLabel;
    if (aiReason !== undefined)       update.aiReason       = aiReason;

    const lead = await Lead.findByIdAndUpdate(id, update, { new: true });
    if (!lead) return NextResponse.json({ success: false, message: 'Lead not found' }, { status: 404 });
    await logger.log('admin', 'lead.updated', `Lead ${lead.fullName} updated`, { leadId: lead._id });
    return NextResponse.json({ success: true, data: lead });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const lead = await Lead.findByIdAndDelete(id);
    if (!lead) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    await logger.log('admin', 'lead.deleted', `Lead ${lead.fullName} deleted`, { leadId: id });
    return NextResponse.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
