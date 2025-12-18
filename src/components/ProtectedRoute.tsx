import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSession } from '../lib/auth';
import { Role } from '../types';

interface Props {
  children: ReactNode;
  allowRoles?: Role[];
}

export function ProtectedRoute({ children, allowRoles }: Props) {
  const session = getSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowRoles && !allowRoles.includes(session.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
