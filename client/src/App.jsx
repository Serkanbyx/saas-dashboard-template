import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { OrgProvider } from './context/OrgContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { AdminLayout, AuthLayout, OrgLayout } from './layouts';
import {
  AcceptInvitePage,
  AccountSettingsPage,
  ActivityPage,
  AllOrgsPage,
  AllUsersPage,
  BillingPage,
  CreateOrgPage,
  DashboardPage,
  LoginPage,
  MembersPage,
  NotFoundPage,
  OrgSettingsPage,
  RegisterPage,
  SuperAdminDashboardPage,
} from './pages';
import { GuestOnlyRoute, OrgRoleRoute, ProtectedRoute, SuperAdminRoute } from './routes';

const AppRoutes = () => (
  <Routes>
    <Route element={<GuestOnlyRoute />}>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
    </Route>

    <Route path="/invite/accept" element={<AuthLayout />}>
      <Route index element={<AcceptInvitePage />} />
    </Route>
    <Route path="/invitations/accept" element={<AuthLayout />}>
      <Route index element={<AcceptInvitePage />} />
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route element={<AuthLayout />}>
        <Route path="/create-org" element={<CreateOrgPage />} />
      </Route>
    </Route>

    <Route path="/app" element={<ProtectedRoute requireOrg />}>
      <Route element={<OrgLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route
          path="members"
          element={
            <OrgRoleRoute roles={['owner', 'admin', 'member']}>
              <MembersPage />
            </OrgRoleRoute>
          }
        />
        <Route path="activity" element={<ActivityPage />} />
        <Route
          path="billing"
          element={
            <OrgRoleRoute roles={['owner']}>
              <BillingPage />
            </OrgRoleRoute>
          }
        />
        <Route path="settings" element={<OrgSettingsPage />} />
        <Route path="account" element={<AccountSettingsPage />} />
      </Route>
    </Route>

    <Route path="/super-admin" element={<SuperAdminRoute />}>
      <Route element={<AdminLayout />}>
        <Route index element={<SuperAdminDashboardPage />} />
        <Route path="orgs" element={<AllOrgsPage />} />
        <Route path="users" element={<AllUsersPage />} />
      </Route>
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <OrgProvider>
            <SocketProvider>
              <NotificationProvider>
                <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
                <ErrorBoundary>
                  <AppRoutes />
                </ErrorBoundary>
              </NotificationProvider>
            </SocketProvider>
          </OrgProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
