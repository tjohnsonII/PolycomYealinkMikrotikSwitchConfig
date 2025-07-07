import React from 'react';
import { useAuth } from './AuthContext';
import Login from '../pages/Login';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [isRegister, setIsRegister] = React.useState(false);

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

  if (!isAuthenticated) {
    return (
      <Login 
        onToggleMode={() => setIsRegister(!isRegister)} 
        isRegister={isRegister} 
      />
    );
  }

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

  return <>{children}</>;
};

export default ProtectedRoute;
