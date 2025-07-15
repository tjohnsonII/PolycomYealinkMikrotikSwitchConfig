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

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../components/AuthContext';
import { getApiUrl } from '../utils/api-config';
import type { User } from '../types/auth';
import '../styles/123net-theme.css';

// Interface for user data structure with additional admin fields
interface AdminUser extends User {
  status?: 'pending' | 'approved' | 'denied';
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  deniedAt?: string;
  deniedBy?: string;
  denialReason?: string;
  ipAddress?: string;
}

// Interface for pending user data
interface PendingUser {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  ipAddress?: string;
}

/**
 * AdminPage Component
 * Main admin dashboard for user management
 */
const AdminPage: React.FC = () => {
  // Component state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
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

  /**
   * Fetch all users from the API
   * Called on component mount and after user operations
   */
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(getApiUrl('admin/users'), {
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
    } catch {
      setError('Error fetching users');
    } finally {
      setLoading(false);
    }
  }, [token]);

  /**
   * Fetch pending users from the API
   */
  const fetchPendingUsers = useCallback(async () => {
    try {
      const response = await fetch(getApiUrl('admin/pending-users'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const pendingData = await response.json();
        setPendingUsers(pendingData);
      } else {
        console.error('Failed to fetch pending users');
      }
    } catch (err) {
      console.error('Error fetching pending users:', err);
    } finally {
      setPendingLoading(false);
    }
  }, [token]);

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
    fetchPendingUsers();
  }, [fetchUsers, fetchPendingUsers]);

  /**
   * Update a user's role (admin/user)
   * @param userId - ID of the user to update
   * @param newRole - New role to assign ('admin' or 'user')
   */
  const updateUserRole = async (userId: number, newRole: 'admin' | 'user') => {
    try {
      const response = await fetch(getApiUrl('admin/users') + `/${userId}/role`, {
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
    } catch {
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
      const response = await fetch(getApiUrl('admin/users') + `/${userId}`, {
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
    } catch {
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
      const response = await fetch(getApiUrl('admin/users'), {
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
    } catch {
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

  /**
   * Approve a pending user
   * @param userId - ID of the user to approve
   */
  const approveUser = async (userId: number) => {
    try {
      const endpoint = getApiUrl('admin/approve-user/{id}').replace('{id}', userId.toString());
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminAction: true })
      });

      if (response.ok) {
        // Remove from pending users and refresh data
        setPendingUsers(pendingUsers.filter((user: PendingUser) => user.id !== userId));
        fetchUsers(); // Refresh the main users list
        setError(''); // Clear any previous errors
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to approve user');
      }
    } catch {
      setError('Error approving user');
    }
  };

  /**
   * Deny a pending user
   * @param userId - ID of the user to deny
   * @param reason - Optional reason for denial
   */
  const denyUser = async (userId: number, reason?: string) => {
    try {
      const endpoint = getApiUrl('admin/deny-user/{id}').replace('{id}', userId.toString());
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminAction: true, reason })
      });

      if (response.ok) {
        // Remove from pending users
        setPendingUsers(pendingUsers.filter((user: PendingUser) => user.id !== userId));
        setError(''); // Clear any previous errors
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to deny user');
      }
    } catch {
      setError('Error denying user');
    }
  };

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <div className="loading-container">
        Loading users...
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      {/* Page header with title and user count */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">
          Admin Dashboard
        </h1>
        <div className="admin-page-user-count">
          {users.length} Total Users
        </div>
      </div>

      {/* Error message display */}
      {error && (
        <div className="error-container">
          {error}
        </div>
      )}

      {/* Recent Registrations Alert */}
      {!pendingLoading && pendingUsers.length > 0 && (
        <div className="pending-users-alert">
          <div className="pending-users-alert-header">
            <span className="pending-users-alert-icon">🔔</span>
            <h3 className="pending-users-alert-title">
              New User Registrations Waiting for Approval!
            </h3>
          </div>
          <p className="pending-users-alert-message">
            {pendingUsers.length} user{pendingUsers.length > 1 ? 's' : ''} 
            {pendingUsers.length === 1 ? ' has' : ' have'} registered and 
            {pendingUsers.length === 1 ? ' is' : ' are'} waiting for your approval.
          </p>
          <div className="pending-users-alert-latest">
            <strong>Latest:</strong> {pendingUsers[pendingUsers.length - 1]?.username} 
            ({pendingUsers[pendingUsers.length - 1]?.email})
          </div>
        </div>
      )}

      {/* Pending Users Section */}
      {!pendingLoading && pendingUsers.length > 0 && (
        <div className="pending-section">
          <div className="pending-section-header">
            <h2 className="pending-section-title">
              🕐 Pending Approvals
            </h2>
            <span className="pending-section-count">
              {pendingUsers.length}
            </span>
          </div>

          <div className="pending-users-table-container">
            <table className="pending-users-table">
              <thead className="pending-users-table-header">
                <tr>
                  <th className="pending-users-table-th">Username</th>
                  <th className="pending-users-table-th">Email</th>
                  <th className="pending-users-table-th">Requested</th>
                  <th className="pending-users-table-th">IP Address</th>
                  <th className="pending-users-table-th pending-users-table-td-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map(user => (
                  <tr key={user.id} className="pending-users-table-row">
                    <td className="pending-users-table-td pending-users-table-td-bold">{user.username}</td>
                    <td className="pending-users-table-td">{user.email}</td>
                    <td className="pending-users-table-td pending-users-table-td-muted">
                      {new Date(user.createdAt).toLocaleDateString()} {new Date(user.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="pending-users-table-td pending-users-table-td-muted">{user.ipAddress || 'Unknown'}</td>
                    <td className="pending-users-table-td pending-users-table-td-center">
                      <div className="pending-users-table-actions">
                        <button
                          onClick={() => approveUser(user.id)}
                          className="pending-approve-btn"
                          title="Approve user"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Reason for denial (optional):');
                            denyUser(user.id, reason || undefined);
                          }}
                          className="pending-deny-btn"
                          title="Deny user"
                        >
                          ❌ Deny
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main User Management Section */}
      <div className="user-management-section">
        <div className="user-management-header">
          <h2 className="user-management-title">
            User Management
          </h2>
          
          {/* Create User Button */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="create-user-btn"
          >
            + Create New User
          </button>
        </div>

        {/* Users table */}
        <div className="users-table-container">
          {/* Table header */}
          <div className="users-table-header">
            <div>ID</div>
            <div>Username</div>
            <div>Role</div>
            <div>Created</div>
            <div>Actions</div>
          </div>

          {/* User rows */}
          {users.map((user) => (
            <div
              key={user.id}
              className="users-table-row"
            >
              {/* User ID */}
              <div className="users-table-id">
                #{user.id}
              </div>
              
              {/* Username and email */}
              <div>
                <div className="users-table-username">
                  {user.username}
                </div>
                <div className="users-table-email">
                  {user.email}
                </div>
              </div>
              
              {/* Role selector dropdown */}
              <div>
                <select
                  value={user.role}
                  onChange={(e) => updateUserRole(user.id, e.target.value as 'admin' | 'user')}
                  className={`users-table-role-select ${user.role}`}
                  title="Change user role"
                  aria-label="Change user role"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              {/* Creation date */}
              <div className="users-table-date">
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
              
              {/* Action buttons */}
              <div className="users-table-actions">
                <button
                  onClick={() => deleteUser(user.id)}
                  className="users-table-delete-btn"
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
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
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
                className="modal-close-btn"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">
                  Username *
                </label>
                <input
                  type="text"
                  value={createFormData.username}
                  onChange={(e) => setCreateFormData({
                    ...createFormData,
                    username: e.target.value
                  })}
                  className="form-input"
                  placeholder="Enter username"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Email *
                </label>
                <input
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({
                    ...createFormData,
                    email: e.target.value
                  })}
                  className="form-input"
                  placeholder="Enter email address"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Password *
                </label>
                <input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({
                    ...createFormData,
                    password: e.target.value
                  })}
                  className="form-input"
                  placeholder="Enter password (min 6 characters)"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Role
                </label>
                <select
                  value={createFormData.role}
                  onChange={(e) => setCreateFormData({
                    ...createFormData,
                    role: e.target.value as 'admin' | 'user'
                  })}
                  className="form-select"
                  title="Select user role"
                  aria-label="Select user role"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-actions">
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
                  className="form-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="form-submit-btn"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instructions section */}
      <div className="instructions-section">
        <h3 className="instructions-title">
          Admin Instructions
        </h3>
        <ul className="instructions-list">
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
