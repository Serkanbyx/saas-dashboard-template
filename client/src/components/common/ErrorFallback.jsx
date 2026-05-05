export const ErrorFallback = ({ errorId, onReset }) => {
  const handleReloadPage = () => {
    window.location.reload();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10 text-gray-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <section
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xl transition-colors dark:border-slate-800 dark:bg-slate-900/80"
        role="alert"
        aria-labelledby="error-fallback-title"
      >
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-600 dark:text-cyan-300">
          SaaS Dashboard
        </p>
        <h1 id="error-fallback-title" className="mt-3 text-3xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-4 text-gray-600 dark:text-slate-300">
          Please try again. If the problem persists, contact support.
        </p>

        {errorId ? (
          <p className="mt-5 text-xs text-gray-500 dark:text-slate-400">
            Reference ID: <span className="font-mono">{errorId}</span>
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={handleReloadPage}
            className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
          >
            Reload page
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-900"
          >
            Try again
          </button>
        </div>
      </section>
    </main>
  );
};
