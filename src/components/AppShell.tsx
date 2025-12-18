import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout, getSession } from '../lib/auth';
import { LogOut, PanelLeft, User, LayoutDashboard, Box, Layers, ChartBar, Table2 } from 'lucide-react';

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const navItems = [
  { to: '/board', label: '排程看板', icon: LayoutDashboard },
  { to: '/orders', label: '订单管理', icon: Box },
  { to: '/steps', label: '工艺步骤', icon: Layers },
  { to: '/impact', label: '影响分析', icon: ChartBar },
  { to: '/tables', label: '数据表字典', icon: Table2 },
  { to: '/me', label: '我的', icon: User },
];

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const navigate = useNavigate();
  const session = getSession();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white/80 px-4 py-6 shadow-sm lg:flex">
        <div className="mb-8 flex items-center gap-3 px-2 text-slate-800">
          <PanelLeft className="h-6 w-6 text-blue-500" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Aurora ERP</p>
            <p className="text-lg font-semibold">排程演示</p>
          </div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-slate-100 ${
                    isActive ? 'bg-slate-100 text-slate-900 ring-1 ring-slate-200' : 'text-slate-600'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">
          <div className="font-semibold text-slate-700">{session?.emp_name || '未登录'}</div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span>{session?.role}</span>
            <button
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut className="h-4 w-4" /> 退出
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">ERP Suite</p>
              <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
              {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
            <button
              onClick={() => navigate('/me')}
              className="hidden items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-200 lg:flex"
            >
              <User className="h-4 w-4" /> 我的
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
