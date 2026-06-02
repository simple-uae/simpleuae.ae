import { NextResponse } from 'next/server';
const { model } = require('@/lib/pgdb');
const { requireAdmin } = require('@/lib/auth');
const Settings=model('settings');
export async function GET(request) {
  const authErr=requireAdmin(request); if(authErr) return authErr;
  try {
    const all=await Settings.find({}).lean();
    const safe=all.filter(s=>!s.sensitive).reduce((acc,s)=>{ acc[s.key]=s.value; return acc; },{});
    return NextResponse.json({ success:true, data:safe });
  } catch(err) { return NextResponse.json({ success:false, message:err.message },{ status:500 }); }
}
export async function PUT(request) {
  const authErr=requireAdmin(request); if(authErr) return authErr;
  try {
    const updates=await request.json();
    for(const[key,value]of Object.entries(updates)){
      if(key==='admin_key_hash') continue;
      await Settings.findOneAndUpdate({ key },{ $set:{ value } },{ upsert:true });
    }
    return NextResponse.json({ success:true, message:'Settings saved' });
  } catch(err) { return NextResponse.json({ success:false, message:err.message },{ status:500 }); }
}
export async function POST(request) {
  const authErr=requireAdmin(request); if(authErr) return authErr;
  try {
    const { key,value }=await request.json();
    if(!key) return NextResponse.json({ success:false, message:'key required' },{ status:400 });
    if(key==='admin_key_hash') return NextResponse.json({ success:false, message:'Use /api/auth/key to change admin key' },{ status:403 });
    await Settings.findOneAndUpdate({ key },{ $set:{ value } },{ upsert:true });
    return NextResponse.json({ success:true, message:'Setting saved' });
  } catch(err) { return NextResponse.json({ success:false, message:err.message },{ status:500 }); }
}
