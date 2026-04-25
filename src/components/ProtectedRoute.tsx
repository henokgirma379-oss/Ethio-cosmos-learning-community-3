import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAdmin, authReady } = useAuth();
  const location = useLocation();

  // Wait for the initial session check to complete.
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-white flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-orange-500 border-b-transparent rounded-full animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  // If no user is logged in, redirect to login page.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If admin is required but user is not an admin, redirect to home.
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
