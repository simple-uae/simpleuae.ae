import { NextResponse } from 'next/server';
const { model } = require('@/lib/pgdb');
const { requireAdmin } = require('@/lib/auth');
const logger = require('@/lib/logger');
const Content = model('content');
const DEFAULTS = { hero:{ line1:"Find Your UAE", line2:"Driving School.", line3:"Compare & Save.", subtitle:"Compare every RTA-approved driving school across all 7 emirates.", ctaText:"Get My Free Comparison" }, footer:{ tagline:"Your trusted guide to UAE driving schools." }, stats:{ schools:{ number:"12+", label:"Approved Schools" }, licences:{ number:"5", label:"License Types" }, emirates:{ number:"7", label:"Emirates Covered" }, savings:{ number:"Free", label:"Comparison Service" } }, testimonials:[{ name:"Sarah M.", role:"Car License · Dubai", quote:"SimpleUAE saved me hours of research!" }], packages:[{ name:"Standard Car License", category:"Car License", price:"AED 4,200", duration:"30–45 days", includes:"Theory classes, Parking test, Road test, RTA registration" }] };
export async function GET(request, { params }) {
  try {
    const { section } = await params;
    const row = await Content.findOne({ key:section });
    const data = row?row.value:(DEFAULTS[section]??null);
    if (data===null) return NextResponse.json({ success:false, message:'Section not found' },{ status:404 });
    return NextResponse.json({ success:true, data });
  } catch(err) { return NextResponse.json({ success:false, message:err.message },{ status:500 }); }
}
export async function PUT(request, { params }) {
  const authErr = requireAdmin(request); if (authErr) return authErr;
  try {
    const { section } = await params;
    if (!DEFAULTS[section]) return NextResponse.json({ success:false, message:'Unknown content section' },{ status:400 });
    const body = await request.json();
    await Content.findOneAndUpdate({ key:section },{ $set:{ value:body } },{ upsert:true });
    await logger.log('admin','content.updated',`Content "${section}" updated`);
    return NextResponse.json({ success:true, message:`${section} content saved` });
  } catch(err) { return NextResponse.json({ success:false, message:err.message },{ status:500 }); }
}
