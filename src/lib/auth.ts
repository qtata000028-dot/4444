import { EmployeeUser } from '../types';

const STORAGE_KEY = 'scheduler_user';

export function getCurrentUser(): Pick<EmployeeUser, 'emp_id' | 'emp_name' | 'role'> | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(err);
    return null;
  }
}

export function saveUser(user: Pick<EmployeeUser, 'emp_id' | 'emp_name' | 'role'>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}
