import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login, getRemember, saveRemember, encodePassword, decodePassword } from '../lib/auth';
import { Sparkles, Shield, Lock, UserRound } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const rememberState = getRemember();

  const [loginName, setLoginName] = useState(rememberState.login_name || '');
  const [password, setPassword] = useState(decodePassword(rememberState.password_encoded));
  const [remember, setRemember] = useState(rememberState.enabled);
  const [autoLogin, setAutoLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (remember && password && autoLogin) {
      void handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLogin]);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(loginName, password);
      if (remember) {
        saveRemember({ enabled: true, login_name: loginName, password_encoded: encodePassword(password) });
      } else {
        saveRemember({ enabled: false, login_name: '', password_encoded: '' });
      }
      const redirect = (location.state as { from?: string } | null)?.from || '/me';
      navigate(redirect);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.24),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.2),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(14,165,233,0.2),transparent_35%)]" />
        <div className="absolute left-1/4 top-1/4 h-72 w-72 animate-spin-slow rounded-full bg-gradient-to-br from-blue-500/30 via-emerald-400/10 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl grid gap-8 rounded-2xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-blue-400 to-emerald-300 p-3 text-slate-900 shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Aurora ERP</p>
              <h1 className="text-3xl font-semibold text-white">自动排程演示</h1>
              <p className="mt-1 text-sm text-slate-300">高端 ERP 风格，支持自定义员工表登录与头像上传</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-slate-200 shadow-inner">
            <p className="font-semibold text-white">演示说明</p>
            <ul className="mt-2 space-y-1 text-slate-200/90">
              <li>· 登录基于 employee_user 表（未使用 Supabase Auth）</li>
              <li>· 勾选“记住密码”将使用本地 base64 保存（仅演示）</li>
              <li>· 登录成功后可在“我的”页面更换头像，直传 avatars bucket</li>
            </ul>
          </div>
        </div>

        <form className="space-y-5 rounded-2xl bg-white/80 p-8 text-slate-900 shadow-xl ring-1 ring-slate-200" onSubmit={handleSubmit}>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Welcome Back</p>
            <h2 className="text-2xl font-semibold text-slate-900">员工登录</h2>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">登录名</label>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-inner">
              <UserRound className="h-4 w-4 text-slate-400" />
              <input
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                className="flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="请输入登录名"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">密码</label>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-inner">
              <Lock className="h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="请输入密码"
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
                checked={remember}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setRemember(enabled);
                  if (!enabled) {
                    saveRemember({ enabled: false, login_name: '', password_encoded: '' });
                    setPassword('');
                    setLoginName('');
                  }
                }}
              />
              记住密码（仅演示）
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
                checked={autoLogin}
                onChange={(e) => setAutoLogin(e.target.checked)}
              />
              自动登录
            </label>
          </div>
          {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 ring-1 ring-red-200">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:scale-[1.01] disabled:opacity-70"
          >
            <span className="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-100" />
            <Shield className="h-4 w-4" /> {loading ? '登录中…' : '进入系统'}
          </button>
          <p className="text-xs text-slate-500">演示用途：记住密码会将凭据 base64 存在浏览器，请勿用于真实生产环境。</p>
        </form>
      </div>
    </div>
  );
}
