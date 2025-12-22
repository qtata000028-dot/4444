import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRemember, saveRemember, encodePassword, decodePassword } from '../lib/auth';
import { getPublicFileUrl } from '../lib/supabase';
import { backend } from '../api/tunnel';
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
  const [rememberAvatar, setRememberAvatar] = useState(rememberState.avatar_path || '');

  const rememberedAvatarUrl = rememberAvatar ? getPublicFileUrl('avatars', rememberAvatar) : '';

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
      const response = await backend.login(loginName, password);
      if (!response?.ok) {
        throw new Error(response?.message || '登录失败');
      }
      const session = response.user || {};
      localStorage.setItem('login_user', JSON.stringify(session));
      if (remember) {
        saveRemember({
          enabled: true,
          login_name: loginName,
          password_encoded: encodePassword(password),
          avatar_path: session.avatar_path || '',
        });
        setRememberAvatar(session.avatar_path || '');
      } else {
        saveRemember({ enabled: false, login_name: loginName, password_encoded: '', avatar_path: '' });
        setRememberAvatar('');
      }
      const redirect = (location.state as { from?: string } | null)?.from || '/me';
      navigate(redirect);
    } catch (err: unknown) {
      const message = (err as Error).message || '登录失败';
      setError(message);
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg relative flex min-h-screen items-center justify-center px-4 text-slate-50">
      <div className="stars" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.2),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.2),transparent_40%)]" />

      <div className="relative z-10 grid w-full max-w-5xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col justify-center gap-8 rounded-[32px] border border-white/15 bg-white/5 p-10 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.75)] backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-sky-300 via-indigo-300 to-emerald-200 p-3 text-slate-900 shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-200/80">Aurora ERP</p>
              <h1 className="text-4xl font-semibold text-white">星穹排程系统</h1>
              <p className="mt-2 text-sm text-slate-200/80">梦幻星空主题 · 自定义员工表登录 · 头像直传 Storage</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-5 text-sm leading-relaxed text-slate-200/90 shadow-inner">
            <p className="font-semibold text-white">登录须知</p>
            <ul className="mt-3 space-y-1">
              <li>· 使用 employee_user 表按姓名 + 密码校验</li>
              <li>· 记住密码仅保存在浏览器（演示用途）</li>
              <li>· 登录后可直接更换头像并同步到 Supabase</li>
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200/80">
              <p className="font-semibold text-white">灵感布局</p>
              <p className="mt-1">透明玻璃卡片、轻量阴影与星空背景融合。</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200/80">
              <p className="font-semibold text-white">体验方式</p>
              <p className="mt-1">记住密码后，下次登录可直接点击头像。</p>
            </div>
          </div>
        </div>

        <form
          className="relative space-y-5 rounded-[28px] border border-white/20 bg-white/10 p-8 text-slate-100 shadow-[0_25px_70px_-35px_rgba(15,23,42,0.9)] backdrop-blur-2xl"
          onSubmit={handleSubmit}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-200/70">Welcome</p>
              <h2 className="text-2xl font-semibold text-white">员工登录</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white shadow-lg">
              <Shield className="h-5 w-5" />
            </div>
          </div>

          {remember && rememberedAvatarUrl && (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              className="flex w-full items-center gap-4 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-left text-sm shadow-inner transition hover:border-white/40"
            >
              <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/30 shadow-lg">
                <img src={rememberedAvatarUrl} alt="avatar" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{loginName || '已记住账号'}</p>
                <p className="text-[11px] text-slate-200/70">点击头像快速登录</p>
              </div>
            </button>
          )}

          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm shadow-inner">
            <UserRound className="h-4 w-4 text-slate-200/80" />
            <input
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              className="flex-1 bg-transparent text-white outline-none placeholder:text-slate-300/60"
              placeholder="员工姓名"
              required
            />
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm shadow-inner">
            <Lock className="h-4 w-4 text-slate-200/80" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-transparent text-white outline-none placeholder:text-slate-300/60"
              placeholder="登录密码"
              required
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-200/70">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/40 bg-white/10 text-emerald-400"
                checked={remember}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setRemember(enabled);
                  if (!enabled) {
                    saveRemember({ enabled: false, login_name: loginName, password_encoded: '', avatar_path: '' });
                    setPassword('');
                    setRememberAvatar('');
                  }
                }}
              />
              记住密码
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/40 bg-white/10 text-emerald-400"
                checked={autoLogin}
                onChange={(e) => setAutoLogin(e.target.checked)}
              />
              自动登录
            </label>
          </div>

          {error && <div className="rounded-2xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-300 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-sky-500/30 transition hover:scale-[1.01] disabled:opacity-70"
          >
            <span className="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-100" />
            {loading ? '登录中…' : '进入系统'}
          </button>
          <p className="text-[11px] text-slate-200/50">仅演示：记住密码会保存于本地浏览器。</p>
        </form>
      </div>
    </div>
  );
}
