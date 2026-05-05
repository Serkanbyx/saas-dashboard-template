import { CheckCircle2, Loader2, MailPlus, Sparkles, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useOrg } from '../../hooks/useOrg';
import * as invitationService from '../../services/invitationService';

const steps = ['Welcome', 'Invite', 'Customize', 'Done'];

const getSuggestedInviteEmail = (email) => {
  const domain = email?.split('@')[1];
  return domain ? `teammate@${domain}` : '';
};

const getErrorMessage = (error, fallbackMessage) =>
  error.response?.data?.message || error.response?.data?.errors?.[0]?.message || fallbackMessage;

const StepProgress = ({ currentStep }) => (
  <ol className="grid grid-cols-4 gap-2" aria-label="Onboarding progress">
    {steps.map((step, index) => {
      const isActive = currentStep === index;
      const isComplete = currentStep > index;

      return (
        <li key={step}>
          <div
            className={`h-2 rounded-full transition ${
              isActive || isComplete ? 'bg-brand-600 dark:bg-cyan-300' : 'bg-gray-200 dark:bg-slate-700'
            }`}
          />
          <p className={`mt-2 text-xs font-medium ${isActive ? 'text-brand-600 dark:text-cyan-300' : 'text-gray-500 dark:text-slate-400'}`}>
            {step}
          </p>
        </li>
      );
    })}
  </ol>
);

const StepIcon = ({ children }) => (
  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-cyan-950/40 dark:text-cyan-300">
    {children}
  </div>
);

export const OnboardingWizard = ({ onCompleted }) => {
  const navigate = useNavigate();
  const { user, completeOnboarding } = useAuth() || {};
  const { activeOrg } = useOrg() || {};
  const [currentStep, setCurrentStep] = useState(0);
  const [inviteValues, setInviteValues] = useState({
    email: getSuggestedInviteEmail(user?.email),
    role: 'member',
  });
  const [inviteError, setInviteError] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const orgName = activeOrg?.name || 'your workspace';
  const userName = user?.name?.split(' ')[0] || 'there';
  const isLastStep = currentStep === steps.length - 1;
  const canGoBack = currentStep > 0 && !isCompleting;

  const stepTitle = useMemo(() => {
    if (currentStep === 0) return `Welcome, ${userName}!`;
    if (currentStep === 1) return 'Invite your first teammate';
    if (currentStep === 2) return 'Customize your dashboard';
    return "You're all set";
  }, [currentStep, userName]);

  useEffect(() => {
    if (currentStep !== 2) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setCurrentStep(3), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [currentStep]);

  const completeWizard = async () => {
    setIsCompleting(true);
    setInviteError('');

    try {
      await completeOnboarding();
      onCompleted?.();
      navigate('/app/dashboard', { replace: true });
    } catch (error) {
      setInviteError(getErrorMessage(error, 'Unable to complete onboarding. Please try again.'));
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSkip = () => {
    completeWizard();
  };

  const handleInviteChange = (field) => (event) => {
    setInviteValues((current) => ({ ...current, [field]: event.target.value }));
    setInviteError('');
  };

  const handleSendInvite = async (event) => {
    event.preventDefault();
    setInviteError('');

    if (!inviteValues.email.trim()) {
      setInviteError('Please enter a teammate email or skip this step.');
      return;
    }

    setIsInviting(true);

    try {
      await invitationService.createInvitation({
        email: inviteValues.email.trim(),
        role: inviteValues.role,
      });
      toast.success('Invitation sent');
      setCurrentStep(2);
    } catch (error) {
      setInviteError(getErrorMessage(error, 'Unable to send the invitation. You can skip and invite teammates later.'));
    } finally {
      setIsInviting(false);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      completeWizard();
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <section
        aria-labelledby="onboarding-title"
        aria-modal="true"
        role="dialog"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">First run</p>
            <h2 id="onboarding-title" className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">
              {stepTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            disabled={isCompleting}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Skip
          </button>
        </div>

        <div className="mt-6">
          <StepProgress currentStep={currentStep} />
        </div>

        {inviteError ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200" role="alert">
            {inviteError}
          </div>
        ) : null}

        <div className="mt-8">
          {currentStep === 0 ? (
            <div className="space-y-5">
              <StepIcon>
                <Sparkles className="h-7 w-7" aria-hidden="true" />
              </StepIcon>
              <div>
                <p className="text-lg font-semibold text-gray-950 dark:text-slate-50">Let's set up {orgName}.</p>
                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-slate-300">
                  Your dashboard brings team members, activity, billing, and workspace settings into one clean place.
                  We will walk through the essentials in under a minute.
                </p>
              </div>
            </div>
          ) : null}

          {currentStep === 1 ? (
            <form className="space-y-5" onSubmit={handleSendInvite} noValidate>
              <StepIcon>
                <MailPlus className="h-7 w-7" aria-hidden="true" />
              </StepIcon>
              <p className="text-sm leading-6 text-gray-600 dark:text-slate-300">
                Bring a teammate in now, or skip this and invite people from the Members page later.
              </p>
              <label className="block" htmlFor="onboarding-invite-email">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Email</span>
                <input
                  id="onboarding-invite-email"
                  type="email"
                  value={inviteValues.email}
                  onChange={handleInviteChange('email')}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-950 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500"
                  placeholder="teammate@example.com"
                  autoComplete="email"
                />
              </label>
              <label className="block" htmlFor="onboarding-invite-role">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Role</span>
                <select
                  id="onboarding-invite-role"
                  value={inviteValues.role}
                  onChange={handleInviteChange('role')}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-950 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-brand-500 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  Skip for now
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isInviting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  Send invite
                </button>
              </div>
            </form>
          ) : null}

          {currentStep === 2 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="block w-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-left transition hover:border-brand-500 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-cyan-300 dark:hover:bg-cyan-950/20"
            >
              <StepIcon>
                <UsersRound className="h-7 w-7" aria-hidden="true" />
              </StepIcon>
              <p className="mt-5 text-lg font-semibold text-gray-950 dark:text-slate-50">A focused dashboard for your team</p>
              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-slate-300">
                Start with the default view, then tailor members, billing, and activity workflows as your team grows.
                This step will continue automatically.
              </p>
            </button>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-950 dark:text-slate-50">Your workspace is ready.</p>
                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-slate-300">
                  Explore your dashboard now. You can revisit members, activity, billing, and settings any time from the sidebar.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {currentStep !== 1 ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
              disabled={!canGoBack}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-brand-500 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={isCompleting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {isLastStep ? 'Explore your dashboard' : 'Next'}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
};
