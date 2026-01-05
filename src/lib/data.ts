import { getSupabaseClient } from './supabase';
import { User, Attendance, Shift, ShiftType } from '@/types';

/* ================= SHIFTS ================= */

const shifts: Shift[] = [
  { type: 'Night Shift', startTime: '22:00', endTime: '06:00' },
  { type: 'General Shift', startTime: '09:00', endTime: '17:00' },
  { type: 'Second Shift', startTime: '14:00', endTime: '22:00' },
  { type: 'First Shift', startTime: '06:00', endTime: '14:00' },
];

export function getShiftByType(type: ShiftType): Shift | undefined {
  return shifts.find(shift => shift.type === type);
}

/* ================= USERS ================= */

export async function readUsers(): Promise<User[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data || [];
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function createUser(user: { name: string; email: string; role: 'admin' | 'employee'; password: string }): Promise<User> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: crypto.randomUUID(),
      name: user.name,
      email: user.email,
      role: user.role,
      password: user.password, // Note: In real app, hash the password
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUser(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) throw error;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
  const supabase = getSupabaseClient();
  const updateData: Record<string, string | undefined> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.phone !== undefined) updateData.phone = updates.phone;
  if (updates.address !== undefined) updateData.address = updates.address;
  if (updates.department !== undefined) updateData.department = updates.department;
  if (updates.position !== undefined) updateData.position = updates.position;
  if (updates.avatar !== undefined) updateData.avatar = updates.avatar;

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ================= ATTENDANCE ================= */

export async function getAttendanceByUserAndDate(
  userId: string,
  date: string
): Promise<Attendance | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    punchIn: data.punch_in,
    punchOut: data.punch_out,
    breakStart: data.break_start,
    breakEnd: data.break_end,
    totalWorkingHours: data.total_working_hours,

    // 📍 LOCATION
    punchInLatitude: data.punch_in_latitude,
    punchInLongitude: data.punch_in_longitude,
    punchOutLatitude: data.punch_out_latitude,
    punchOutLongitude: data.punch_out_longitude,
  };
}

/**
 * Create OR Update attendance
 */
export async function createOrUpdateAttendance(
  att: Partial<Attendance>
): Promise<Attendance> {
  const supabase = getSupabaseClient();

  const existing = await getAttendanceByUserAndDate(att.userId!, att.date!);

  /* ===== UPDATE ===== */
  if (existing) {
    const { data, error } = await supabase
      .from('attendance')
      .update({
        punch_in: att.punchIn ?? existing.punchIn,
        punch_out: att.punchOut ?? existing.punchOut,

        break_start:
          att.breakStart !== undefined ? att.breakStart : existing.breakStart,
        break_end:
          att.breakEnd !== undefined ? att.breakEnd : existing.breakEnd,

        total_working_hours:
          att.totalWorkingHours !== undefined
            ? att.totalWorkingHours
            : existing.totalWorkingHours,

        // 📍 LOCATION UPDATE
        punch_in_latitude:
          att.punchInLatitude ?? existing.punchInLatitude,
        punch_in_longitude:
          att.punchInLongitude ?? existing.punchInLongitude,
        punch_out_latitude:
          att.punchOutLatitude ?? existing.punchOutLatitude,
        punch_out_longitude:
          att.punchOutLongitude ?? existing.punchOutLongitude,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      date: data.date,
      punchIn: data.punch_in,
      punchOut: data.punch_out,
      breakStart: data.break_start,
      breakEnd: data.break_end,
      totalWorkingHours: data.total_working_hours,
      punchInLatitude: data.punch_in_latitude,
      punchInLongitude: data.punch_in_longitude,
      punchOutLatitude: data.punch_out_latitude,
      punchOutLongitude: data.punch_out_longitude,
    };
  }

  /* ===== INSERT ===== */
  const { data, error } = await supabase
    .from('attendance')
    .insert({
      id: crypto.randomUUID(),
      user_id: att.userId!,
      date: att.date!,
      punch_in: att.punchIn ?? null,
      punch_out: att.punchOut ?? null,
      break_start: att.breakStart ?? null,
      break_end: att.breakEnd ?? null,
      total_working_hours: att.totalWorkingHours ?? null,

      // 📍 LOCATION INSERT
      punch_in_latitude: att.punchInLatitude ?? null,
      punch_in_longitude: att.punchInLongitude ?? null,
      punch_out_latitude: att.punchOutLatitude ?? null,
      punch_out_longitude: att.punchOutLongitude ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    punchIn: data.punch_in,
    punchOut: data.punch_out,
    breakStart: data.break_start,
    breakEnd: data.break_end,
    totalWorkingHours: data.total_working_hours,
    punchInLatitude: data.punch_in_latitude,
    punchInLongitude: data.punch_in_longitude,
    punchOutLatitude: data.punch_out_latitude,
    punchOutLongitude: data.punch_out_longitude,
  };
}
