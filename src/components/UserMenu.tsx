/**
 * UserMenu Component
 * 
 * Displays a user profile dropdown menu in the application header.
 * Features:
 * - User avatar with first letter of username
 * - Username display with admin badge
 * - Dropdown menu with user info
 * - Admin dashboard link (for admin users only)
 * - Logout functionality
 * - Click outside to close menu
 * 
 * This component is typically placed in the top-right corner of the app.
 */

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import '../styles/inline-styles-fix.css';

/**
 * UserMenu Component
 * Renders a user profile dropdown menu
 */
const UserMenu: React.FC = () => {
  // Get authentication state and functions
  const { user, logout, isAdmin } = useAuth();
  
  // State for controlling dropdown visibility
  const [isOpen, setIsOpen] = useState(false);

  // Don't render anything if user is not logged in
  if (!user) return null;

  return (
    <div className="user-menu-container">
      {/* Main menu button with user avatar and info */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="user-menu-button"
      >
        {/* User avatar circle with first letter of username */}
        <div className="user-menu-avatar">
          {user.username.charAt(0).toUpperCase()}
        </div>
        
        {/* Username */}
        <span>{user.username}</span>
        
        {/* Admin badge (only shown for admin users) */}
        {isAdmin && (
          <span className="user-menu-admin-badge">
            Admin
          </span>
        )}
        
        {/* Dropdown arrow */}
        <span className={`user-menu-dropdown-arrow ${isOpen ? 'open' : ''}`}>
          ▼
        </span>
      </button>

      {/* Dropdown menu (only visible when isOpen is true) */}
      {isOpen && (
        <>
          {/* Invisible overlay to close menu when clicking outside */}
          <div
            className="user-menu-dropdown-overlay"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu content */}
          <div className="user-menu-dropdown">
            {/* User info header */}
            <div className="user-menu-header">
              <div className="user-menu-username">
                {user.username}
              </div>
              <div className="user-menu-email">
                {user.email}
              </div>
            </div>

            {/* Menu items */}
            <div className="user-menu-items">
              {/* Admin dashboard link (only visible to admin users) */}
              {isAdmin && (
                <a
                  href="/admin"
                  className="user-menu-admin-link"
                  onClick={() => setIsOpen(false)}
                >
                  🛠️ Admin Dashboard
                </a>
              )}
              
              {/* Logout button */}
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="user-menu-logout-button"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
