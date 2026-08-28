import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://putztvsdxuprkbxufrge.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dHp0dnNkeHVwcmtieHVmcmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMzQ4MjIsImV4cCI6MjA5ODgxMDgyMn0.b2Xla5rxDtSYlF9pcouQS8do0LdXK_OKVeiW3w0PeJo';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
