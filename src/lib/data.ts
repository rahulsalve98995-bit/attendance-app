import { supabase } from './supabase';
import { User, Attendance } from '@/types';

export async function readUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data || [];
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
  return data || null;
}

export async function createUser(user: Omit<User, 'id'>): Promise<User> {
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

export async function getAttendanceByUserAndDate(userId: string, date: string): Promise<Attendance | null> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ? {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    punchIn: data.punch_in,
    punchOut: data.punch_out,
  } : null;
}

export async function createOrUpdateAttendance(att: Partial<Attendance>): Promise<Attendance> {
  const existing = await getAttendanceByUserAndDate(att.userId!, att.date!);
  if (existing) {
    const { data, error } = await supabase
      .from('attendance')
      .update({
        punch_in: att.punchIn || existing.punchIn,
        punch_out: att.punchOut || existing.punchOut,
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
    };
  } else {
    const newAtt = {
      id: crypto.randomUUID(),
      user_id: att.userId!,
      date: att.date!,
      punch_in: att.punchIn || null,
      punch_out: att.punchOut || null,
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
    };
  }
}