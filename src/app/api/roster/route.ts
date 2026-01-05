import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { Roster, ShiftType } from '@/types';
import { getShiftByType } from '@/lib/data';

type DBRoster = {
  id: string;
  employee_id: string;
  date: string;
  shift: string;
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    let data;
    if (user.role === 'admin') {
      const supabase = getSupabaseClient();
      const { data: rosterData, error } = await supabase
        .from('roster')
        .select('*');
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      data = rosterData;
    } else {
      const supabase = getSupabaseClient();
      const { data: rosterData, error } = await supabase
        .from('roster')
        .select('*')
        .eq('employee_id', user.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      data = rosterData;
    }
    // Map to match types and add shift times
    const enrichedData = data.map((roster: DBRoster) => {
      const shift = getShiftByType(roster.shift as ShiftType);
      return {
        id: roster.id,
        employeeId: roster.employee_id,
        date: roster.date,
        shift: roster.shift,
        startTime: shift?.startTime,
        endTime: shift?.endTime,
      };
    });
    return NextResponse.json({ roster: enrichedData });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    const supabase = getSupabaseClient();
    const body: Omit<Roster, 'id' | 'startTime' | 'endTime'> = await request.json();
    const mappedBody = {
      employee_id: body.employeeId,
      date: body.date,
      shift: body.shift
    };
    const { data, error } = await supabase
      .from('roster')
      .insert(mappedBody)
      .select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Map back and enrich with times
    const enrichedData = data.map((roster: DBRoster) => {
      const shift = getShiftByType(roster.shift as ShiftType);
      return {
        id: roster.id,
        employeeId: roster.employee_id,
        date: roster.date,
        shift: roster.shift,
        startTime: shift?.startTime,
        endTime: shift?.endTime,
      };
    });
    return NextResponse.json({ roster: enrichedData });
  } catch (error) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);
    const supabase = getSupabaseClient();
    const body: { id: string; shift: string } = await request.json();
    const { id, shift } = body;
    if (!id || !shift) {
      return NextResponse.json({ error: 'ID and shift required' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('roster')
      .update({ shift })
      .eq('id', id)
      .select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Enrich with times
    const shiftDetails = getShiftByType(shift as ShiftType);
    const enriched = {
      ...data[0],
      startTime: shiftDetails?.startTime,
      endTime: shiftDetails?.endTime,
    };
    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin(request);
    const supabase = getSupabaseClient();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }
    const { error } = await supabase
      .from('roster')
      .delete()
      .eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}