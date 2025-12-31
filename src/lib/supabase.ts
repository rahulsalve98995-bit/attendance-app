import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    // Temporary hardcoded values for testing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xcjbvvxeihzxezgpuely.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjamJ2dnhlaWh6eGV6Z3B1ZWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxODM3NzMsImV4cCI6MjA4Mjc1OTc3M30.ST-rIgip-3SSTrXY3xzinmOroQa_bEayuXYNBfm3l6g';

    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}