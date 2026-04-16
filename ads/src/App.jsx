import { Navigate, Route, Routes } from 'react-router-dom';
import Header from '@components/Header';
import FloatingActionButton from '@components/FloatingActionButton';
import FeedbackButton from '@components/FeedbackButton';
import ProtectedRoute from '@components/ProtectedRoute';
import AdminProtectedRoute from '@components/AdminProtectedRoute';
import AgencyProtectedRoute from '@components/AgencyProtectedRoute';
import Landing from '@pages/Landing';
import Login from '@pages/Login';
import Signup from '@pages/Signup';
import Dashboard from '@pages/Dashboard';
import Plans from '@pages/Plans';
import CreateCampaign from '@pages/CreateCampaign';
import PlanDetail from '@pages/PlanDetail';
import Billing from '@pages/Billing';
import Placements from '@pages/Placements';
import Policy from '@pages/Policy';
import Settings from '@pages/Settings';
import Analytics from '@pages/Analytics';
import AdminLogin from '@pages/admin/AdminLogin';
import AdminDashboard from '@pages/admin/AdminDashboard';
import AgencyLogin from '@pages/agency/AgencyLogin';
import AgencySignup from '@pages/agency/AgencySignup';
import AgencyDashboard from '@pages/agency/AgencyDashboard';
import AgencyClients from '@pages/agency/AgencyClients';
import AgencyClientCampaigns from '@pages/agency/AgencyClientCampaigns';
import AgencyEarnings from '@pages/agency/AgencyEarnings';

function AdvertiserLayout({ children }) {
  return (
    <ProtectedRoute>
      <div className="app-shell">
        <Header />
        <main className="app-main">{children}</main>
        <FloatingActionButton />
        <FeedbackButton />
      </div>
    </ProtectedRoute>
  );
}

function AdminLayout({ children }) {
  return (
    <AdminProtectedRoute>
      <div className="app-shell app-shell--admin">
        <Header admin />
        <main className="app-main">{children}</main>
        <FeedbackButton />
      </div>
    </AdminProtectedRoute>
  );
}

function AgencyLayout({ children }) {
  return (
    <AgencyProtectedRoute>
      <div className="app-shell app-shell--agency">
        <Header agency />
        <main className="app-main">{children}</main>
        <FeedbackButton />
      </div>
    </AgencyProtectedRoute>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/placements" element={<Placements publicView />} />
      <Route path="/policy" element={<Policy />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/app"
        element={
          <AdvertiserLayout>
            <Dashboard />
          </AdvertiserLayout>
        }
      />
      <Route
        path="/app/campaigns"
        element={
          <AdvertiserLayout>
            <Plans />
          </AdvertiserLayout>
        }
      />
      <Route
        path="/app/new"
        element={
          <AdvertiserLayout>
            <CreateCampaign />
          </AdvertiserLayout>
        }
      />
      <Route
        path="/app/campaigns/:id"
        element={
          <AdvertiserLayout>
            <PlanDetail />
          </AdvertiserLayout>
        }
      />
      <Route
        path="/app/billing"
        element={
          <AdvertiserLayout>
            <Billing />
          </AdvertiserLayout>
        }
      />
      <Route
        path="/app/analytics"
        element={
          <AdvertiserLayout>
            <Analytics />
          </AdvertiserLayout>
        }
      />
      <Route
        path="/app/placements"
        element={
          <AdvertiserLayout>
            <Placements />
          </AdvertiserLayout>
        }
      />
      <Route
        path="/app/settings"
        element={
          <AdvertiserLayout>
            <Settings />
          </AdvertiserLayout>
        }
      />

      {/* Agency Routes */}
      <Route path="/agency/login" element={<AgencyLogin />} />
      <Route path="/agency/signup" element={<AgencySignup />} />
      <Route path="/agency" element={<AgencyLayout><AgencyDashboard /></AgencyLayout>} />
      <Route path="/agency/clients" element={<AgencyLayout><AgencyClients /></AgencyLayout>} />
      <Route path="/agency/clients/new" element={<AgencyLayout><AgencyClients /></AgencyLayout>} />
      <Route path="/agency/clients/:clientId/campaigns" element={<AgencyLayout><AgencyClientCampaigns /></AgencyLayout>} />
      <Route path="/agency/earnings" element={<AgencyLayout><AgencyEarnings /></AgencyLayout>} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        }
      />

      <Route path="/dashboard" element={<Navigate to="/app" replace />} />
      <Route path="/plans" element={<Navigate to="/app/campaigns" replace />} />
      <Route path="/plans/new" element={<Navigate to="/app/new" replace />} />
      <Route path="/plans/:id" element={<Navigate to="/app/campaigns" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
