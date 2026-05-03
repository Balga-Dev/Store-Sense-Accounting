import { useState, useEffect } from 'react';
import { rolesApi, usersApi } from '../services/api';
import { Plus, Edit2, Trash2, X, Shield, Users } from 'lucide-react';

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({ tabs: [], actions: [] });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState({ tabs: {}, actions: {} });
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        rolesApi.getAll(),
        rolesApi.getDefaultPermissions()
      ]);
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await rolesApi.update(editingRole.id, formData);
      } else {
        const res = await rolesApi.create(formData);
        const tabPerms = permissions.tabs.map(p => ({ permissionId: p.id, isEnabled: true }));
        const actionPerms = permissions.actions.map(p => ({ permissionId: p.id, isEnabled: true }));
        await rolesApi.setTabPermissions(res.data.id, { permissions: tabPerms });
        await rolesApi.setActionPermissions(res.data.id, { permissions: actionPerms });
      }
      setShowModal(false);
      setEditingRole(null);
      setFormData({ name: '', description: '' });
      loadData();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleEdit = (role) => {
    setFormData({ name: role.name, description: role.description || '' });
    setEditingRole(role);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this role? Users assigned to this role must be reassigned first.')) return;
    try {
      await rolesApi.delete(id);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete role');
    }
  };

  const openPermissions = (role) => {
    setEditingRole(role);
    const tabs = {};
    role.tabPermissions?.forEach(tp => { tabs[tp.permissionId] = tp.isEnabled; });
    const actions = {};
    role.actionPermissions?.forEach(ap => { actions[ap.permissionId] = ap.isEnabled; });
    setRolePermissions({ tabs, actions });
    setShowPermissionsModal(true);
  };

  const savePermissions = async () => {
    try {
      const tabPerms = permissions.tabs.map(p => ({
        permissionId: p.id,
        isEnabled: rolePermissions.tabs[p.id] ?? true
      }));
      const actionPerms = permissions.actions.map(p => ({
        permissionId: p.id,
        isEnabled: rolePermissions.actions[p.id] ?? true
      }));

      await rolesApi.setTabPermissions(editingRole.id, { permissions: tabPerms });
      await rolesApi.setActionPermissions(editingRole.id, { permissions: actionPerms });

      setShowPermissionsModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to save permissions:', error);
    }
  };

  return (
    <div>
      <div className="flex-between mb-6">
        <h2>Role & Permission Management</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { setFormData({ name: '', description: '' }); setEditingRole(null); setShowModal(true); }}>
          <Plus size={16} /> Create Role
        </button>
      </div>

      {loading ? (
        <div className="card"><p>Loading...</p></div>
      ) : (
        <div className="grid-2">
          {roles.map(role => (
            <div key={role.id} className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">{role.name}</h3>
                  {role.description && <p className="text-muted" style={{ fontSize: 13 }}>{role.description}</p>}
                  {role.isDefault && <span className="badge badge-secondary" style={{ marginTop: 4 }}>Default</span>}
                </div>
                <div className="flex-gap">
                  <span className="badge badge-secondary">
                    <Users size={12} /> {role._count?.users || 0} users
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Tab Access</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {role.tabPermissions?.filter(tp => tp.isEnabled).slice(0, 5).map(tp => (
                    <span key={tp.permissionId} className="badge badge-success" style={{ fontSize: 11 }}>
                      {tp.permission.label}
                    </span>
                  ))}
                  {role.tabPermissions?.filter(tp => tp.isEnabled).length > 5 && (
                    <span className="badge badge-secondary" style={{ fontSize: 11 }}>
                      +{role.tabPermissions.filter(tp => tp.isEnabled).length - 5} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-gap">
                <button className="btn btn-secondary btn-sm" onClick={() => openPermissions(role)}>
                  <Shield size={14} /> Permissions
                </button>
                {!role.isDefault && (
                  <>
                    <button className="btn-icon" onClick={() => handleEdit(role)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="btn-icon" onClick={() => handleDelete(role.id)}>
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRole ? 'Edit Role' : 'Create Role'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Role Name</label>
                  <input
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRole ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPermissionsModal && (
        <div className="modal-overlay" onClick={() => setShowPermissionsModal(false)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Permissions: {editingRole?.name}</h3>
              <button className="btn-icon" onClick={() => setShowPermissionsModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div className="mb-6">
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Tab Visibility</h4>
                <div className="permission-grid">
                  {permissions.tabs.map(perm => (
                    <div key={perm.id} className="permission-item">
                      <label>{perm.label}</label>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={rolePermissions.tabs[perm.id] ?? true}
                          onChange={(e) => setRolePermissions(prev => ({
                            ...prev,
                            tabs: { ...prev.tabs, [perm.id]: e.target.checked }
                          }))}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Actions</h4>
                <div className="permission-grid">
                  {permissions.actions.map(perm => (
                    <div key={perm.id} className="permission-item">
                      <label>{perm.label}</label>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={rolePermissions.actions[perm.id] ?? true}
                          onChange={(e) => setRolePermissions(prev => ({
                            ...prev,
                            actions: { ...prev.actions, [perm.id]: e.target.checked }
                          }))}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowPermissionsModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={savePermissions}>
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
