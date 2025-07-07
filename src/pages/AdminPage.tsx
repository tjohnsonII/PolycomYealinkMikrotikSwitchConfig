/**
 * AdminPage Component
 * 
 * Comprehensive admin dashboard for user management.
 * Features:
 * - View all registered users in a clean table format
 * - Update user roles with dropdown selectors
 * - Delete user accounts with confirmation dialogs
 * - Real-time updates when making changes
 * - Responsive design for all screen sizes
 * - Admin-only access (protected by ProtectedRoute)
 * 
 * This component provides full CRUD operations for user management
 * and is only accessible to users with admin role.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';

// Interface for user data structure
interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

/**
 * AdminPage Component
 * Main admin dashboard for user management
 */
const AdminPage: React.FC = () => {
  // Component state
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });
  
  // Get authentication token from context
  const { token } = useAuth();

  // API base URL for admin endpoints
  const API_BASE_URL = 'http://localhost:3002/api';

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * Fetch all users from the API
   * Called on component mount and after user operations
   */
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

  /**
   * Update a user's role (admin/user)
   * @param userId - ID of the user to update
   * @param newRole - New role to assign ('admin' or 'user')
   */
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
        // Update local state to reflect the change
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

  /**
   * Delete a user account
   * Shows confirmation dialog before deletion
   * @param userId - ID of the user to delete
   */
  const deleteUser = async (userId: number) => {
    // Show confirmation dialog
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
        // Remove user from local state
        setUsers(users.filter(user => user.id !== userId));
      } else {
        setError('Failed to delete user');
      }
    } catch (err) {
      setError('Error deleting user');
    }
  };

  /**
   * Create a new user account
   * @param userData - User data for creation
   */
  const createUser = async (userData: {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
  }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const newUser = await response.json();
        // Add new user to local state
        setUsers([...users, newUser]);
        // Reset form and hide it
        setCreateFormData({
          username: '',
          email: '',
          password: '',
          role: 'user'
        });
        setShowCreateForm(false);
        setError(''); // Clear any previous errors
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Error creating user');
    }
  };

  /**
   * Handle form submission for creating a new user
   * @param e - Form submission event
   */
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!createFormData.username || !createFormData.email || !createFormData.password) {
      setError('All fields are required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createFormData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Password validation
    if (createFormData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    await createUser(createFormData);
  };

  // Show loading spinner while fetching data
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
      {/* Page header with title and user count */}
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

      {/* Error message display */}
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

      {/* User management section */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            color: '#333',
            fontSize: '24px',
            margin: 0,
            fontWeight: '500'
          }}>
            User Management
          </h2>
          
          {/* Create User Button */}
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(40, 167, 69, 0.3)';
            }}
          >
            + Create New User
          </button>
        </div>

        {/* Users table */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e9ecef'
        }}>
          {/* Table header */}
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
              {/* User ID */}
              <div style={{ fontWeight: '500', color: '#6c757d' }}>
                #{user.id}
              </div>
              
              {/* Username and email */}
              <div>
                <div style={{ fontWeight: '500', color: '#333', marginBottom: '4px' }}>
                  {user.username}
                </div>
                <div style={{ fontSize: '14px', color: '#6c757d' }}>
                  {user.email}
                </div>
              </div>
              
              {/* Role selector dropdown */}
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
              
              {/* Creation date */}
              <div style={{
                fontSize: '14px',
                color: '#6c757d'
              }}>
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
              
              {/* Action buttons */}
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

      {/* Create User Form Modal */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px',
              borderBottom: '2px solid #f0f0f0',
              paddingBottom: '15px'
            }}>
              <h3 style={{
                margin: 0,
                color: '#333',
                fontSize: '22px',
                fontWeight: '600'
              }}>
                Create New User
              </h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setError('');
                  setCreateFormData({
                    username: '',
                    email: '',
                    password: '',
                    role: 'user'
                  });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  Username *
                </label>
                <input
                  type="text"
                  value={createFormData.username}
                  onChange={(e) => setCreateFormData({
                    ...createFormData,
                    username: e.target.value
                  })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                  placeholder="Enter username"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({
                    ...createFormData,
                    email: e.target.value
                  })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                  placeholder="Enter email address"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  Password *
                </label>
                <input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({
                    ...createFormData,
                    password: e.target.value
                  })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                  placeholder="Enter password (min 6 characters)"
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  Role
                </label>
                <select
                  value={createFormData.role}
                  onChange={(e) => setCreateFormData({
                    ...createFormData,
                    role: e.target.value as 'admin' | 'user'
                  })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setError('');
                    setCreateFormData({
                      username: '',
                      email: '',
                      password: '',
                      role: 'user'
                    });
                  }}
                  style={{
                    padding: '12px 24px',
                    background: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#5a6268'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#6c757d'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(40, 167, 69, 0.3)';
                  }}
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instructions section */}
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
          <li>Click "Create New User" to add new user accounts directly from the admin dashboard</li>
          <li>Use the role dropdown to promote users to admin or demote them to regular users</li>
          <li>Click "Delete" to permanently remove a user account</li>
          <li>Admin users have access to this dashboard and can manage other users</li>
          <li>Regular users can only access the main application features</li>
          <li>All users can also register themselves using the registration form</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminPage;
