export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    supabase_url_status: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
    supabase_key_status: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',

    // debug (safe)
    supabase_url_value: process.env.SUPABASE_URL || null,
    supabase_key_length: process.env.SUPABASE_ANON_KEY
      ? process.env.SUPABASE_ANON_KEY.length
      : 0,
  });
}
