import { useState, useEffect } from 'react';
import { businessesApi, usersApi } from '../services/api';
import { Plus, Search, Building2, Edit2, Trash2, X, Users, Eye, EyeOff } from 'lucide-react';

const SuperAdminDashboard = () => {
  const [businesses, setBusinesses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '', type: '', description: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bizRes, statsRes] = await Promise.all([
        businessesApi.getAll(),
        businessesApi.getStats()
      ]);
      setBusinesses(bizRes.data);
      setStats(statsRes.data);
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
        await businessesApi.update(editingId, formData);
      } else {
        await businessesApi.create(formData);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', type: '', description: '' });
      loadData();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleEdit = (biz) => {
    setFormData({ name: biz.name, type: biz.type, description: biz.description || '' });
    setEditingId(biz.id);
    setShowModal(true);
  };

  const handleToggleStatus = async (id) => {
    try {
      await businessesApi.toggleStatus(id);
      loadData();
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this business? This cannot be undone.')) return;
    try {
      await businessesApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const filtered = businesses.filter(biz => {
    if (!search) return true;
    return biz.name.toLowerCase().includes(search.toLowerCase()) ||
      biz.businessCode.toLowerCase().includes(search.toLowerCase()) ||
      biz.type.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <div className="card"><p>Loading...</p></div>;

  return (
    <div>
      <div className="flex-between mb-6">
        <h2>Super Admin Dashboard</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { setFormData({ name: '', type: '', description: '' }); setEditingId(null); setShowModal(true); }}>
          <Plus size={16} /> Create Business
        </button>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="label">Total Businesses</div>
            <div className="value">{stats.totalBusinesses}</div>
          </div>
          <div className="stat-card">
            <div className="label">Active Businesses</div>
            <div className="value text-success">{stats.activeBusinesses}</div>
          </div>
          <div className="stat-card">
            <div className="label">Total Users</div>
            <div className="value">{stats.totalUsers}</div>
          </div>
          <div className="stat-card">
            <div className="label">Total Transactions</div>
            <div className="value">{stats.totalTransactions}</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="mb-4">
          <div className="search-input">
            <Search size={16} />
            <input
              className="form-input"
              placeholder="Search businesses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36, width: 300 }}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Business Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Users</th>
                <th>Items</th>
                <th>Transactions</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((biz) => (
                <tr key={biz.id}>
                  <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>{biz.businessCode}</code></td>
                  <td style={{ fontWeight: 500 }}>{biz.name}</td>
                  <td>{biz.type}</td>
                  <td>{biz._count?.users || 0}</td>
                  <td>{biz._count?.items || 0}</td>
                  <td>{biz._count?.transactions || 0}</td>
                  <td>
                    <span className={`badge ${biz.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {biz.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex-gap">
                      <button className="btn-icon" onClick={() => handleEdit(biz)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-icon" onClick={() => handleToggleStatus(biz.id)}>
                        {biz.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button className="btn-icon" onClick={() => handleDelete(biz.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state">
                      <Building2 size={32} />
                      <h3>No businesses found</h3>
                      <p>Create your first business to get started</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Business' : 'Create Business'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Business Name</label>
                  <input
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="">Select type</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="cafe">Cafe</option>
                    <option value="market">Market</option>
                    <option value="retail">Retail Store</option>
                    <option value="other">Other</option>
                  </select>
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
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
