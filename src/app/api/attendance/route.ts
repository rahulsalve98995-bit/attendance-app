import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAttendanceByUserAndDate, createOrUpdateAttendance } from '@/lib/data';

export async function POST() {
  try {
    const user = await requireAuth();
    const today = new Date().toISOString().split('T')[0];
    const existing = await getAttendanceByUserAndDate(user.id, today);

    if (!existing || !existing.punchIn) {
      // Punch in
      const att = await createOrUpdateAttendance({
        userId: user.id,
        date: today,
        punchIn: new Date().toISOString(),
      });
      return NextResponse.json({ message: 'Punched in', attendance: att });
    } else if (!existing.punchOut) {
      // Punch out
      const att = await createOrUpdateAttendance({
        userId: user.id,
        date: today,
        punchOut: new Date().toISOString(),
      });
      return NextResponse.json({ message: 'Punched out', attendance: att });
    } else {
      return NextResponse.json({ error: 'Already punched out for today' }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function GET() {
  try {
    const user = await requireAuth();
    const today = new Date().toISOString().split('T')[0];
    const att = await getAttendanceByUserAndDate(user.id, today);
    return NextResponse.json({ attendance: att });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}