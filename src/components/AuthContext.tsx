/**
 * Authentication Context for React Application
 * 
 * This context provides authentication state management throughout the app.
 * Features:
 * - User login/logout functionality
 * - User registration
 * - JWT token management
 * - Role-based access control
 * - Automatic token validation
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// Type definitions for user data and context
interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;                    // Current authenticated user
  token: string | null;                 // JWT token
  login: (username: string, password: string) => Promise<void>;     // Login function
  register: (username: string, email: string, password: string) => Promise<void>;  // Register function
  logout: () => void;                   // Logout function
  isAuthenticated: boolean;             // Whether user is logged in
  isAdmin: boolean;                     // Whether user has admin role
  loading: boolean;                     // Loading state for auth operations
}

// Create context with undefined default (will throw error if used outside provider)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API base URL for authentication endpoints
const API_BASE_URL = 'http://localhost:3001/api';

/**
 * AuthProvider Component
 * Provides authentication context to all child components
 * 
 * @param children - Child components that will have access to auth context
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State management for authentication
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Effect to validate token and fetch user data on component mount
  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  /**
   * Fetch current user data using stored token
   * Validates token and retrieves user information
   */
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      // Clear invalid token on error
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login function
   * Authenticates user with username and password
   * 
   * @param username - User's username
   * @param password - User's password
   * @throws Error if login fails
   */
  const login = async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }

    const data = await response.json();
    // Update state and store token in localStorage
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };

  /**
   * Registration function
   * Creates new user account and logs them in
   * 
   * @param username - Desired username
   * @param email - User's email address
   * @param password - User's password
   * @throws Error if registration fails
   */
  const register = async (username: string, email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Registration failed');
    }

    const data = await response.json();
    // Update state and store token in localStorage
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };

  /**
   * Logout function
   * Clears user data and removes token from localStorage
   */
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  // Create context value object with all auth functions and state
  const value = {
    user,                                    // Current user object or null
    token,                                   // JWT token or null
    login,                                   // Login function
    register,                                // Registration function
    logout,                                  // Logout function
    isAuthenticated: !!user,                 // Boolean: true if user is logged in
    isAdmin: user?.role === 'admin',         // Boolean: true if user is admin
    loading                                  // Boolean: true during auth operations
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use authentication context
 * Must be used within an AuthProvider component
 * 
 * @returns AuthContextType object with auth state and functions
 * @throws Error if used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
