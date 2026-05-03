import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Package, Plus, Edit2, Trash2, Search, X, LogOut, LayoutDashboard, Tag } from 'lucide-react';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({ businessCode: '', username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>StoreSense</h1>
        <p className="subtitle">Item Management Portal</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Business Code</label>
            <input className="form-input" placeholder="SS-ABC12345" value={formData.businessCode} onChange={(e) => setFormData({ ...formData, businessCode: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" placeholder="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Sign In</button>
        </form>
      </div>
    </div>
  );
};

const ItemManager = ({ user, onLogout }) => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ itemCode: '', name: '', price: '', cost: '', category: '', description: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [itemsRes, catsRes] = await Promise.all([
        api.get('/items'),
        api.get('/items/categories')
      ]);
      setItems(itemsRes.data);
      setCategories(catsRes.data);
    } catch (error) {
      console.error('Failed to load:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/items/${editingId}`, formData);
      } else {
        await api.post('/items', formData);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ itemCode: '', name: '', price: '', cost: '', category: '', description: '' });
      loadData();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      itemCode: item.itemCode,
      name: item.name,
      price: item.price.toString(),
      cost: item.cost?.toString() || '',
      category: item.category || '',
      description: item.description || ''
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api.delete(`/items/${id}`);
      loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const formatCurrency = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v || 0);

  const filtered = items.filter(item =>
    !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.itemCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h1>StoreSense</h1>
        <p className="business-name">{user?.businessName}</p>
        <div className="nav-item active"><Package size={18} /> Items</div>
        <div className="nav-item" style={{ marginTop: 'auto' }} onClick={onLogout}><LogOut size={18} /> Sign Out</div>
      </aside>

      <main className="main-content">
        <div className="flex-between" style={{ marginBottom: 24 }}>
          <h2>Item Management</h2>
          <button className="btn btn-primary btn-sm" onClick={() => { setFormData({ itemCode: '', name: '', price: '', cost: '', category: '', description: '' }); setEditingId(null); setShowModal(true); }}>
            <Plus size={16} /> Add Item
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="value">{items.length}</div>
            <div className="label">Total Items</div>
          </div>
          <div className="stat-card">
            <div className="value">{items.filter(i => i.isActive).length}</div>
            <div className="label">Active Items</div>
          </div>
          <div className="stat-card">
            <div className="value">{categories.length || new Set(items.map(i => i.category).filter(Boolean)).size}</div>
            <div className="label">Categories</div>
          </div>
        </div>

        <div className="card">
          <div className="mb-4">
            <div className="search-input">
              <Search size={16} />
              <input className="form-input" placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36, width: 300 }} />
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>{item.itemCode}</code></td>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td>{item.category || '-'}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(item.price)}</td>
                  <td>{item.cost ? formatCurrency(item.cost) : '-'}</td>
                  <td>
                    <div className="flex-gap">
                      <button className="btn-icon" onClick={() => handleEdit(item)}><Edit2 size={16} /></button>
                      <button className="btn-icon" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="6"><div className="empty-state"><p>No items found</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingId ? 'Edit Item' : 'Add Item'}</h3>
                <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Item Code</label>
                    <input className="form-input" value={formData.itemCode} onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })} placeholder="Auto-generated if empty" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="flex-gap">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Price</label>
                      <input type="number" step="0.01" className="form-input" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Cost</label>
                      <input type="number" step="0.01" className="form-input" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input className="form-input" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g., Food, Beverage" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input className="form-input" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/items" /> : <Login onLogin={handleLogin} />} />
      <Route path="/items" element={user ? <ItemManager user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
