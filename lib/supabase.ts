import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://phenyqohdbprnfmckdpr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZW55cW9oZGJwcm5mbWNrZHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwODQ2NjcsImV4cCI6MjA3NzY2MDY2N30.xxuvIkHbyschj9WeRLUniGsqxtHZh88Y6gI47FzKGdk';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
