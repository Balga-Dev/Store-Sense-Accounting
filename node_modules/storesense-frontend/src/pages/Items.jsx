import { useState, useEffect } from 'react';
import { itemsApi } from '../services/api';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';

const Items = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    itemCode: '',
    name: '',
    price: '',
    cost: '',
    category: '',
    description: ''
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const res = await itemsApi.getAll();
      setItems(res.data);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await itemsApi.update(editingId, formData);
      } else {
        await itemsApi.create(formData);
      }
      setShowModal(false);
      setEditingId(null);
      resetForm();
      loadItems();
    } catch (error) {
      console.error('Failed to save item:', error);
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
      await itemsApi.delete(id);
      loadItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      itemCode: '',
      name: '',
      price: '',
      cost: '',
      category: '',
      description: ''
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const filtered = items.filter(item => {
    if (!search) return true;
    return item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(search.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="flex-between mb-6">
        <h2>Items</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setEditingId(null); setShowModal(true); }}>
          <Plus size={16} /> Add Item
        </button>
      </div>

      <div className="card">
        <div className="mb-4">
          <div className="search-input">
            <Search size={16} />
            <input
              className="form-input"
              placeholder="Search items..."
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
                  <th>Code</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? filtered.map((item) => (
                  <tr key={item.id}>
                    <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>{item.itemCode}</code></td>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td>{item.category || '-'}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(item.price)}</td>
                    <td>{item.cost ? formatCurrency(item.cost) : '-'}</td>
                    <td>
                      <span className={`badge ${item.isActive ? 'badge-success' : 'badge-secondary'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex-gap">
                        <button className="btn-icon" onClick={() => handleEdit(item)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-icon" onClick={() => handleDelete(item.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        <h3>No items found</h3>
                        <p>Add your first item to get started</p>
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
              <h3>{editingId ? 'Edit Item' : 'Add Item'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Item Code</label>
                  <input
                    className="form-input"
                    value={formData.itemCode}
                    onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cost (optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Food, Beverage, Supplies"
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

export default Items;
