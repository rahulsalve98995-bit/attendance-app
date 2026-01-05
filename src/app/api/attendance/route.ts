import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getAttendanceByUserAndDate,
  createOrUpdateAttendance,
} from '@/lib/data';

/**
 * POST → Punch actions
 * 📍 Location is MANDATORY for punch in/out
 */
export async function POST(request: NextRequest) {
  try {
    // 🔐 Authenticate
    const user = await requireAuth(request);

    const body = await request.json();
    const action = body.action || 'punch';
    const location = body.location;

    // ❌ Location validation
    if (
      !location ||
      typeof location.latitude !== 'number' ||
      typeof location.longitude !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Live location is required' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const existing = await getAttendanceByUserAndDate(user.id, today);

    /* ===================== PUNCH ===================== */
    if (action === 'punch') {

      /* 🟢 PUNCH IN */
      if (!existing || !existing.punchIn) {
        const att = await createOrUpdateAttendance({
          userId: user.id,
          date: today,
          punchIn: new Date().toISOString(),

          // 📍 Location
          punchInLatitude: location.latitude,
          punchInLongitude: location.longitude,
        });

        return NextResponse.json({ message: 'Punched in', attendance: att });
      }

      /* 🔴 PUNCH OUT */
      if (!existing.punchOut) {
        const punchOut = new Date().toISOString();
        let totalWorkingHours: number | null = null;

        if (existing.punchIn) {
          const workingMs =
            new Date(punchOut).getTime() -
            new Date(existing.punchIn).getTime();

          totalWorkingHours = workingMs / (1000 * 60 * 60);
        }

        const att = await createOrUpdateAttendance({
          userId: user.id,
          date: today,
          punchOut,
          totalWorkingHours,

          // 📍 Location
          punchOutLatitude: location.latitude,
          punchOutLongitude: location.longitude,
        });

        return NextResponse.json({ message: 'Punched out', attendance: att });
      }

      return NextResponse.json(
        { error: 'Already punched out' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 401 }
    );
  }
}

/**
 * GET → Fetch today's attendance
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const today = new Date().toISOString().split('T')[0];
    const att = await getAttendanceByUserAndDate(user.id, today);

    return NextResponse.json({ attendance: att });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 401 }
    );
  }
}
