import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { isAuthenticated } from './api';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Programs from './pages/Programs';
import Customers from './pages/Customers';
import Licenses from './pages/Licenses';
import LicenseDetail from './pages/LicenseDetail';

function ProtectedRoute() {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/licenses" element={<Licenses />} />
        <Route path="/licenses/:id" element={<LicenseDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
