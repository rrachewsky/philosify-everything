import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '@contexts/AdminContext';

function AdminProtectedRoute({ children }) {
  const { t } = useTranslation();
  const { isAuthenticated, loading } = useAdmin();

  if (loading) {
    return (
      <div className="status-shell">
        <div className="spinner" />
        <p>{t('common.unlockingAtelier')}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default AdminProtectedRoute;
