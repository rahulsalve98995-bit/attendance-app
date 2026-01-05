import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const supabase = getSupabaseClient();

    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    let query = supabase
      .from('attendance')
      .select(`
        *,
        users:users(name, email)
      `)
      .order('date', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    const reports = data.map(item => ({
      id: item.id,
      userId: item.user_id,
      userName: item.users?.name,
      userEmail: item.users?.email,
      date: item.date,
      punchIn: item.punch_in,
      punchOut: item.punch_out,
      breakStart: item.break_start,
      breakEnd: item.break_end,
      totalWorkingHours: item.total_working_hours,
      punchInLatitude: item.punch_in_latitude,
      punchInLongitude: item.punch_in_longitude,
      punchOutLatitude: item.punch_out_latitude,
      punchOutLongitude: item.punch_out_longitude,
    }));

    return NextResponse.json({ reports });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
