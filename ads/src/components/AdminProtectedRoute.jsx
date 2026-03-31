import { Navigate } from 'react-router-dom';
import { useAdmin } from '@contexts/AdminContext';

function AdminProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAdmin();

  if (loading) {
    return (
      <div className="status-shell">
        <div className="spinner" />
        <p>Unlocking the atelier...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default AdminProtectedRoute;
