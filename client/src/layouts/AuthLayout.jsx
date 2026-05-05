import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-brand-50 via-white to-cyan-50 px-4 py-10 text-gray-900 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100 sm:px-6">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold text-white shadow-lg shadow-brand-600/20">
            SD
          </div>
          <p className="mt-4 text-sm font-medium uppercase tracking-[0.2em] text-brand-600 dark:text-cyan-300">
            SaaS Dashboard
          </p>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-brand-600/10 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
          <Outlet />
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-slate-400">
          By continuing, you agree to our terms.
        </p>
      </section>
    </main>
  );
};
