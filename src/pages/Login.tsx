/**
 * Login Component
 * 
 * Provides a modern, responsive login and registration interface.
 * Features:
 * - Toggle between login and registration modes
 * - Form validation and error handling
 * - Modern gradient design with animations
 * - Account creation for new users
 * - Responsive design for all screen sizes
 * 
 * This component is shown to unauthenticated users and handles
 * both login and account creation workflows.
 */

import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import Logo123Net from '../components/Logo123Net';
import '../styles/123net-theme.css';

// Props interface for Login component
interface LoginProps {
  onToggleMode: () => void;    // Function to toggle between login/register modes
  isRegister: boolean;         // Whether component is in registration mode
}

/**
 * Login Component
 * 
 * @param onToggleMode - Function to switch between login and registration
 * @param isRegister - If true, shows registration form; if false, shows login form
 */
const Login: React.FC<LoginProps> = ({ onToggleMode, isRegister }) => {
  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Get authentication functions from context
  const { login, register } = useAuth();

  /**
   * Handle form submission for both login and registration
   * @param e - Form submit event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        // Call registration function
        await register(username, email, password);
      } else {
        // Call login function
        await login(username, password);
      }
    } catch (err) {
      // Display error message
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-accent) 100%)', // 123.net blue gradient
      padding: '20px'
    }}>
      {/* 123.net branding header */}
      <div style={{
        position: 'absolute',
        top: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        color: 'white'
      }}>
        <Logo123Net size="large" showText={true} variant="white" />
        <div style={{
          color: 'white',
          fontSize: '18px',
          fontWeight: '600',
          marginTop: '8px'
        }}>
          Polycom/Yealink Configuration Manager
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: '14px'
        }}>
          THE INTERNET YOU CAN COUNT ON
        </div>
      </div>

      {/* Main login/register card */}
      <div style={{
        background: 'var(--bg-white)',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid var(--border-light)'
      }}>
        {/* Header */}
        <h2 style={{
          textAlign: 'center',
          marginBottom: '30px',
          color: 'var(--text-primary)',
          fontSize: '28px',
          fontWeight: '600'
        }}>
          {isRegister ? 'Create Account' : 'Welcome Back'}
        </h2>

        {/* Error message display */}
        {error && (
          <div className="alert alert-danger" style={{
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Login/Registration form */}
        <form onSubmit={handleSubmit}>
          {/* Username field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: 'var(--text-primary)',
              fontWeight: '500'
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid var(--border-medium)',
                borderRadius: '6px',
                fontSize: '16px',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                background: 'var(--bg-white)',
                color: 'var(--text-primary)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--brand-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-medium)'}
              required
            />
          </div>

          {/* Email field (only shown in registration mode) */}
          {isRegister && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: 'var(--text-primary)',
                fontWeight: '500'
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid var(--border-medium)',
                  borderRadius: '6px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                  background: 'var(--bg-white)',
                  color: 'var(--text-primary)'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--brand-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-medium)'}
                required
              />
            </div>
          )}

          {/* Password field */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: 'var(--text-primary)',
              fontWeight: '500'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid var(--border-medium)',
                borderRadius: '6px',
                fontSize: '16px',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                background: 'var(--bg-white)',
                color: 'var(--text-primary)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--brand-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-medium)'}
              required
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? 'var(--brand-gray-400)' : 'var(--brand-primary)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              marginBottom: '20px'
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#106ebe';
            }}
            onMouseOut={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = 'var(--brand-primary)';
            }}
          >
            {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        {/* Toggle between login and registration */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button
            onClick={onToggleMode}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--brand-primary)',
              cursor: 'pointer',
              textDecoration: 'underline',
              marginLeft: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {isRegister ? 'Sign In' : 'Create Account'}
          </button>
        </div>


      </div>
    </div>
  );
};

export default Login;
