import { useState, useEffect } from 'react';
import { reportsApi } from '../services/api';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { format, subDays, startOfMonth } from 'date-fns';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashboardRes, trendsRes] = await Promise.all([
        reportsApi.getDashboard(),
        reportsApi.getTrends({
          startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
          endDate: format(new Date(), 'yyyy-MM-dd'),
          granularity: 'daily'
        })
      ]);
      setData(dashboardRes.data);
      setTrends(trendsRes.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
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

  if (loading) {
    return <div className="card"><p>Loading...</p></div>;
  }

  if (!data) {
    return <div className="card"><p>Failed to load dashboard data</p></div>;
  }

  return (
    <div>
      <div className="flex-between mb-6">
        <h2>Dashboard</h2>
        <span className="text-muted" style={{ fontSize: 13 }}>
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Today's Income</div>
          <div className="value text-success">{formatCurrency(data.today?.totalIncome)}</div>
          <div className="change positive">
            {data.today?.transactionCount || 0} transactions
          </div>
        </div>

        <div className="stat-card">
          <div className="label">Today's Expenses</div>
          <div className="value text-danger">{formatCurrency(data.today?.totalExpenses)}</div>
          <div className="change">
            {formatCurrency(data.today?.totalIncome - data.today?.totalExpenses)} net
          </div>
        </div>

        <div className="stat-card">
          <div className="label">This Week</div>
          <div className="value">{formatCurrency(data.week?.netBalance)}</div>
          <div className={`change ${data.week?.netBalance >= 0 ? 'positive' : 'negative'}`}>
            {data.week?.netBalance >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {data.week?.transactionCount || 0} transactions
          </div>
        </div>

        <div className="stat-card">
          <div className="label">This Month</div>
          <div className="value">{formatCurrency(data.month?.netBalance)}</div>
          <div className={`change ${data.month?.netBalance >= 0 ? 'positive' : 'negative'}`}>
            {data.month?.transactionCount || 0} transactions
          </div>
        </div>
      </div>

      <div className="grid-2 mb-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Revenue Trend (30 Days)</h3>
          </div>
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
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Daily Balance</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
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
                <Bar dataKey="net" fill="#2563eb" name="Net Balance" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Transactions</h3>
          </div>
          {data.recentTransactions?.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map((t) => (
                  <tr key={t.id}>
                    <td>{format(new Date(t.date), 'MMM d')}</td>
                    <td>
                      <span className={`badge ${t.type === 'INCOME' ? 'badge-success' : 'badge-danger'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(t.amount)}</td>
                    <td>{t.category?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <p>No transactions yet</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Stats</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
              <Package size={20} color="#2563eb" />
              <div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Active Items</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{data.itemStats || 0}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
              <Users size={20} color="#16a34a" />
              <div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Active Employees</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{data.userCount || 0}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
              <DollarSign size={20} color="#d97706" />
              <div>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  Avg Daily Income
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {formatCurrency(data.month?.averageDailyIncome)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
