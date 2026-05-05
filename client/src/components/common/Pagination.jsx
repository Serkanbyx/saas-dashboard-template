import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export const Pagination = ({ onChange, page = 1, totalPages = 1 }) => {
  const safeTotalPages = Math.max(totalPages, 1);
  const safePage = Math.min(Math.max(page, 1), safeTotalPages);

  return (
    <nav className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Pagination">
      <p className="text-sm text-gray-500 dark:text-slate-400">
        Page <span className="font-semibold text-gray-900 dark:text-slate-100">{safePage}</span> of{' '}
        <span className="font-semibold text-gray-900 dark:text-slate-100">{safeTotalPages}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={safePage <= 1} onClick={() => onChange?.(safePage - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={safePage >= safeTotalPages} onClick={() => onChange?.(safePage + 1)}>
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
};
