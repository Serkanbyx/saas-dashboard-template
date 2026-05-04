import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { OrgProvider } from './context/OrgContext';
import { SocketProvider } from './context/SocketContext';

const AppShell = () => (
  <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
    <section className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">SaaS Dashboard</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Project scaffold is ready.</h1>
      <p className="mt-4 max-w-2xl text-slate-300">
        The application shell will be implemented step by step from the project guide.
      </p>
    </section>
  </main>
);

const App = () => {
  return (
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
  );
};

export default App;
