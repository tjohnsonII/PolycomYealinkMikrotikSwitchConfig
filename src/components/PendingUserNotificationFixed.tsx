import React, { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../utils/api-config';
import '../styles/inline-styles-fix.css';

interface PendingUser {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  ipAddress?: string;
}

interface PendingUserNotificationProps {
  onPendingUsersUpdate?: (count: number) => void;
}

const PendingUserNotification: React.FC<PendingUserNotificationProps> = ({ onPendingUsersUpdate }) => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPendingUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('admin/pending-users'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const users = await response.json();
        setPendingUsers(users);
        onPendingUsersUpdate?.(users.length);
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
    }
  }, [onPendingUsersUpdate]);

  useEffect(() => {
    fetchPendingUsers();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingUsers, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingUsers]);

  const handleApprove = async (userId: number, username: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = getApiUrl('admin/approve-user/{id}').replace('{id}', userId.toString());
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchPendingUsers();
        alert(`User ${username} has been approved successfully!`);
      } else {
        alert('Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Error approving user');
    }
    setIsLoading(false);
  };

  const handleDeny = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to deny access for ${username}?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = getApiUrl('admin/deny-user/{id}').replace('{id}', userId.toString());
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchPendingUsers();
        alert(`User ${username} has been denied access.`);
      } else {
        alert('Failed to deny user');
      }
    } catch (error) {
      console.error('Error denying user:', error);
      alert('Error denying user');
    }
    setIsLoading(false);
  };

  if (pendingUsers.length === 0) {
    return null;
  }

  if (!isVisible) {
    return (
      <div className="pending-user-notification-collapsed" onClick={() => setIsVisible(true)}>
        {pendingUsers.length} pending user{pendingUsers.length > 1 ? 's' : ''}
      </div>
    );
  }

  return (
    <div className="pending-user-notification-panel">
      <div className="pending-user-notification-header">
        <h3 className="pending-user-notification-title">
          🔔 Pending User Approvals ({pendingUsers.length})
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="pending-user-notification-close"
        >
          ×
        </button>
      </div>

      {pendingUsers.map(user => (
        <div key={user.id} className="pending-user-notification-item">
          <div className="pending-user-notification-item-content">
            <strong>{user.username}</strong><br />
            <small className="pending-user-notification-email">{user.email}</small><br />
            <small className="pending-user-notification-meta">
              Registered: {new Date(user.createdAt).toLocaleString()}
              {user.ipAddress && ` from ${user.ipAddress}`}
            </small>
          </div>
          
          <div className="pending-user-notification-buttons">
            <button
              onClick={() => handleApprove(user.id, user.username)}
              disabled={isLoading}
              className="pending-user-notification-approve"
            >
              ✓ Approve
            </button>
            <button
              onClick={() => handleDeny(user.id, user.username)}
              disabled={isLoading}
              className="pending-user-notification-deny"
            >
              ✗ Deny
            </button>
          </div>
        </div>
      ))}

      <div className="pending-user-notification-footer">
        Updates automatically every 30 seconds
      </div>
    </div>
  );
};

export default PendingUserNotification;
