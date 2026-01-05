import { cookies } from 'next/headers';
import { getUserByEmail } from './data';
import { User } from '@/types';

const SESSION_COOKIE = 'session';

export async function login(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (user && user.password === password) { // In real app, hash check
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, JSON.stringify({ userId: user.id, role: user.role }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
    });
    return user;
  }
  return null;
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) return null;
  try {
    const { userId } = JSON.parse(session);
    const users = await import('./data').then(m => m.readUsers());
    return users.find(u => u.id === userId) || null;
  } catch {
    return null;
  }
}

import { NextRequest } from 'next/server';

export async function requireAuth(request: NextRequest): Promise<User> {
  const cookie = request.cookies.get('session');

  if (!cookie) {
    throw new Error('Unauthorized');
  }

  try {
    const { userId } = JSON.parse(cookie.value);
    const users = await import('./data').then(m => m.readUsers());
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('Unauthorized');
    return user;
  } catch {
    throw new Error('Unauthorized');
  }
}


export async function requireAdmin(request: NextRequest): Promise<User> {
  const user = await requireAuth(request);
  if (user.role !== 'admin') throw new Error('Admin required');
  return user;
}