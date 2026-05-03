import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Items from './pages/Items';
import Employees from './pages/Employees';
import Roles from './pages/Roles';
import Settings from './pages/Settings';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard/overview" />} />
        <Route path="overview" element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="reports" element={<Reports />} />
        <Route path="items" element={<Items />} />
        <Route path="employees" element={<Employees />} />
        <Route path="roles" element={<Roles />} />
        <Route path="settings" element={<Settings />} />
        {user?.role?.roleType === 'SUPER_ADMIN' || user?.role === 'SUPER_ADMIN' ? (
          <Route path="admin" element={<SuperAdminDashboard />} />
        ) : null}
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
