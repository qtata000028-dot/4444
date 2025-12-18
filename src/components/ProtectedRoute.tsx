import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'admin' | 'planner' | 'viewer';
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const user = getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (role && user.role !== role) {
    return (
      <div className="p-6 text-center text-red-600">
        无权限访问该页面（需要 {role}）。
      </div>
    );
  }
  return <>{children}</>;
}
