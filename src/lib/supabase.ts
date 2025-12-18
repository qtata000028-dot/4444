import { createClient } from '@supabase/supabase-js';

const fallbackUrl = 'https://ugxkzfvdybzbsxitcybw.supabase.co';
const fallbackKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVneGt6ZnZkeWJ6YnN4aXRjeWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDIxMTAsImV4cCI6MjA4MTYxODExMH0.N1MI3t0lU0s1xLqcB5BbCqR_dnKDr6VhBuYMENJoCwo';

export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || fallbackUrl;
export const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || fallbackKey;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export function getPublicFileUrl(bucket: string, objectPath: string | null | undefined) {
  if (!objectPath) return '';
  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  return data?.publicUrl || '';
}
