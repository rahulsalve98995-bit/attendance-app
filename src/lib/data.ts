import { promises as fs } from 'fs';
import path from 'path';
import { User, Attendance } from '@/types';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const ATTENDANCE_FILE = path.join(process.cwd(), 'data', 'attendance.json');

export async function readUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writeUsers(users: User[]): Promise<void> {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

export async function readAttendance(): Promise<Attendance[]> {
  try {
    const data = await fs.readFile(ATTENDANCE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writeAttendance(attendance: Attendance[]): Promise<void> {
  await fs.writeFile(ATTENDANCE_FILE, JSON.stringify(attendance, null, 2));
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await readUsers();
  return users.find(user => user.email === email) || null;
}

export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const users = await readUsers();
  const newUser: User = {
    ...user,
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  users.push(newUser);
  await writeUsers(users);
  return newUser;
}

export async function getAttendanceByUserAndDate(userId: string, date: string): Promise<Attendance | null> {
  const attendance = await readAttendance();
  return attendance.find(a => a.userId === userId && a.date === date) || null;
}

export async function createOrUpdateAttendance(att: Partial<Attendance>): Promise<Attendance> {
  const attendance = await readAttendance();
  const existing = attendance.find(a => a.userId === att.userId && a.date === att.date);
  if (existing) {
    Object.assign(existing, att);
    await writeAttendance(attendance);
    return existing;
  } else {
    const newAtt: Attendance = {
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: att.userId!,
      date: att.date!,
      punchIn: att.punchIn || null,
      punchOut: att.punchOut || null,
    };
    attendance.push(newAtt);
    await writeAttendance(attendance);
    return newAtt;
  }
}