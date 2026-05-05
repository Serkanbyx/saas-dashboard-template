import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../pages/AuthPages';
import { useAuth } from '../hooks/useAuth';
import * as organizationService from '../services/organizationService';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/organizationService', () => ({
  getMyOrgs: vi.fn(),
}));

const renderLoginPage = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app/dashboard" element={<h1>Dashboard Target</h1>} />
        <Route path="/create-org" element={<h1>Create Org Target</h1>} />
      </Routes>
    </MemoryRouter>,
  );

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an error message when login fails', async () => {
    const user = userEvent.setup();
    useAuth.mockReturnValue({
      login: vi.fn().mockRejectedValue({
        response: { data: { message: 'Invalid email or password' } },
      }),
    });

    renderLoginPage();
    await user.type(screen.getByLabelText(/^email$/i), 'demo@example.test');
    await user.type(screen.getByLabelText(/^password$/i), 'WrongPassword123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });

  it('navigates to the dashboard after a successful login with organizations', async () => {
    const user = userEvent.setup();
    useAuth.mockReturnValue({ login: vi.fn().mockResolvedValue({ id: 'user-1' }) });
    organizationService.getMyOrgs.mockResolvedValue({
      data: { data: { organizations: [{ id: 'org-1', name: 'Acme' }] } },
    });

    renderLoginPage();
    await user.type(screen.getByLabelText(/^email$/i), 'demo@example.test');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByRole('heading', { name: /dashboard target/i })).toBeInTheDocument();
  });
});
