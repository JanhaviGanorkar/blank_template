import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/store';
import { authService } from '../api/apiclient';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true,
  redirectTo = '/login'
}) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Check token validity on route access
  useEffect(() => {
    const hasValidToken = authService.isAuthenticated();
    
    if (requireAuth && !hasValidToken) {
      console.log('🔍 Protected route accessed without valid token');
    }
  }, [requireAuth, location.pathname]);

  // Get current authentication status
  const hasValidToken = authService.isAuthenticated();
  const isUserAuthenticated = isAuthenticated && hasValidToken;

  // Debug authentication status
  // console.log('🛡️ ProtectedRoute Check:', {
  //   path: location.pathname,
  //   requireAuth,
  //   isAuthenticated,
  //   hasValidToken,
  //   user: user?.name || 'none',
  //   finalAuth: isUserAuthenticated
  // });

  if (requireAuth && !isUserAuthenticated) {
    // Construct redirect URL with message and return path
    const searchParams = new URLSearchParams();
    searchParams.set('message', 'Please log in to access this page');
    searchParams.set('redirect', location.pathname + location.search);
    
    const redirectUrl = `${redirectTo}?${searchParams.toString()}`;
    
    console.log('🚫 Access denied, redirecting to:', redirectUrl);
    return <Navigate to={redirectUrl} replace />;
  }

  // If user is authenticated but trying to access auth pages, redirect to dashboard
  if (!requireAuth && isUserAuthenticated && (
    location.pathname === '/login' || 
    location.pathname === '/register'
  )) {
    // console.log('✅ Authenticated user accessing auth page, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

// Higher-order component for protecting routes
export const withProtectedRoute = (Component: React.ComponentType, options?: Omit<ProtectedRouteProps, 'children'>) => {
  return (props: any) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Hook for checking authentication status in components
export const useAuthGuard = () => {
  const { isAuthenticated, user } = useAuth();
  const hasValidToken = authService.isAuthenticated();
  
  return {
    isAuthenticated: isAuthenticated && hasValidToken,
    user,
    hasValidToken,
    authService
  };
};