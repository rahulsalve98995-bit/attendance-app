import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    // Hardcoded for testing - replace with env vars in production
    const supabaseUrl = 'https://xcjbvvxeihzxezgpuely.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjamJ2dnhlaWh6eGV6Z3B1ZWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxODM3NzMsImV4cCI6MjA4Mjc1OTc3M30.ST-rIgip-3SSTrXY3xzinmOroQa_bEayuXYNBfm3l6g';
    
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}
