import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Auth
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Layouts
import SharedLayout from './layouts/SharedLayout';

// Parent Portal
import Dashboard from './pages/Dashboard';
import NewRequest from './pages/NewRequest';
import DigitalSignature from './pages/DigitalSignature';
import RequestSuccess from './pages/RequestSuccess';
import BankDetails from './pages/BankDetails';
import UploadReceipt from './pages/UploadReceipt';
import UploadSSN from './pages/UploadSSN';
import ProcessSSN from './pages/ProcessSSN';
import VerificationSubmitted from './pages/VerificationSubmitted';
import RequestHistory from './pages/RequestHistory';
import RequestDetail from './pages/RequestDetail';

// Staff Portal
import StaffDashboard from './pages/StaffDashboard';
import Requests from './pages/Requests';
import StaffRequestDetail from './pages/StaffRequestDetail';
import StaffVerification from './pages/StaffVerification';
import StaffPayments from './pages/StaffPayments';

// Admin Portal
import AdminLayout from './layouts/AdminLayout';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import UserManagement from './pages/UserManagement';
import UserDetail from './pages/UserDetail';
import InviteUser from './pages/InviteUser';
import ConfirmInvite from './pages/ConfirmInvite';
import PermissionsSuccess from './pages/PermissionsSuccess';

// Shared
import Profile from './pages/Profile';
import ComingSoon from './pages/ComingSoon';
import ScrollToTop from './components/ScrollToTop';

import './index.css';

function ParentRouteWrapper() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!loading) {
      const type = user?.type || user?.user_type;
      if (!user) {
        navigate('/login');
      } else if (type !== 'parent' && type !== 'past_student') {
        navigate('/staff');
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '48px' }}>sync</span>
      </div>
    );
  }

  const type = user?.type || user?.user_type;
  if (!user || (type !== 'parent' && type !== 'past_student')) return null;

  return (
    <div key={location.pathname} className="animate-page flex flex-col min-h-screen">
      <Outlet />
    </div>
  );
}

function StaffRouteWrapper() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!loading) {
      const type = user?.type || user?.user_type;
      if (!user) {
        navigate('/login');
      } else if (type !== 'staff') {
        navigate('/dashboard/parents');
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '48px' }}>sync</span>
      </div>
    );
  }

  const type = user?.type || user?.user_type;
  if (!user || type !== 'staff') return null;

  return (
    <div key={location.pathname} className="animate-page flex flex-col min-h-screen">
      <Outlet />
    </div>
  );
}

function PublicRouteWrapper() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-page flex flex-col min-h-screen">
      <Outlet />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* ── Public Auth ─────────────────────────── */}
              <Route element={<PublicRouteWrapper />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/help" element={<ComingSoon />} />
              </Route>

              {/* ── Parent Portal ────────────────────────── */}
              {/* Pages that use TopAppBar/BottomNav themselves (no DashboardLayout wrapper needed) */}
              <Route element={<ParentRouteWrapper />}>
                <Route path="/dashboard/parents" element={<Dashboard />} />
                <Route path="/dashboard/parents/history" element={<RequestHistory />} />
                <Route path="/dashboard/parents/request/:id" element={<RequestDetail />} />
                <Route path="/dashboard/parents/new" element={<NewRequest />} />
                <Route path="/dashboard/parents/sign" element={<DigitalSignature />} />
                <Route path="/dashboard/parents/success" element={<RequestSuccess />} />
                <Route path="/dashboard/parents/bank-details" element={<BankDetails />} />
                <Route path="/dashboard/parents/upload-receipt" element={<UploadReceipt />} />
                <Route path="/dashboard/parents/upload-ssn" element={<UploadSSN />} />
                <Route path="/dashboard/parents/verify-ssn" element={<ProcessSSN />} />
                <Route path="/dashboard/parents/verification-submitted" element={<VerificationSubmitted />} />
              </Route>

              {/* ── Staff Portal ─────────────────────────── */}
              <Route element={<StaffRouteWrapper />}>
                <Route path="/staff" element={<StaffDashboard />} />
                <Route path="/staff/requests" element={<Requests />} />
                <Route path="/staff/requests/:id" element={<StaffRequestDetail />} />
                <Route path="/staff/verification" element={<StaffVerification />} />
                <Route path="/staff/payments" element={<StaffPayments />} />
                <Route path="/staff/history" element={<ComingSoon />} />
              </Route>

              {/* ── Admin Portal ─────────────────────────── */}
              <Route element={<AdminLayout />}>
                <Route path="/superadmin" element={<SuperAdminDashboard />} />
                <Route path="/superadmin/users" element={<UserManagement />} />
                <Route path="/superadmin/users/invite" element={<InviteUser />} />
                <Route path="/superadmin/users/invite/confirm" element={<ConfirmInvite />} />
                <Route path="/superadmin/users/success" element={<PermissionsSuccess />} />
                <Route path="/superadmin/users/:id" element={<UserDetail />} />
                <Route path="/superadmin/settings" element={<Profile embedded />} />
                <Route path="/staff/settings" element={<Profile embedded />} />
              </Route>

              {/* ── Shared ──────────────────────────────── */}
              <Route element={<SharedLayout />}>
                <Route path="/profile" element={<Profile />} />
              </Route>

              {/* 404 fallback */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

