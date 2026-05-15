import { NextResponse } from 'next/server';
const { model } = require('@/lib/jsondb');
const { requireAdmin } = require('@/lib/auth');
const mailer = require('@/lib/mailer');
const logger = require('@/lib/logger');

const Lead      = model('Lead');
const Analytics = model('Analytics');

// Simple in-memory lead rate limiter (10 per hour per IP)
const leadAttempts = new Map();
function checkLeadRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const entry = leadAttempts.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    leadAttempts.set(ip, { count: 1, start: now });
    return false;
  }
  if (entry.count >= 10) return true;
  entry.count++;
  leadAttempts.set(ip, entry);
  return false;
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (checkLeadRateLimit(ip)) {
      return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const {
      fullName, email, phone,
      licenseType, homeCountryLicense, priorExperience,
      emirates, additionalInfo, consent,
      engineSize, bikePurpose, busUse, busOp,
      truckCargo, hgvType, hgvPurpose,
      forkliftType, forkliftIndustry,
      equipType, equipProject,
    } = body;

    if (!fullName || !email || !phone || !licenseType || !homeCountryLicense) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    if (consent !== 'true' && consent !== true) {
      return NextResponse.json({ success: false, message: 'Consent required' }, { status: 400 });
    }

    const lead = await Lead.create({
      fullName: fullName.trim(),
      email:    email.trim().toLowerCase(),
      phone:    phone.trim(),
      licenseType,
      homeCountryLicense,
      priorExperience: priorExperience || 'N/A',
      emirates: Array.isArray(emirates) ? emirates : (emirates ? [emirates] : []),
      additionalInfo: additionalInfo || '',
      consent: true,
      status: 'new',
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || '',
      referrer:  request.headers.get('referer')   || '',
      source:    'comparison-form',
      vehicleDetails: {
        engineSize, bikePurpose, busUse, busOp,
        truckCargo, hgvType, hgvPurpose,
        forkliftType, forkliftIndustry,
        equipType, equipProject,
      },
      aiScore: null, aiLabel: null, aiReason: null,
    });

    const today = new Date().toISOString().slice(0, 10);
    await Analytics.findOneAndUpdate(
      { date: today },
      { $inc: { leads: 1 } },
      { upsert: true }
    ).catch(() => {});

    mailer.sendLeadConfirmation(lead).catch(e => console.warn('Email error:', e.message));
    mailer.sendAdminLeadAlert(lead).catch(e => console.warn('Admin email error:', e.message));

    await logger.log('lead', 'lead.submitted', `New lead: ${fullName} — ${licenseType}`, {
      leadId: lead._id, email, licenseType,
    });

    return NextResponse.json({
      success: true,
      message: `Thank you ${fullName}! We'll send personalised recommendations to ${email} shortly.`,
      leadId: lead._id,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function GET(request) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const { searchParams } = new URL(request.url);
    const status      = searchParams.get('status');
    const licenseType = searchParams.get('licenseType');
    const emirate     = searchParams.get('emirate');
    const search      = searchParams.get('search');
    const page        = parseInt(searchParams.get('page') || '1');
    const limit       = parseInt(searchParams.get('limit') || '50');

    const filter = {};
    if (status)      filter.status      = status;
    if (licenseType) filter.licenseType = licenseType;
    if (emirate)     filter.emirates    = emirate;
    if (search) filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email:    { $regex: search, $options: 'i' } },
      { phone:    { $regex: search, $options: 'i' } },
    ];

    const allLeads = await Lead.find(filter).sort({ createdAt: -1 }).lean();
    const total = allLeads.length;
    const skip  = (page - 1) * limit;
    const data  = allLeads.slice(skip, skip + limit);

    return NextResponse.json({ success: true, total, page, data });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
