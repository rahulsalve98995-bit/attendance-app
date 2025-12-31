import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAttendanceByUserAndDate, createOrUpdateAttendance } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const action = body.action || 'punch'; // punch, break_start, break_end
    const today = new Date().toISOString().split('T')[0];
    const existing = await getAttendanceByUserAndDate(user.id, today);

    if (action === 'punch') {
      if (!existing || !existing.punchIn) {
        // Punch in
        const att = await createOrUpdateAttendance({
          userId: user.id,
          date: today,
          punchIn: new Date().toISOString(),
        });
        return NextResponse.json({ message: 'Punched in', attendance: att });
      } else if (!existing.punchOut) {
        // Punch out and calculate hours
        const punchOut = new Date().toISOString();
        let totalHours = null;
        if (existing.punchIn) {
          const punchInTime = new Date(existing.punchIn).getTime();
          const punchOutTime = new Date(punchOut).getTime();
          let workingMs = punchOutTime - punchInTime;

          // Subtract break time
          if (existing.breakStart && existing.breakEnd) {
            const breakMs = new Date(existing.breakEnd).getTime() - new Date(existing.breakStart).getTime();
            workingMs -= breakMs;
          }

          totalHours = workingMs / (1000 * 60 * 60); // hours
        }

        const att = await createOrUpdateAttendance({
          userId: user.id,
          date: today,
          punchOut,
          totalWorkingHours: totalHours,
        });
        return NextResponse.json({ message: 'Punched out', attendance: att });
      } else {
        return NextResponse.json({ error: 'Already punched out for today' }, { status: 400 });
      }
    } else if (action === 'break_start') {
      if (existing && existing.punchIn && !existing.punchOut && !existing.breakStart) {
        const att = await createOrUpdateAttendance({
          userId: user.id,
          date: today,
          breakStart: new Date().toISOString(),
        });
        return NextResponse.json({ message: 'Break started', attendance: att });
      } else {
        return NextResponse.json({ error: 'Cannot start break' }, { status: 400 });
      }
    } else if (action === 'break_end') {
      if (existing && existing.breakStart && !existing.breakEnd) {
        const att = await createOrUpdateAttendance({
          userId: user.id,
          date: today,
          breakEnd: new Date().toISOString(),
        });
        return NextResponse.json({ message: 'Break ended', attendance: att });
      } else {
        return NextResponse.json({ error: 'Cannot end break' }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
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