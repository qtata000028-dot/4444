import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { getCurrentUser, logout } from '../lib/auth';

interface TopBarProps {
  title: string;
  actions?: React.ReactNode;
  showBack?: boolean;
}

export function TopBar({ title, actions, showBack = true }: TopBarProps) {
  const navigate = useNavigate();
  const user = getCurrentUser();

  return (
    <header className="sticky top-0 z-10 mb-4 flex items-center justify-between bg-white/70 px-4 py-3 backdrop-blur border-b border-slate-200">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            type="button"
            className="flex items-center gap-1 text-slate-600 hover:text-primary"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回</span>
          </button>
        )}
        <div className="text-lg font-semibold text-slate-900">{title}</div>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <Link className="text-primary underline" to="/board">
          排程看板
        </Link>
        {actions}
        {user && (
          <div className="flex items-center gap-2">
            <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">
              {user.emp_name} · {user.role}
            </span>
            <button
              type="button"
              className="flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-100"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut className="h-4 w-4" />
              退出
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
