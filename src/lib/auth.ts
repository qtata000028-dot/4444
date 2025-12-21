import { EmployeeProfile, EmployeeUser, SessionPayload } from '../types';
import { supabase } from './supabase';

const SESSION_KEY = 'erp_session';
const LOGIN_USER_KEY = 'login_user';
const REMEMBER_KEY = 'erp_remember';
const LAST_LOGIN_KEY = 'erp_last_login_time';

export interface RememberPayload {
  enabled: boolean;
  login_name: string;
  password_encoded?: string;
  avatar_path?: string;
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
  const loginRaw = localStorage.getItem(LOGIN_USER_KEY);
  if (loginRaw) {
    try {
      const user = JSON.parse(loginRaw) as Partial<SessionPayload> & { emp_id?: string };
      if (user.emp_id || user.login_name) {
        return {
          emp_id: user.emp_id || '',
          login_name: user.login_name || '',
          emp_name: user.emp_name || user.login_name || '',
          role: user.role || 'viewer',
          department_id: user.department_id ?? null,
          avatar_path: user.avatar_path,
          login_time: user.login_time || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.error(err);
    }
  }

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
  localStorage.setItem(LOGIN_USER_KEY, JSON.stringify(session));
  localStorage.setItem(LAST_LOGIN_KEY, session.login_time);
}

// Alias for legacy callers that expect "saveUser" naming
export function saveUser(session: SessionPayload) {
  saveSession(session);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LOGIN_USER_KEY);
}

export function getRemember(): RememberPayload {
  const raw = localStorage.getItem(REMEMBER_KEY);
  if (!raw) return { enabled: false, login_name: '', password_encoded: '', avatar_path: '' };
  try {
    return JSON.parse(raw) as RememberPayload;
  } catch (err) {
    console.error(err);
    return { enabled: false, login_name: '', password_encoded: '', avatar_path: '' };
  }
}

export function saveRemember(payload: RememberPayload) {
  localStorage.setItem(REMEMBER_KEY, JSON.stringify(payload));
}

export async function fetchProfile(emp_id: string): Promise<EmployeeProfile | null> {
  const { data, error } = await supabase
    .from('employee_user')
    .select('*, department:department_id(*)')
    .eq('emp_id', emp_id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as EmployeeProfile | null;
}

export async function logout() {
  clearSession();
}
