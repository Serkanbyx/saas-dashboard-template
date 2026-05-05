import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { OrgProvider } from './context/OrgContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { AdminLayout, AuthLayout, OrgLayout } from './layouts';
import { GuestOnlyRoute, OrgRoleRoute, ProtectedRoute, RouteLoader, SuperAdminRoute } from './routes';

const lazyNamedPage = (loader, exportName) =>
  lazy(() => loader().then((module) => ({ default: module[exportName] })));

const AcceptInvitePage = lazyNamedPage(() => import('./pages/invite/AcceptInvitePage.jsx'), 'AcceptInvitePage');
const AccountSettingsPage = lazyNamedPage(() => import('./pages/settings/AccountSettingsPage.jsx'), 'AccountSettingsPage');
const ActivityPage = lazyNamedPage(() => import('./pages/activity/ActivityPage.jsx'), 'ActivityPage');
const AllOrgsPage = lazyNamedPage(() => import('./pages/super-admin/SuperAdminPages.jsx'), 'AllOrgsPage');
const AllUsersPage = lazyNamedPage(() => import('./pages/super-admin/SuperAdminPages.jsx'), 'AllUsersPage');
const BillingPage = lazyNamedPage(() => import('./pages/billing/BillingPage.jsx'), 'BillingPage');
const CreateOrgPage = lazyNamedPage(() => import('./pages/AuthPages.jsx'), 'CreateOrgPage');
const DashboardPage = lazyNamedPage(() => import('./pages/dashboard/DashboardPage.jsx'), 'DashboardPage');
const LoginPage = lazyNamedPage(() => import('./pages/AuthPages.jsx'), 'LoginPage');
const MembersPage = lazyNamedPage(() => import('./pages/members/MembersPage.jsx'), 'MembersPage');
const NotFoundPage = lazyNamedPage(() => import('./pages/error/NotFoundPage.jsx'), 'NotFoundPage');
const OrgSettingsPage = lazyNamedPage(() => import('./pages/settings/OrgSettingsPage.jsx'), 'OrgSettingsPage');
const RegisterPage = lazyNamedPage(() => import('./pages/AuthPages.jsx'), 'RegisterPage');
const SuperAdminDashboardPage = lazyNamedPage(
  () => import('./pages/super-admin/SuperAdminPages.jsx'),
  'SuperAdminDashboardPage',
);

const AppRoutes = () => (
  <Suspense fallback={<RouteLoader label="Loading page" />}>
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
  </Suspense>
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
