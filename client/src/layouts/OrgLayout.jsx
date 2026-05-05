import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';

export const OrgLayout = () => {
  const { user } = useAuth() || {};
  const { currentMembership } = useOrg() || {};
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnboardingDismissed, setIsOnboardingDismissed] = useState(false);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const showOnboarding =
    user && !user.hasCompletedOnboarding && currentMembership?.role === 'owner' && !isOnboardingDismissed;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Sidebar variant="org" isMobileOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className="lg:pl-60">
        <Topbar onMenuClick={openSidebar} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
      {showOnboarding ? <OnboardingWizard onCompleted={() => setIsOnboardingDismissed(true)} /> : null}
    </div>
  );
};
