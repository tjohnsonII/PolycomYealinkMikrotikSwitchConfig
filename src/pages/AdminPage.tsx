import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  const API_BASE_URL = 'http://localhost:3001/api';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: number, newRole: 'admin' | 'user') => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
      } else {
        setError('Failed to update user role');
      }
    } catch (err) {
      setError('Error updating user role');
    }
  };

  const deleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
      } else {
        setError('Failed to delete user');
      }
    } catch (err) {
      setError('Error deleting user');
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading users...
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: '2px solid #f0f0f0',
        paddingBottom: '20px'
      }}>
        <h1 style={{
          margin: 0,
          color: '#333',
          fontSize: '32px',
          fontWeight: '600'
        }}>
          Admin Dashboard
        </h1>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {users.length} Total Users
        </div>
      </div>

      {error && (
        <div style={{
          background: '#fee',
          border: '1px solid #fcc',
          color: '#c66',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{
          color: '#333',
          fontSize: '24px',
          marginBottom: '20px',
          fontWeight: '500'
        }}>
          User Management
        </h2>

        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e9ecef'
        }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr 1fr 1fr 2fr',
            gap: '20px',
            padding: '15px 20px',
            background: '#e9ecef',
            fontWeight: '600',
            color: '#495057',
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            <div>ID</div>
            <div>Username</div>
            <div>Role</div>
            <div>Created</div>
            <div>Actions</div>
          </div>

          {/* User rows */}
          {users.map((user, index) => (
            <div
              key={user.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 1fr 1fr 2fr',
                gap: '20px',
                padding: '20px',
                borderBottom: index < users.length - 1 ? '1px solid #e9ecef' : 'none',
                background: '#fff',
                alignItems: 'center'
              }}
            >
              <div style={{ fontWeight: '500', color: '#6c757d' }}>
                #{user.id}
              </div>
              
              <div>
                <div style={{ fontWeight: '500', color: '#333', marginBottom: '4px' }}>
                  {user.username}
                </div>
                <div style={{ fontSize: '14px', color: '#6c757d' }}>
                  {user.email}
                </div>
              </div>
              
              <div>
                <select
                  value={user.role}
                  onChange={(e) => updateUserRole(user.id, e.target.value as 'admin' | 'user')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    background: user.role === 'admin' ? '#d4edda' : '#fff3cd',
                    color: user.role === 'admin' ? '#155724' : '#856404',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div style={{
                fontSize: '14px',
                color: '#6c757d'
              }}>
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => deleteUser(user.id)}
                  style={{
                    padding: '8px 16px',
                    background: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#c82333'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#dc3545'}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{
          margin: '0 0 15px 0',
          color: '#333',
          fontSize: '18px'
        }}>
          Admin Instructions
        </h3>
        <ul style={{
          margin: 0,
          paddingLeft: '20px',
          color: '#6c757d',
          lineHeight: '1.6'
        }}>
          <li>Use the role dropdown to promote users to admin or demote them to regular users</li>
          <li>Click "Delete" to permanently remove a user account</li>
          <li>Admin users have access to this dashboard and can manage other users</li>
          <li>Regular users can only access the main application features</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminPage;
