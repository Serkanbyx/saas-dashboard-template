import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '../routes';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../hooks/useOrg', () => ({
  useOrg: vi.fn(),
}));

const renderProtectedAppRoute = () =>
  render(
    <MemoryRouter initialEntries={['/app/dashboard']}>
      <Routes>
        <Route path="/app" element={<ProtectedRoute requireOrg />}>
          <Route path="dashboard" element={<h1>Dashboard Target</h1>} />
        </Route>
        <Route path="/create-org" element={<h1>Create Org Target</h1>} />
      </Routes>
    </MemoryRouter>,
  );

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { id: 'user-1' },
      loading: false,
    });
  });

  it('waits for organizations to load before redirecting to organization setup', () => {
    useOrg.mockReturnValue({
      orgs: [],
      activeOrg: null,
      hasLoadedOrgs: false,
      loading: false,
      setActiveOrgFirstAvailable: vi.fn(),
    });

    renderProtectedAppRoute();

    expect(screen.getByRole('status', { name: /loading your workspace/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /create org target/i })).not.toBeInTheDocument();
  });

  it('redirects to organization setup after an empty organization list is loaded', async () => {
    useOrg.mockReturnValue({
      orgs: [],
      activeOrg: null,
      hasLoadedOrgs: true,
      loading: false,
      setActiveOrgFirstAvailable: vi.fn(),
    });

    renderProtectedAppRoute();

    expect(await screen.findByRole('heading', { name: /create org target/i })).toBeInTheDocument();
  });
});
