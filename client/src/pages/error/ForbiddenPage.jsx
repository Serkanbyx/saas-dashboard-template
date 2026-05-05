import { Link } from 'react-router-dom';

const PageHeader = ({ eyebrow, title, description }) => (
  <div>
    <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">{eyebrow}</p>
    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">{title}</h2>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-slate-300">{description}</p>
  </div>
);

export const ForbiddenPage = () => (
  <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
    <PageHeader
      eyebrow="403"
      title="You don't have permission"
      description="Your current organization role does not include permission to view this page."
    />
    <Link
      to="/app/dashboard"
      className="mt-6 inline-flex rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-amber-50 dark:focus:ring-offset-slate-950"
    >
      Back to dashboard
    </Link>
  </section>
);

export default ForbiddenPage;
