import { useState, useEffect } from 'react';
import { reportsApi } from '../services/api';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const Reports = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [trends, setTrends] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, breakdownRes, trendsRes, logsRes, topItemsRes] = await Promise.all([
        reportsApi.getFinancialSummary({ startDate: dateRange.start, endDate: dateRange.end }),
        reportsApi.getCategoryBreakdown({ startDate: dateRange.start, endDate: dateRange.end }),
        reportsApi.getTrends({ startDate: dateRange.start, endDate: dateRange.end, granularity: 'daily' }),
        reportsApi.getDailyLogs({ startDate: dateRange.start, endDate: dateRange.end }),
        reportsApi.getTopItems({ startDate: dateRange.start, endDate: dateRange.end, limit: 10 })
      ]);
      setSummary(summaryRes.data);
      setBreakdown(breakdownRes.data);
      setTrends(trendsRes.data);
      setDailyLogs(logsRes.data);
      setTopItems(topItemsRes.data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const handleExport = async () => {
    try {
      const response = await reportsApi.exportTransactions({ startDate: dateRange.start, endDate: dateRange.end });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${dateRange.start}_${dateRange.end}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const tabs = [
    { id: 'summary', label: 'Financial Summary' },
    { id: 'trends', label: 'Trends' },
    { id: 'categories', label: 'Categories' },
    { id: 'daily', label: 'Daily Logs' },
    { id: 'top-items', label: 'Top Items' }
  ];

  if (loading) return <div className="card"><p>Loading reports...</p></div>;

  return (
    <div>
      <div className="flex-between mb-6">
        <h2>Reports</h2>
        <div className="flex-gap">
          <div className="flex-gap">
            <input
              type="date"
              className="form-input"
              style={{ width: 160 }}
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
            <span className="text-muted">to</span>
            <input
              type="date"
              className="form-input"
              style={{ width: 160 }}
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

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

      {activeTab === 'summary' && summary && (
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="label">Total Income</div>
              <div className="value text-success">{formatCurrency(summary.totalIncome)}</div>
            </div>
            <div className="stat-card">
              <div className="label">Total Expenses</div>
              <div className="value text-danger">{formatCurrency(summary.totalExpenses)}</div>
            </div>
            <div className="stat-card">
              <div className="label">Net Balance</div>
              <div className={`value ${summary.netBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(summary.netBalance)}
              </div>
            </div>
            <div className="stat-card">
              <div className="label">Transactions</div>
              <div className="value">{summary.transactionCount}</div>
            </div>
          </div>

          <div className="card mt-6">
            <h3 className="card-title mb-4">Period Overview</h3>
            <div className="grid-3">
              <div>
                <p className="text-muted" style={{ fontSize: 13 }}>Average Daily Income</p>
                <p style={{ fontSize: 20, fontWeight: 600 }}>{formatCurrency(summary.averageDailyIncome)}</p>
              </div>
              <div>
                <p className="text-muted" style={{ fontSize: 13 }}>Average Daily Expenses</p>
                <p style={{ fontSize: 20, fontWeight: 600 }}>{formatCurrency(summary.averageDailyExpenses)}</p>
              </div>
              <div>
                <p className="text-muted" style={{ fontSize: 13 }}>Profit Margin</p>
                <p style={{ fontSize: 20, fontWeight: 600 }}>
                  {summary.totalIncome > 0 ? ((summary.netBalance / summary.totalIncome) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="card">
          <h3 className="card-title mb-4">Income vs Expenses Trend</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => format(new Date(d), 'MMM d')}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
                />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#16a34a" name="Income" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expenses" stroke="#dc2626" name="Expenses" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="net" stroke="#2563eb" name="Net" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="grid-2">
          <div className="card">
            <h3 className="card-title mb-4">Category Breakdown</h3>
            {breakdown.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdown.map(b => ({ name: b.name, value: b.income + b.expenses }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {breakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state"><p>No category data available</p></div>
            )}
          </div>

          <div className="card">
            <h3 className="card-title mb-4">Category Details</h3>
            {breakdown.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Income</th>
                    <th>Expenses</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((cat, i) => (
                    <tr key={cat.name}>
                      <td>
                        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: COLORS[i % COLORS.length], marginRight: 8 }} />
                        {cat.name}
                      </td>
                      <td className="text-success">{formatCurrency(cat.income)}</td>
                      <td className="text-danger">{formatCurrency(cat.expenses)}</td>
                      <td style={{ fontWeight: 600, color: cat.net >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {formatCurrency(cat.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state"><p>No category data available</p></div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'daily' && (
        <div className="card">
          <h3 className="card-title mb-4">Daily Logs</h3>
          {dailyLogs.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Income</th>
                  <th>Expenses</th>
                  <th>Net Balance</th>
                  <th>Transactions</th>
                </tr>
              </thead>
              <tbody>
                {dailyLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{format(new Date(log.date), 'MMM d, yyyy')}</td>
                    <td className="text-success">{formatCurrency(log.totalIncome)}</td>
                    <td className="text-danger">{formatCurrency(log.totalExpenses)}</td>
                    <td style={{ fontWeight: 600, color: log.netBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {formatCurrency(log.netBalance)}
                    </td>
                    <td>{log.transactionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state"><p>No daily logs available</p></div>
          )}
        </div>
      )}

      {activeTab === 'top-items' && (
        <div className="card">
          <h3 className="card-title mb-4">Top Performing Items</h3>
          {topItems.length > 0 ? (
            <div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topItems}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="totalRevenue" fill="#2563eb" name="Revenue" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <table className="mt-4">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Code</th>
                    <th>Quantity Sold</th>
                    <th>Revenue</th>
                    <th>Transactions</th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.map((item) => (
                    <tr key={item.itemId}>
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      <td>{item.itemCode}</td>
                      <td>{item.totalQuantity}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(item.totalRevenue)}</td>
                      <td>{item.transactions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state"><p>No item data available</p></div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
