import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getAttendanceByUserAndDate,
  createOrUpdateAttendance,
} from '@/lib/data';

/**
 * POST → Handle punch, break start & break end
 */
export async function POST(request: NextRequest) {
  try {
    // 🔐 Authenticate user
    const user = await requireAuth();

    const body = await request.json();
    const action = body.action || 'punch'; // punch | break_start | break_end
    const today = new Date().toISOString().split('T')[0];

    // Get today's attendance (if exists)
    const existing = await getAttendanceByUserAndDate(user.id, today);

    /**
     * 🔹 PUNCH ACTION
     * - If no punchIn → Punch In
     * - If punchIn exists & no punchOut → Punch Out
     */
    if (action === 'punch') {
      // ✅ Punch In
      if (!existing || !existing.punchIn) {
        const att = await createOrUpdateAttendance({
          userId: user.id,
          date: today,
          punchIn: new Date().toISOString(),
        });

        return NextResponse.json({
          message: 'Punched in',
          attendance: att,
        });
      }

      // ✅ Punch Out + calculate working hours
      if (!existing.punchOut) {
        const punchOut = new Date().toISOString();
        let totalWorkingHours: number | null = null;

        if (existing.punchIn) {
          const punchInMs = new Date(existing.punchIn).getTime();
          const punchOutMs = new Date(punchOut).getTime();

          let workingMs = punchOutMs - punchInMs;

          // ⏸️ Subtract break time if exists
          if (existing.breakStart && existing.breakEnd) {
            const breakMs =
              new Date(existing.breakEnd).getTime() -
              new Date(existing.breakStart).getTime();
            workingMs -= breakMs;
          }

          // Convert milliseconds → hours
          totalWorkingHours = workingMs / (1000 * 60 * 60);
        }

        const att = await createOrUpdateAttendance({
          userId: user.id,
          date: today,
          punchOut,
          totalWorkingHours,
        });

        return NextResponse.json({
          message: 'Punched out',
          attendance: att,
        });
      }

      // ❌ Already punched out
      return NextResponse.json(
        { error: 'Already punched out for today' },
        { status: 400 }
      );
    }

    /**
     * 🔹 BREAK START
     * Allowed only if:
     * - Punch in exists
     * - Punch out not done
     * - Break not already started
     */
    if (action === 'break_start') {
      if (
        existing &&
        existing.punchIn &&
        !existing.punchOut &&
        !existing.breakStart
      ) {
        const att = await createOrUpdateAttendance({
          userId: user.id,
          date: today,
          breakStart: new Date().toISOString(),
        });

        return NextResponse.json({
          message: 'Break started',
          attendance: att,
        });
      }

      return NextResponse.json(
        { error: 'Cannot start break' },
        { status: 400 }
      );
    }

    /**
     * 🔹 BREAK END
     * Allowed only if:
     * - Break started
     * - Break not already ended
     */
    if (action === 'break_end') {
      if (existing && existing.breakStart && !existing.breakEnd) {
        const att = await createOrUpdateAttendance({
          userId: user.id,
          date: today,
          breakEnd: new Date().toISOString(),
        });

        return NextResponse.json({
          message: 'Break ended',
          attendance: att,
        });
      }

      return NextResponse.json(
        { error: 'Cannot end break' },
        { status: 400 }
      );
    }

    // ❌ Invalid action
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

/**
 * GET → Fetch today's attendance
 */
export async function GET() {
  try {
    const user = await requireAuth();
    const today = new Date().toISOString().split('T')[0];
    const att = await getAttendanceByUserAndDate(user.id, today);

    return NextResponse.json({ attendance: att });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
