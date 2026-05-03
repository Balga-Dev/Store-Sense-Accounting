import { useState, useEffect } from 'react';
import { transactionsApi, itemsApi, reportsApi } from '../services/api';
import { Plus, Search, Filter, Edit2, Trash2, Download, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [formData, setFormData] = useState({
    type: 'INCOME',
    amount: '',
    categoryId: '',
    description: '',
    reference: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [txRes, catRes, itemsRes] = await Promise.all([
        transactionsApi.getAll({ limit: 100 }),
        reportsApi.getCategories({ type: 'TRANSACTION' }),
        itemsApi.getAll({ isActive: true })
      ]);
      setTransactions(txRes.data);
      setCategories(catRes.data);
      setItems(itemsRes.data);
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
        await transactionsApi.update(editingId, formData);
      } else {
        await transactionsApi.create(formData);
      }
      setShowModal(false);
      setEditingId(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleEdit = (tx) => {
    setFormData({
      type: tx.type,
      amount: tx.amount.toString(),
      categoryId: tx.categoryId || '',
      description: tx.description || '',
      reference: tx.reference || '',
      date: format(new Date(tx.date), 'yyyy-MM-dd')
    });
    setEditingId(tx.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await transactionsApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'INCOME',
      amount: '',
      categoryId: '',
      description: '',
      reference: '',
      date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const handleExport = async () => {
    try {
      const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const end = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      const response = await reportsApi.exportTransactions({ startDate: start, endDate: end });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${start}_${end}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const filtered = transactions.filter(tx => {
    const matchesSearch = !search ||
      tx.description?.toLowerCase().includes(search.toLowerCase()) ||
      tx.reference?.toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  const totals = filtered.reduce((acc, tx) => {
    if (tx.type === 'INCOME') acc.income += parseFloat(tx.amount);
    else acc.expenses += parseFloat(tx.amount);
    return acc;
  }, { income: 0, expenses: 0 });

  return (
    <div>
      <div className="flex-between mb-6">
        <h2>Transactions</h2>
        <div className="flex-gap">
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setEditingId(null); setShowModal(true); }}>
            <Plus size={16} /> New Transaction
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="label">Total Income</div>
          <div className="value text-success">{formatCurrency(totals.income)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Expenses</div>
          <div className="value text-danger">{formatCurrency(totals.expenses)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Net Balance</div>
          <div className={`value ${totals.income - totals.expenses >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatCurrency(totals.income - totals.expenses)}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-4">
          <div className="flex-gap">
            <div className="search-input">
              <Search size={16} />
              <input
                className="form-input"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 36, width: 250 }}
              />
            </div>
            <select
              className="form-select"
              style={{ width: 140 }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Reference</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? filtered.map((tx) => (
                  <tr key={tx.id}>
                    <td>{format(new Date(tx.date), 'MMM d, yyyy')}</td>
                    <td>
                      <span className={`badge ${tx.type === 'INCOME' ? 'badge-success' : 'badge-danger'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(tx.amount)}</td>
                    <td>{tx.category?.name || '-'}</td>
                    <td>{tx.description || '-'}</td>
                    <td>{tx.reference || '-'}</td>
                    <td>
                      <div className="flex-gap">
                        <button className="btn-icon" onClick={() => handleEdit(tx)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-icon" onClick={() => handleDelete(tx.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        <h3>No transactions found</h3>
                        <p>Create your first transaction to get started</p>
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
              <h3>{editingId ? 'Edit Transaction' : 'New Transaction'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    <option value="">No category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    className="form-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reference</label>
                  <input
                    className="form-input"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
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

export default Transactions;
