import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/api-config';

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

  const fetchPendingUsers = async () => {
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
  };

  useEffect(() => {
    fetchPendingUsers();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingUsers, 30000);
    return () => clearInterval(interval);
  }, []);

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
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#ff9800',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '5px',
        cursor: 'pointer',
        zIndex: 1000,
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
      }} onClick={() => setIsVisible(true)}>
        {pendingUsers.length} pending user{pendingUsers.length > 1 ? 's' : ''}
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: '#fff',
      border: '2px solid #ff9800',
      borderRadius: '8px',
      padding: '20px',
      maxWidth: '400px',
      maxHeight: '500px',
      overflow: 'auto',
      zIndex: 1000,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        borderBottom: '1px solid #ddd',
        paddingBottom: '10px'
      }}>
        <h3 style={{ margin: 0, color: '#ff9800' }}>
          🔔 Pending User Approvals ({pendingUsers.length})
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          ×
        </button>
      </div>

      {pendingUsers.map(user => (
        <div key={user.id} style={{
          backgroundColor: '#f9f9f9',
          padding: '15px',
          marginBottom: '10px',
          borderRadius: '5px',
          border: '1px solid #ddd'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>{user.username}</strong><br />
            <small style={{ color: '#666' }}>{user.email}</small><br />
            <small style={{ color: '#888' }}>
              Registered: {new Date(user.createdAt).toLocaleString()}
              {user.ipAddress && ` from ${user.ipAddress}`}
            </small>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleApprove(user.id, user.username)}
              disabled={isLoading}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              ✓ Approve
            </button>
            <button
              onClick={() => handleDeny(user.id, user.username)}
              disabled={isLoading}
              style={{
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              ✗ Deny
            </button>
          </div>
        </div>
      ))}

      <div style={{
        marginTop: '15px',
        paddingTop: '10px',
        borderTop: '1px solid #ddd',
        fontSize: '12px',
        color: '#666'
      }}>
        Updates automatically every 30 seconds
      </div>
    </div>
  );
};

export default PendingUserNotification;
