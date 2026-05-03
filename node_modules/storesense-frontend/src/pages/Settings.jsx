import { useState, useEffect } from 'react';
import { authApi, reportsApi } from '../services/api';
import useAuthStore from '../store/authStore';
import { Save, Key, Bell, Clock } from 'lucide-react';
import { format } from 'date-fns';

const Settings = () => {
  const { user, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activityLogs, setActivityLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [logsRes, notifRes] = await Promise.all([
        reportsApi.getActivityLogs({ limit: 20 }),
        reportsApi.getNotifications({ isRead: false })
      ]);
      setActivityLogs(logsRes.data.logs || []);
      setNotifications(notifRes.data || []);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirm) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    try {
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setPasswordData({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to change password' });
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'activity', label: 'Activity Log' }
  ];

  return (
    <div>
      <h2 className="mb-6">Settings</h2>

      <div className="tab-list">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {message.text && (
        <div className={message.type === 'error' ? 'error-message' : 'success-message'}>
          {message.text}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="card">
          <h3 className="card-title mb-4">Profile Information</h3>
          <div className="grid-2">
            <div>
              <p className="text-muted" style={{ fontSize: 13, marginBottom: 4 }}>Username</p>
              <p style={{ fontWeight: 500 }}>{user?.username}</p>
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: 13, marginBottom: 4 }}>Full Name</p>
              <p style={{ fontWeight: 500 }}>{user?.fullName || 'Not set'}</p>
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: 13, marginBottom: 4 }}>Email</p>
              <p style={{ fontWeight: 500 }}>{user?.email || 'Not set'}</p>
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: 13, marginBottom: 4 }}>Role</p>
              <p style={{ fontWeight: 500 }}>{user?.role?.name || user?.role}</p>
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: 13, marginBottom: 4 }}>Business</p>
              <p style={{ fontWeight: 500 }}>{user?.businessName}</p>
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: 13, marginBottom: 4 }}>Business Code</p>
              <p style={{ fontWeight: 500 }}>{user?.businessCode}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="card">
          <h3 className="card-title mb-4">Change Password</h3>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              <Key size={16} /> Update Password
            </button>
          </form>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="card">
          <h3 className="card-title mb-4">Recent Notifications</h3>
          {notifications.length > 0 ? (
            notifications.map(notif => (
              <div key={notif.id} style={{ padding: 12, borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong style={{ fontSize: 14 }}>{notif.title}</strong>
                  <span className="text-muted" style={{ fontSize: 12 }}>
                    {format(new Date(notif.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#64748b' }}>{notif.message}</p>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <Bell size={32} />
              <h3>No notifications</h3>
              <p>You're all caught up</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="card">
          <h3 className="card-title mb-4">Recent Activity</h3>
          {activityLogs.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{format(new Date(log.timestamp), 'MMM d, h:mm a')}</td>
                    <td>{log.user?.fullName || log.user?.username}</td>
                    <td>
                      <span className={`badge ${
                        log.action === 'CREATE' ? 'badge-success' :
                        log.action === 'DELETE' ? 'badge-danger' :
                        'badge-warning'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.entityType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <Clock size={32} />
              <h3>No activity logs</h3>
              <p>Activity will appear here as users interact with the system</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;
