import { Toaster } from 'react-hot-toast';
import { ThemeToggle } from './components/common/ThemeToggle';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { OrgProvider } from './context/OrgContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';

const AppShell = () => (
  <main className="min-h-screen bg-gray-50 px-6 py-10 text-gray-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
    <section className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-8 shadow-xl transition-colors dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-600 dark:text-cyan-300">SaaS Dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Project scaffold is ready.</h1>
        </div>
        <ThemeToggle />
      </div>
      <p className="mt-4 max-w-2xl text-gray-600 dark:text-slate-300">
        The application shell will be implemented step by step from the project guide.
      </p>
    </section>
  </main>
);

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OrgProvider>
          <SocketProvider>
            <NotificationProvider>
              <Toaster position="top-right" />
              <AppShell />
            </NotificationProvider>
          </SocketProvider>
        </OrgProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
