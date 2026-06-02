import { NextResponse } from 'next/server';
const { model } = require('@/lib/pgdb');
const Content = model('content');
const DEFAULTS = { hero:{ line1:"Find Your UAE", line2:"Driving School.", line3:"Compare & Save.", subtitle:"Compare every RTA-approved driving school across all 7 emirates.", ctaText:"Get My Free Comparison" }, footer:{ tagline:"Your trusted guide to UAE driving schools." }, stats:{ schools:{ number:"12+", label:"Approved Schools" }, licences:{ number:"5", label:"License Types" }, emirates:{ number:"7", label:"Emirates Covered" }, savings:{ number:"Free", label:"Comparison Service" } }, testimonials:[{ name:"Sarah M.", role:"Car License · Dubai", quote:"SimpleUAE saved me hours of research!" }], packages:[{ name:"Standard Car License", category:"Car License", price:"AED 4,200", duration:"30–45 days", includes:"Theory classes, Parking test, Road test, RTA registration" }] };
export async function GET(request) {
  try {
    const rows = await Content.find({}).lean();
    const stored = rows.reduce((acc,r)=>{ acc[r.key]=r.value; return acc; },{});
    const data = {};
    for (const [section,def] of Object.entries(DEFAULTS)) data[section]=stored[section]!==undefined?stored[section]:def;
    return NextResponse.json({ success:true, data });
  } catch(err) { return NextResponse.json({ success:false, message:err.message },{ status:500 }); }
}
