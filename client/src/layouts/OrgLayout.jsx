import { Suspense, useCallback, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { Spinner } from '../components/common/Spinner';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import { useAuth } from '../hooks/useAuth';
import { useHotkey } from '../hooks/useHotkey';
import { useOrg } from '../hooks/useOrg';
import { lazyWithChunkRetry } from '../utils/lazyWithChunkRetry';

const CommandPalette = lazyWithChunkRetry(() => import('../components/layout/CommandPalette').then((module) => ({ default: module.CommandPalette })));

export const OrgLayout = () => {
  const { user } = useAuth() || {};
  const { currentMembership, isSwitchingOrg } = useOrg() || {};
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCommandPaletteLoaded, setIsCommandPaletteLoaded] = useState(false);
  const [commandPaletteOpenRequestId, setCommandPaletteOpenRequestId] = useState(0);
  const [isOnboardingDismissed, setIsOnboardingDismissed] = useState(false);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const openCommandPalette = useCallback(() => {
    setIsCommandPaletteLoaded(true);
    setCommandPaletteOpenRequestId((currentRequestId) => currentRequestId + 1);
  }, []);
  const showOnboarding =
    user && !user.hasCompletedOnboarding && currentMembership?.role === 'owner' && !isOnboardingDismissed;

  useHotkey('mod+k', openCommandPalette);

  useEffect(() => {
    window.addEventListener('command-palette:open', openCommandPalette);

    return () => window.removeEventListener('command-palette:open', openCommandPalette);
  }, [openCommandPalette]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Sidebar variant="org" isMobileOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className="min-w-0 lg:pl-60">
        <Topbar onMenuClick={openSidebar} />
        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto min-w-0 max-w-7xl">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
      {isSwitchingOrg ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-6 backdrop-blur-sm" aria-live="polite" aria-busy="true">
          <div className="rounded-3xl border border-white/20 bg-white px-6 py-5 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <Spinner className="mx-auto" size="lg" />
            <p className="mt-3 text-sm font-medium text-gray-700 dark:text-slate-200">Switching organization...</p>
          </div>
        </div>
      ) : null}
      {isCommandPaletteLoaded ? (
        <Suspense fallback={null}>
          <CommandPalette openRequestId={commandPaletteOpenRequestId} />
        </Suspense>
      ) : null}
      {showOnboarding ? <OnboardingWizard onCompleted={() => setIsOnboardingDismissed(true)} /> : null}
    </div>
  );
};
