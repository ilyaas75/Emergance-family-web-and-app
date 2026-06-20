import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/auth.jsx';

export default function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'admin' ? children : <Navigate to="/" replace />;
}
