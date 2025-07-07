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
    <div style={{ position: 'relative' }}>
      {/* Main menu button with user avatar and info */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: '#fff',
          border: '2px solid #e1e5e9',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          color: '#333',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.borderColor = '#667eea';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.borderColor = '#e1e5e9';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* User avatar circle with first letter of username */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          {user.username.charAt(0).toUpperCase()}
        </div>
        
        {/* Username */}
        <span>{user.username}</span>
        
        {/* Admin badge (only shown for admin users) */}
        {isAdmin && (
          <span style={{
            background: '#28a745',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: '10px',
            fontSize: '10px',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}>
            Admin
          </span>
        )}
        
        {/* Dropdown arrow */}
        <span style={{
          fontSize: '12px',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>
          ▼
        </span>
      </button>

      {/* Dropdown menu (only visible when isOpen is true) */}
      {isOpen && (
        <>
          {/* Invisible overlay to close menu when clicking outside */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu content */}
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: '#fff',
            border: '1px solid #e1e5e9',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '200px',
            overflow: 'hidden'
          }}>
            {/* User info header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #f0f0f0',
              background: '#f8f9fa'
            }}>
              <div style={{ fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                {user.username}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {user.email}
              </div>
            </div>

            {/* Menu items */}
            <div style={{ padding: '8px 0' }}>
              {/* Admin dashboard link (only visible to admin users) */}
              {isAdmin && (
                <a
                  href="/admin"
                  style={{
                    display: 'block',
                    padding: '12px 16px',
                    color: '#333',
                    textDecoration: 'none',
                    transition: 'background 0.2s',
                    fontSize: '14px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
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
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  color: '#dc3545',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  fontSize: '14px'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
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
