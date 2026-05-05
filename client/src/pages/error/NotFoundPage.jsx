import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const PageHeader = ({ eyebrow, title, description }) => (
  <div>
    <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">{eyebrow}</p>
    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">{title}</h2>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-slate-300">{description}</p>
  </div>
);

export const NotFoundPage = () => {
  const { user } = useAuth() || {};
  const location = useLocation();
  const nextPath = `${location.pathname}${location.search}${location.hash}`;
  const actionPath = user ? '/app/dashboard' : `/login?next=${encodeURIComponent(nextPath)}`;
  const actionLabel = user ? 'Go to Dashboard' : 'Login';

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10 text-gray-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <section className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-4xl bg-brand-50 text-5xl font-black text-brand-600 dark:bg-cyan-950/40 dark:text-cyan-200">
          404
        </div>
        <PageHeader
          eyebrow="Not found"
          title="We can't find what you're looking for."
          description="The page may have moved, been deleted, or you may need to sign in before opening it."
        />
        <Link
          to={actionPath}
          className="mt-6 inline-flex rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
        >
          {actionLabel}
        </Link>
      </section>
    </main>
  );
};

export default NotFoundPage;
