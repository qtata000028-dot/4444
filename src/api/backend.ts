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

  const rows = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  }).then((r) => r.json());

  const base = String(rows?.[0]?.public_url || '').replace(/\/+$/, '');
  if (!base) throw new Error('Supabase 没取到 public_url');
  cachedBase = base;
  return base;
}

async function request(path: string, method = 'GET', body?: unknown) {
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

export const api = {
  health: () => request('/health', 'GET'),

  deptList: () => request('/api/departments', 'GET'),

  empList: (deptId?: number, q?: string) => {
    const p = new URLSearchParams();
    if (deptId != null) p.set('deptId', String(deptId));
    if (q) p.set('q', q);
    return request('/api/employees' + (p.toString() ? `?${p}` : ''), 'GET');
  },
  empCreate: (dto: unknown) => request('/api/employees', 'POST', dto),
  empUpdate: (id: string, dto: unknown) => request(`/api/employees/${id}`, 'PUT', dto),
  empDelete: (id: string) => request(`/api/employees/${id}`, 'DELETE'),

  routeList: () => request('/api/process-routes', 'GET'),
  routeSteps: (routeId: number) => request(`/api/process-routes/${routeId}/steps`, 'GET'),

  orderList: (take = 50) => request(`/api/orders?take=${take}`, 'GET'),
  orderCreate: (dto: unknown) => request('/api/orders', 'POST', dto),
  orderGet: (id: number) => request(`/api/orders/${id}`, 'GET'),
  orderDelete: (id: number) => request(`/api/orders/${id}`, 'DELETE'),
};
