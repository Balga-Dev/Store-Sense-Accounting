import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Package,
  Users,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  Crown
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const DashboardLayout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/overview', tab: 'TAB_DASHBOARD' },
    { icon: Receipt, label: 'Transactions', path: '/dashboard/transactions', tab: 'TAB_TRANSACTIONS' },
    { icon: BarChart3, label: 'Reports', path: '/dashboard/reports', tab: 'TAB_REPORTS' },
    { icon: Package, label: 'Items', path: '/dashboard/items', tab: 'TAB_ITEM_MANAGEMENT' },
    { icon: Users, label: 'Employees', path: '/dashboard/employees', tab: 'TAB_EMPLOYEE_MANAGEMENT' },
    { icon: Shield, label: 'Roles', path: '/dashboard/roles', tab: 'TAB_ROLE_MANAGEMENT' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings', tab: 'TAB_SETTINGS' }
  ];

  const isAdmin = user?.role?.roleType === 'SUPER_ADMIN' || user?.role === 'SUPER_ADMIN';

  if (isAdmin) {
    navItems.push({ icon: Crown, label: 'Super Admin', path: '/dashboard/admin' });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="app-container">
      <aside className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <h1>StoreSense</h1>
          </div>
          <span>{user?.businessName}</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <a
                key={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <item.icon />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {getInitials(user?.fullName || user?.username)}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.fullName || user?.username}</div>
              <div className="user-role">{user?.role?.name || user?.role}</div>
            </div>
            <button className="btn-icon" onClick={handleLogout} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="top-bar">
          <button className="btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={20} />
          </button>
          <div className="top-bar-actions">
            <span className="text-muted" style={{ fontSize: 13 }}>
              {user?.businessCode}
            </span>
          </div>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
