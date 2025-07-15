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
  const [success, setSuccess] = useState('');
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
    setSuccess('');

    try {
      if (isRegister) {
        // Call registration function
        const result = await register(username, email, password);
        if (result.success) {
          setSuccess(result.message);
          // Clear form
          setUsername('');
          setEmail('');
          setPassword('');
        } else {
          setError(result.message);
        }
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
    <div className="login-container">
      {/* 123.net branding header */}
      <div className="login-brand-header">
        <Logo123Net size="large" showText={true} variant="white" />
        <div className="login-brand-title">
          Polycom/Yealink Configuration Manager
        </div>
        <div className="login-brand-subtitle">
          THE INTERNET YOU CAN COUNT ON
        </div>
      </div>

      {/* Main login/register card */}
      <div className="login-card">
        {/* Header */}
        <h2 className="login-title">
          {isRegister ? 'Create Account' : 'Welcome Back'}
        </h2>

        {/* Error message display */}
        {error && (
          <div className="alert alert-danger login-error" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        {/* Success message display */}
        {success && (
          <div className="alert alert-success login-success" role="alert" aria-live="polite">
            {success}
          </div>
        )}

        {/* Login/Registration form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Username field */}
          <div className="login-form-group">
            <label htmlFor="username" className="login-form-label">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-form-input"
              aria-required="true"
              aria-describedby="username-desc"
              autoComplete="username"
              required
            />
            <span id="username-desc" className="sr-only">
              Enter your username to {isRegister ? 'create an account' : 'sign in'}
            </span>
          </div>

          {/* Email field (only shown in registration mode) */}
          {isRegister && (
            <div className="login-form-group">
              <label htmlFor="email" className="login-form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-form-input"
                aria-required="true"
                aria-describedby="email-desc"
                autoComplete="email"
                required
              />
              <span id="email-desc" className="sr-only">
                Enter your email address for account creation
              </span>
            </div>
          )}

          {/* Password field */}
          <div className="login-form-group">
            <label htmlFor="password" className="login-form-label">
              Password
            </label>
            {isRegister ? (
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-form-input"
                aria-required="true"
                aria-describedby="password-desc"
                autoComplete="new-password"
                required
              />
            ) : (
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-form-input"
                aria-required="true"
                aria-describedby="password-desc"
                autoComplete="current-password"
                required
              />
            )}
            <span id="password-desc" className="sr-only">
              Enter your password
            </span>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="login-submit-button"
            aria-label={loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
          >
            {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        {/* Toggle between login and registration */}
        <div className="login-toggle-section">
          <span className="login-toggle-text">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button
            onClick={onToggleMode}
            className="login-toggle-button"
            aria-label={isRegister ? 'Switch to sign in' : 'Switch to create account'}
          >
            {isRegister ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
