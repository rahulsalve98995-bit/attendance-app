import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
    supabase_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    url_value: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key_length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
  });
}