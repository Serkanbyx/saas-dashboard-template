import {
  Activity,
  ArrowRight,
  Clock3,
  LayoutDashboard,
  Loader2,
  Mail,
  Search,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { useHotkey } from '../../hooks/useHotkey';
import * as searchService from '../../services/searchService';

const recentSearchesKey = 'saas:recentSearches';
const emptyResults = {
  activities: [],
  invitations: [],
  members: [],
};

const quickLinks = [
  { id: 'dashboard', label: 'Go to Dashboard', description: 'Open workspace overview', to: '/app/dashboard', icon: LayoutDashboard },
  { id: 'members', label: 'Open Members', description: 'Manage members and invitations', to: '/app/members', icon: Users },
  { id: 'settings', label: 'Open Settings', description: 'Review workspace settings', to: '/app/settings', icon: Settings },
];

const getRecordId = (record) => record?._id || record?.id;

const getActor = (activityLog) => activityLog?.actor || activityLog?.actorId || {};

const formatActionLabel = (action) =>
  (action || 'activity.updated')
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).replaceAll('_', ' '))
    .join(' ');

const formatDate = (value) => {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const readRecentSearches = () => {
  try {
    const parsedValue = JSON.parse(window.localStorage.getItem(recentSearchesKey) || '[]');

    return Array.isArray(parsedValue) ? parsedValue.filter((item) => typeof item === 'string').slice(0, 5) : [];
  } catch (_error) {
    return [];
  }
};

const saveRecentSearches = (query) => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return readRecentSearches();
  }

  const nextSearches = [trimmedQuery, ...readRecentSearches().filter((item) => item.toLowerCase() !== trimmedQuery.toLowerCase())].slice(0, 5);
  window.localStorage.setItem(recentSearchesKey, JSON.stringify(nextSearches));

  return nextSearches;
};

const getFocusableElements = (container) =>
  Array.from(
    container?.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) || [],
  ).filter((element) => !element.hasAttribute('aria-hidden'));

const renderHighlightedText = (text, query) => {
  const value = String(text || '');
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return value;
  }

  const matchIndex = value.toLowerCase().indexOf(normalizedQuery);

  if (matchIndex === -1) {
    return value;
  }

  const beforeMatch = value.slice(0, matchIndex);
  const match = value.slice(matchIndex, matchIndex + normalizedQuery.length);
  const afterMatch = value.slice(matchIndex + normalizedQuery.length);

  return (
    <>
      {beforeMatch}
      <mark className="rounded bg-brand-100 px-0.5 text-brand-800 dark:bg-cyan-400/20 dark:text-cyan-100">{match}</mark>
      {afterMatch}
    </>
  );
};

const createResultGroups = (results, query) => [
  {
    id: 'members',
    label: 'Members',
    icon: Users,
    items: (results.members || []).slice(0, 5).map((membership) => {
      const user = membership.userId || membership.user || {};
      const membershipId = getRecordId(membership);

      return {
        id: `member-${membershipId}`,
        type: 'result',
        label: user.name || user.email || 'Unknown member',
        description: [user.email, membership.role].filter(Boolean).join(' · '),
        icon: Users,
        to: `/app/members?focus=${encodeURIComponent(membershipId)}`,
        query,
      };
    }),
  },
  {
    id: 'invitations',
    label: 'Invitations',
    icon: Mail,
    items: (results.invitations || []).slice(0, 5).map((invitation) => {
      const invitationId = getRecordId(invitation);

      return {
        id: `invitation-${invitationId}`,
        type: 'result',
        label: invitation.email || 'Pending invitation',
        description: [invitation.role, invitation.status || 'pending'].filter(Boolean).join(' · '),
        icon: Mail,
        to: `/app/members?tab=pending&focus=${encodeURIComponent(invitationId)}`,
        query,
      };
    }),
  },
  {
    id: 'activities',
    label: 'Activity',
    icon: Activity,
    items: (results.activities || []).slice(0, 5).map((activityLog) => {
      const activityId = getRecordId(activityLog);
      const actor = getActor(activityLog);

      return {
        id: `activity-${activityId}`,
        type: 'result',
        label: formatActionLabel(activityLog.action),
        description: [actor.name || actor.email || 'Someone', formatDate(activityLog.createdAt)].filter(Boolean).join(' · '),
        icon: Activity,
        to: `/app/activity?focus=${encodeURIComponent(activityId)}`,
        query,
      };
    }),
  },
];

const ResultOption = ({ active, item, optionId, query, onClick }) => {
  const Icon = item.icon;

  return (
    <button
      type="button"
      id={optionId}
      role="option"
      aria-selected={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition focus:outline-none ${
        active ? 'bg-brand-50 text-brand-700 dark:bg-cyan-950/40 dark:text-cyan-100' : 'text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800/70'
      }`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-gray-500 ring-1 ring-gray-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{renderHighlightedText(item.label, query)}</span>
        {item.description ? (
          <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-slate-400">{renderHighlightedText(item.description, query)}</span>
        ) : null}
      </span>
      <ArrowRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
    </button>
  );
};

export const CommandPalette = ({ openRequestId = 0 }) => {
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const lastActiveElementRef = useRef(null);
  const requestIdRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(emptyResults);
  const [recentSearches, setRecentSearches] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 200);

  const openPalette = useCallback(() => {
    lastActiveElementRef.current = document.activeElement;
    setRecentSearches(readRecentSearches());
    setIsOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults(emptyResults);
    setSearchError('');
    setActiveIndex(0);

    window.setTimeout(() => {
      lastActiveElementRef.current?.focus?.();
    }, 0);
  }, []);

  useHotkey('mod+k', openPalette);

  useEffect(() => {
    if (openRequestId > 0) {
      openPalette();
    }
  }, [openPalette, openRequestId]);

  useEffect(() => {
    const handleOpen = () => openPalette();

    window.addEventListener('command-palette:open', handleOpen);

    return () => window.removeEventListener('command-palette:open', handleOpen);
  }, [openPalette]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => inputRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !debouncedQuery) {
      setIsLoading(false);
      setSearchError('');
      setResults(emptyResults);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setSearchError('');

    searchService
      .globalSearch(debouncedQuery, undefined, 5)
      .then((response) => {
        if (requestIdRef.current !== requestId) {
          return;
        }

        setResults(response.data?.data?.results || emptyResults);
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) {
          return;
        }

        setResults(emptyResults);
        setSearchError('Search could not be loaded.');
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      });
  }, [debouncedQuery, isOpen]);

  const resultGroups = useMemo(() => createResultGroups(results, debouncedQuery), [debouncedQuery, results]);
  const resultItems = useMemo(() => resultGroups.flatMap((group) => group.items), [resultGroups]);
  const initialGroups = useMemo(
    () => [
      {
        id: 'recent',
        label: 'Recent searches',
        icon: Clock3,
        items: recentSearches.map((recentQuery) => ({
          id: `recent-${recentQuery}`,
          type: 'recent',
          label: recentQuery,
          description: 'Search again',
          icon: Clock3,
          query: recentQuery,
        })),
      },
      {
        id: 'quick-links',
        label: 'Quick links',
        icon: ArrowRight,
        items: quickLinks.map((link) => ({ ...link, type: 'quick-link' })),
      },
    ],
    [recentSearches],
  );
  const visibleGroups = debouncedQuery ? resultGroups : initialGroups;
  const visibleItems = useMemo(() => visibleGroups.flatMap((group) => group.items), [visibleGroups]);
  const hasResults = resultItems.length > 0;
  const activeItem = visibleItems[activeIndex];
  const activeOptionId = activeItem ? `command-palette-option-${activeIndex}` : undefined;

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery, visibleItems.length]);

  const activateItem = useCallback(
    (item) => {
      if (!item) {
        return;
      }

      if (item.type === 'recent') {
        setQuery(item.query);
        inputRef.current?.focus();
        return;
      }

      if (item.type === 'result') {
        setRecentSearches(saveRecentSearches(item.query));
      }

      closePalette();
      navigate(item.to);
    },
    [closePalette, navigate],
  );

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closePalette();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((currentIndex) => (visibleItems.length > 0 ? (currentIndex + 1) % visibleItems.length : 0));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((currentIndex) => (visibleItems.length > 0 ? (currentIndex - 1 + visibleItems.length) % visibleItems.length : 0));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      activateItem(activeItem);
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = getFocusableElements(dialogRef.current);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (!firstElement || !lastElement) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 px-4 py-6 sm:py-20" role="presentation">
      <button type="button" className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" aria-label="Close search" onClick={closePalette} />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
        className="relative mx-auto flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onKeyDown={handleKeyDown}
      >
        <div className="border-b border-gray-100 p-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <h2 id="command-palette-title" className="sr-only">
                Global search
              </h2>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search members, invitations, or activity..."
                className="w-full bg-transparent text-base font-medium text-gray-950 outline-none placeholder:text-gray-400 dark:text-slate-50 dark:placeholder:text-slate-500"
                aria-autocomplete="list"
                aria-controls="command-palette-results"
                aria-activedescendant={activeOptionId}
              />
            </div>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-brand-600 dark:text-cyan-300" aria-label="Searching" /> : null}
            <button
              type="button"
              onClick={closePalette}
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Close search"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div id="command-palette-results" role="listbox" className="min-h-72 flex-1 overflow-y-auto py-2">
          {visibleGroups.map((group) =>
            group.items.length > 0 ? (
              <div key={group.id} role="group" aria-label={group.label} className="py-2">
                <div className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">{group.label}</div>
                {group.items.map((item) => {
                  const itemIndex = visibleItems.findIndex((visibleItem) => visibleItem.id === item.id);

                  return (
                    <ResultOption
                      key={item.id}
                      active={itemIndex === activeIndex}
                      item={item}
                      optionId={`command-palette-option-${itemIndex}`}
                      query={debouncedQuery}
                      onClick={() => activateItem(item)}
                    />
                  );
                })}
              </div>
            ) : null,
          )}

          {debouncedQuery && !isLoading && !hasResults ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <Search className="h-10 w-10 text-gray-300 dark:text-slate-600" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-slate-100">No results for '{debouncedQuery}'</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Try a member email, invitation email, or activity action.</p>
            </div>
          ) : null}

          {searchError ? <p className="px-4 py-3 text-sm text-red-600 dark:text-red-300">{searchError}</p> : null}
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-4 py-3 text-xs text-gray-500 dark:border-slate-800 dark:text-slate-400">
          <kbd className="rounded-md border border-gray-200 px-1.5 py-0.5 dark:border-slate-700">↑↓</kbd>
          navigate
          <kbd className="ml-2 rounded-md border border-gray-200 px-1.5 py-0.5 dark:border-slate-700">↵</kbd>
          select
          <kbd className="ml-2 rounded-md border border-gray-200 px-1.5 py-0.5 dark:border-slate-700">esc</kbd>
          close
        </footer>
      </section>
    </div>
  );
};
