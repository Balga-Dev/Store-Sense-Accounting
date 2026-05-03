import { useState, useEffect } from 'react';
import { usersApi, rolesApi } from '../services/api';
import { Plus, Search, Edit2, Trash2, X, Key, Shield } from 'lucide-react';

const Employees = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    roleId: ''
  });
  const [passwordData, setPasswordData] = useState({ userId: '', newPassword: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        usersApi.getAll(),
        rolesApi.getAll()
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await usersApi.update(editingId, formData);
      } else {
        await usersApi.create(formData);
      }
      setShowModal(false);
      setEditingId(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleEdit = (user) => {
    setFormData({
      username: user.username,
      password: '',
      email: user.email || '',
      fullName: user.fullName || '',
      roleId: user.roleId
    });
    setEditingId(user.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await usersApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleResetPassword = async () => {
    try {
      await usersApi.resetPassword(passwordData.userId, { newPassword: passwordData.newPassword });
      setShowPasswordModal(false);
      setPasswordData({ userId: '', newPassword: '' });
    } catch (error) {
      console.error('Failed to reset password:', error);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await usersApi.toggleStatus(id);
      loadData();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      email: '',
      fullName: '',
      roleId: ''
    });
  };

  const filtered = users.filter(user => {
    if (!search) return true;
    return user.username.toLowerCase().includes(search.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (user.fullName || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="flex-between mb-6">
        <h2>Employee Management</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setEditingId(null); setShowModal(true); }}>
          <Plus size={16} /> Add Employee
        </button>
      </div>

      <div className="card">
        <div className="mb-4">
          <div className="search-input">
            <Search size={16} />
            <input
              className="form-input"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36, width: 300 }}
            />
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? filtered.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 500 }}>{user.username}</td>
                    <td>{user.fullName || '-'}</td>
                    <td>{user.email || '-'}</td>
                    <td>
                      <span className="badge badge-secondary">{user.role?.name}</span>
                    </td>
                    <td>
                      <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex-gap">
                        <button className="btn-icon" onClick={() => handleEdit(user)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-icon" onClick={() => { setPasswordData({ userId: user.id, newPassword: '' }); setShowPasswordModal(true); }} title="Reset Password">
                          <Key size={16} />
                        </button>
                        <button className="btn-icon" onClick={() => handleToggleStatus(user.id)} title="Toggle Status">
                          <Shield size={16} />
                        </button>
                        <button className="btn-icon" onClick={() => handleDelete(user.id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <h3>No employees found</h3>
                        <p>Add your first employee to get started</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Employee' : 'Add Employee'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    className="form-input"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    disabled={!!editingId}
                  />
                </div>
                {!editingId && (
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingId}
                    />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-input"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    required
                  >
                    <option value="">Select a role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reset Password</h3>
              <button className="btn-icon" onClick={() => setShowPasswordModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
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
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleResetPassword}>
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
