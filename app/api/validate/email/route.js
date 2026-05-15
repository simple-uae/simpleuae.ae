import { NextResponse } from 'next/server';
const dns = require('dns').promises;

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','10minutemail.com','temp-mail.org',
  'throwaway.email','yopmail.com','sharklasers.com','guerrillamailblock.com',
  'grr.la','guerrillamail.info','guerrillamail.biz','guerrillamail.de',
  'guerrillamail.net','guerrillamail.org','spam4.me','trashmail.com',
  'trashmail.me','trashmail.net','fakeinbox.com','maildrop.cc',
  'dispostable.com','mailnull.com','spamgourmet.com','spamgourmet.net',
  'spamgourmet.org','spamex.com','mailexpire.com','mailfreeonline.com',
  'spamevade.com','binkmail.com','bobmail.info','discard.email',
  'discardmail.com','discardmail.de','spamspot.com','tempinbox.com',
  'tempinbox.co.uk','filzmail.com','spamfree24.org',
  'tempr.email','spamgob.com',
]);

function isValidFormat(email) {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  return re.test(email);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const raw  = (body.email || '').trim().toLowerCase();
    const result = {
      email:  raw,
      valid:  false,
      reason: '',
      checks: { format: false, disposable: false, mxRecord: false },
    };

    if (!raw) {
      result.reason = 'Email is required';
      return NextResponse.json(result);
    }

    if (!isValidFormat(raw)) {
      result.reason = 'Invalid email format';
      return NextResponse.json(result);
    }
    result.checks.format = true;

    const domain = raw.split('@')[1];
    if (DISPOSABLE_DOMAINS.has(domain)) {
      result.reason = 'Disposable/temporary email addresses are not accepted';
      return NextResponse.json(result);
    }
    result.checks.disposable = true;

    try {
      const mxRecords = await dns.resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        result.reason = 'Email domain does not accept email (no MX records)';
        return NextResponse.json(result);
      }
      result.checks.mxRecord = true;
    } catch {
      result.reason = 'Email domain does not exist or cannot be reached';
      return NextResponse.json(result);
    }

    result.valid  = true;
    result.reason = 'Email looks valid';
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
