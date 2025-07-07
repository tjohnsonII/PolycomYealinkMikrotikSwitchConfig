import React, { useState } from 'react';
import { useAuth } from './AuthContext';

const UserMenu: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div style={{ position: 'relative' }}>
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
        <span>{user.username}</span>
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
        <span style={{
          fontSize: '12px',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <>
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

            <div style={{ padding: '8px 0' }}>
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
