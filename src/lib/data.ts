import { getSupabaseClient } from './supabase';
import { User, Attendance } from '@/types';

/**
 * Fetch all users from database
 */
export async function readUsers(): Promise<User[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data || [];
}

/**
 * Get single user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  // PGRST116 = no rows found (not an actual error)
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Create new user
 */
export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const supabase = getSupabaseClient();

  const newUser: User = {
    ...user,
    id: crypto.randomUUID(),
  };

  const { data, error } = await supabase
    .from('users')
    .insert(newUser)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get attendance by user & date
 * Includes breakStart, breakEnd & totalWorkingHours
 */
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

  // Map DB fields → App fields
  return data
    ? {
        id: data.id,
        userId: data.user_id,
        date: data.date,
        punchIn: data.punch_in,
        punchOut: data.punch_out,
        breakStart: data.break_start,
        breakEnd: data.break_end,
        totalWorkingHours: data.total_working_hours,
      }
    : null;
}

/**
 * Create or update attendance record
 * Handles punch-in, punch-out, breaks & total working hours
 */
export async function createOrUpdateAttendance(
  att: Partial<Attendance>
): Promise<Attendance> {
  const supabase = getSupabaseClient();

  // Check if attendance already exists
  const existing = await getAttendanceByUserAndDate(att.userId!, att.date!);

  /**
   * 🔹 UPDATE existing attendance
   */
  if (existing) {
    const { data, error } = await supabase
      .from('attendance')
      .update({
        punch_in: att.punchIn ?? existing.punchIn,
        punch_out: att.punchOut ?? existing.punchOut,

        // Break fields
        break_start:
          att.breakStart !== undefined ? att.breakStart : existing.breakStart,
        break_end:
          att.breakEnd !== undefined ? att.breakEnd : existing.breakEnd,

        // Total working hours
        total_working_hours:
          att.totalWorkingHours !== undefined
            ? att.totalWorkingHours
            : existing.totalWorkingHours,
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
    };
  }

  /**
   * 🔹 INSERT new attendance
   */
  const newAtt = {
    id: crypto.randomUUID(),
    user_id: att.userId!,
    date: att.date!,
    punch_in: att.punchIn ?? null,
    punch_out: att.punchOut ?? null,

    // Break fields
    break_start: att.breakStart ?? null,
    break_end: att.breakEnd ?? null,

    // Total working hours
    total_working_hours: att.totalWorkingHours ?? null,
  };

  const { data, error } = await supabase
    .from('attendance')
    .insert(newAtt)
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
  };
}
