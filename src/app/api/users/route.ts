import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { readUsers, createUser } from '@/lib/data';
import { CreateUserRequest } from '@/types';

export async function GET() {
  try {
    await requireAdmin();
    const users = await readUsers();
    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body: CreateUserRequest = await request.json();
    const user = await createUser(body);
    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}