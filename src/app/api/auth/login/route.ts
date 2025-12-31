import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/auth';
import { LoginRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const user = await login(body.email, body.password);
    if (user) {
      return NextResponse.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}