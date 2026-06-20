import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/auth.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Circles from './pages/Circles.jsx';
import CircleDetail from './pages/CircleDetail.jsx';
import Alerts from './pages/Alerts.jsx';
import Profile from './pages/Profile.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  const { loading } = useAuth();
  if (loading) return <div className="auth-wrap"><div className="spin" /></div>;
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/circles" element={<Circles />} />
        <Route path="/circles/:id" element={<CircleDetail />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
