import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { requireAuth, requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const statusParam = searchParams.get('status');

    let query = getSupabaseClient()
      .from('leave_requests')
      .select(`
        *,
        user:users(name, email)
      `)
      .order('created_at', { ascending: false });

    // If not admin, only show own requests
    if (user.role !== 'admin') {
      query = query.eq('user_id', user.id);
    } else if (userId) {
      query = query.eq('user_id', userId);
    }

    if (statusParam) {
      query = query.eq('status', statusParam);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const { start_date, end_date, leave_type, reason } = body;

    if (!start_date || !end_date || !leave_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await getSupabaseClient()
      .from('leave_requests')
      .insert({
        user_id: user.id,
        start_date,
        end_date,
        leave_type,
        reason,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating leave request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { id, status, admin_notes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await getSupabaseClient()
      .from('leave_requests')
      .update({
        status,
        admin_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating leave request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}