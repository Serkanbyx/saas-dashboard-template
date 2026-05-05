import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { SignatureFooter } from '../components/common/SignatureFooter';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';

export const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);

  return (
    <div className="min-h-screen overflow-x-clip bg-gray-50 text-gray-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Sidebar variant="admin" isMobileOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className="flex min-h-screen min-w-0 flex-col md:pl-60">
        <Topbar onMenuClick={openSidebar} />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto min-w-0 max-w-7xl">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
        <div className="min-w-0 px-4 pb-6 sm:px-6 lg:px-8">
          <SignatureFooter />
        </div>
      </div>
    </div>
  );
};
