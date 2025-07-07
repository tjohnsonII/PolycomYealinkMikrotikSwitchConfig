/**
 * ProtectedRoute Component
 * 
 * Provides route-level authentication and authorization protection.
 * This component wraps other components and ensures users are authenticated
 * before allowing access. Optionally requires admin role.
 * 
 * Features:
 * - Redirects unauthenticated users to login page
 * - Shows loading spinner during auth check
 * - Optionally enforces admin-only access
 * - Displays access denied for insufficient permissions
 */

import React from 'react';
import { useAuth } from './AuthContext';
import Login from '../pages/Login';

// Props interface for ProtectedRoute component
interface ProtectedRouteProps {
  children: React.ReactNode;           // Components to render if access is granted
  requireAdmin?: boolean;              // Whether admin role is required (default: false)
}

/**
 * ProtectedRoute Component
 * 
 * @param children - Child components to render if user has access
 * @param requireAdmin - If true, user must have admin role to access
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  // Get authentication state from context
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  // State for toggling between login and registration forms
  const [isRegister, setIsRegister] = React.useState(false);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!isAuthenticated) {
    return (
      <Login 
        onToggleMode={() => setIsRegister(!isRegister)} 
        isRegister={isRegister} 
      />
    );
  }

  // Show access denied if admin is required but user is not admin
  if (requireAdmin && !isAdmin) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        color: '#666'
      }}>
        <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>Access Denied</h2>
        <p>You need admin privileges to access this page.</p>
      </div>
    );
  }

  // User is authenticated and has required permissions, render children
  return <>{children}</>;
};

export default ProtectedRoute;
