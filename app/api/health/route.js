import { NextResponse } from 'next/server';
const { query } = require('@/lib/db');
export async function GET() {
  let dbStatus='ok', dbVersion=null;
  try { const rows=await query('SELECT version()'); dbVersion=rows[0].version.split(' ').slice(0,2).join(' '); }
  catch(e) { dbStatus='error: '+e.message; }
  return NextResponse.json({ success:true, status:'ok', db:'postgresql', dbStatus, dbVersion, timestamp:new Date().toISOString() });
}
