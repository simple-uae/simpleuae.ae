import { NextResponse } from 'next/server';
const { model } = require('@/lib/jsondb');
const { requireAdmin } = require('@/lib/auth');

const Lead = model('Lead');

export async function GET(request) {
  const authErr = requireAdmin(request);
  if (authErr) return authErr;
  try {
    const leads = await Lead.find({}).sort({ createdAt: -1 }).lean();
    const header = 'ID,Name,Email,Phone,LicenseType,HomeCountryLicense,Emirates,Status,AdditionalInfo,SubmittedAt\n';
    const rows = leads.map(l =>
      [l._id, `"${l.fullName}"`, l.email, l.phone, l.licenseType,
       l.homeCountryLicense, `"${(l.emirates||[]).join(';')}"`, l.status,
       `"${(l.additionalInfo||'').replace(/"/g,'""')}"`, l.createdAt
      ].join(',')
    ).join('\n');

    return new Response(header + rows, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="leads-${Date.now()}.csv"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
