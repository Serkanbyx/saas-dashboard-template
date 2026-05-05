import { Sparkles } from 'lucide-react';

export const EmptyState = ({ action, icon: Icon = Sparkles, message, title = 'Nothing here yet' }) => (
  <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-600 dark:bg-cyan-950/40 dark:text-cyan-300">
      <Icon className="h-8 w-8" aria-hidden="true" />
    </div>
    <h2 className="mt-5 text-lg font-semibold text-gray-950 dark:text-slate-50">{title}</h2>
    {message ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-slate-400">{message}</p> : null}
    {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
  </div>
);
