import { EmployeeProfile, SessionPayload } from '../types';
import { supabase } from './supabase';

const SESSION_KEY = 'erp_session';
const REMEMBER_KEY = 'erp_remember';
const LAST_LOGIN_KEY = 'erp_last_login_time';

export interface RememberPayload {
  enabled: boolean;
  login_name: string;
  password_encoded?: string;
}

export function encodePassword(pwd: string) {
  return btoa(unescape(encodeURIComponent(pwd)));
}

export function decodePassword(encoded?: string) {
  if (!encoded) return '';
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch (err) {
    console.error(err);
    return '';
  }
}

export function getSession(): SessionPayload | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionPayload;
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Alias for legacy callers that expect "getCurrentUser" naming
export function getCurrentUser() {
  return getSession();
}

export function saveSession(session: SessionPayload) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(LAST_LOGIN_KEY, session.login_time);
}

// Alias for legacy callers that expect "saveUser" naming
export function saveUser(session: SessionPayload) {
  saveSession(session);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getRemember(): RememberPayload {
  const raw = localStorage.getItem(REMEMBER_KEY);
  if (!raw) return { enabled: false, login_name: '', password_encoded: '' };
  try {
    return JSON.parse(raw) as RememberPayload;
  } catch (err) {
    console.error(err);
    return { enabled: false, login_name: '', password_encoded: '' };
  }
}

export function saveRemember(payload: RememberPayload) {
  localStorage.setItem(REMEMBER_KEY, JSON.stringify(payload));
}

export async function login(login_name: string, password: string) {
  const { data, error } = await supabase
    .from('employee_user')
    .select('*')
    .eq('login_name', login_name)
    .eq('pwd', password)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('登录名或密码错误，或账户已停用');

  const session: SessionPayload = {
    emp_id: String(data.emp_id),
    login_name: String(data.login_name),
    emp_name: String(data.emp_name),
    role: data.role as SessionPayload['role'],
    department_id: (data.department_id ?? null) as number | null,
    avatar_path: (data.avatar_path ?? null) as string | null,
    login_time: new Date().toISOString(),
  };

  saveSession(session);
  return session;
}

export async function fetchProfile(emp_id: string): Promise<EmployeeProfile | null> {
  const { data, error } = await supabase
    .from('employee_user')
    .select('*, department:department_id(*)')
    .eq('emp_id', emp_id)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as EmployeeProfile) ?? null;
}

export async function logout() {
  clearSession();
}
