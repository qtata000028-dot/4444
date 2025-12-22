const fallbackUrl = 'https://ugxkzfvdybzbsxitcybw.supabase.co';
const fallbackKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVneGt6ZnZkeWJ6YnN4aXRjeWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDIxMTAsImV4cCI6MjA4MTYxODExMH0.N1MI3t0lU0s1xLqcB5BbCqR_dnKDr6VhBuYMENJoCwo';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || fallbackUrl;
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || fallbackKey;

export type SupabaseFilter = Record<string, string | number | boolean | null>;

function buildQuery(params?: SupabaseFilter, select = '*') {
  const searchParams = new URLSearchParams({ select });
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined) return;
      if (value === null) {
        searchParams.append(`${key}`, 'is.null');
      } else {
        searchParams.append(`${key}`, `eq.${value}`);
      }
    });
  }
  return searchParams.toString();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('缺少 Supabase 环境变量');
  }
  const headers: Record<string, string> = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
  const res = await fetch(`${supabaseUrl}${path}`, { ...init, headers: { ...headers, ...(init?.headers || {}) } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase 请求失败: ${res.status} ${text}`);
  }
  return res.json();
}

export async function fetchRows<T>(table: string, params?: SupabaseFilter, select = '*'): Promise<T[]> {
  const query = buildQuery(params, select);
  return request(`/rest/v1/${table}?${query}`);
}

export async function insertRows<T>(table: string, rows: Partial<T> | Partial<T>[]): Promise<T[]> {
  const payload = Array.isArray(rows) ? rows : [rows];
  return request(`/rest/v1/${table}`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateRows<T>(table: string, match: SupabaseFilter, values: Partial<T>): Promise<T[]> {
  const query = buildQuery(match);
  return request(`/rest/v1/${table}?${query}`, { method: 'PATCH', body: JSON.stringify(values) });
}

export async function deleteRows(table: string, match: SupabaseFilter) {
  const query = buildQuery(match);
  return request(`/rest/v1/${table}?${query}`, { method: 'DELETE' });
}

export async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  return request(`/rest/v1/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args || {}) });
}
