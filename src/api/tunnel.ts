const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const TUNNEL_NAME = (import.meta.env.VITE_TUNNEL_NAME as string) || 'local-win-server';
const API_KEY = import.meta.env.VITE_BACKEND_API_KEY as string;

let cachedBase = '';

async function getBaseUrl(): Promise<string> {
  if (cachedBase) return cachedBase;

  const url =
    `${SUPABASE_URL}/rest/v1/tunnel_endpoints` +
    `?select=public_url&name=eq.${encodeURIComponent(TUNNEL_NAME)}&limit=1`;

  let rows: unknown;
  try {
    rows = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    }).then((r) => r.json());
  } catch (error) {
    throw new Error('Cannot connect to config server');
  }

  const base = String((rows as { public_url?: string }[])?.[0]?.public_url || '').replace(/\/+$/, '');
  if (!base) throw new Error('Cannot connect to config server');
  cachedBase = base;
  return base;
}

async function request(path: string, method: string, body?: unknown) {
  const base = await getBaseUrl();
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const backend = {
  login: (account: string, password: string) => request('/api/auth/login', 'POST', { account, password }),
};
