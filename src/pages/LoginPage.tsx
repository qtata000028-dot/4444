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
    <div className="login-bg flex min-h-screen items-center justify-center px-4">
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-[1px] shadow-2xl backdrop-blur-xl">
        <div className="rounded-2xl bg-slate-900/70 px-10 py-12 text-slate-50">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Quantum Scheduling</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">自动排程演示系统</h1>
              <p className="mt-2 text-sm text-slate-300">请使用演示员工账号登录</p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-400 to-emerald-300 opacity-90 shadow-lg" />
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm text-slate-200">登录名</label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 outline-none transition focus:border-blue-300/70 focus:bg-white/20"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder="请输入登录名"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-200">密码</label>
              <input
                type="password"
                className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 outline-none transition focus:border-blue-300/70 focus:bg-white/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
            </div>
            {error && <div className="text-sm text-red-200">{error}</div>}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-400 via-sky-400 to-emerald-300 px-4 py-3 text-base font-semibold text-slate-900 shadow-lg shadow-blue-500/30 transition hover:scale-[1.01] disabled:opacity-70"
              disabled={loading}
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-slate-900" />
              {loading ? '登录中…' : '进入系统'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
