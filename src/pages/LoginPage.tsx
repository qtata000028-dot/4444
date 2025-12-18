import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRows } from '../lib/supabaseClient';
import { EmployeeUser } from '../types';
import { saveUser } from '../lib/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const users = await fetchRows<EmployeeUser>('employee_user', {
        login_name: loginName,
        pwd: password,
        is_active: true,
      });
      if (users.length === 0) {
        setError('登录名或密码错误，或账户已停用');
      } else {
        const user = users[0];
        saveUser({ emp_id: user.emp_id, emp_name: user.emp_name, role: user.role });
        navigate('/board');
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="card w-full max-w-md">
        <h1 className="mb-2 text-xl font-semibold text-slate-900">自动排程演示系统</h1>
        <p className="mb-6 text-sm text-slate-600">请使用演示员工账号登录</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm text-slate-700">登录名</label>
            <input
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm text-slate-700">密码</label>
            <input
              type="password"
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button
            type="submit"
            className="w-full rounded bg-primary px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? '登录中…' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}
