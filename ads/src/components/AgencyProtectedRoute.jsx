import { Navigate } from 'react-router-dom';
import { useAgency } from '@contexts/AgencyContext';

export default function AgencyProtectedRoute({ children }) {
  const { agency, loading } = useAgency();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!agency) {
    return <Navigate to="/agency/login" replace />;
  }

  return children;
}
