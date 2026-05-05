import { CheckCircle2, Eye, EyeOff, Loader2, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import * as organizationService from '../services/organizationService';
import * as uploadService from '../services/uploadService';

const maxLogoSizeBytes = 5 * 1024 * 1024;
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

const extractErrorDetails = (error, fallbackMessage) => {
  const response = error.response?.data;
  const fieldErrors = {};

  response?.errors?.forEach((item) => {
    if (item.field && !fieldErrors[item.field]) {
      fieldErrors[item.field] = item.message;
    }
  });

  return {
    message: response?.message || response?.errors?.[0]?.message || fallbackMessage,
    fieldErrors,
  };
};

const createSlugPreview = (value) => {
  const normalizedValue = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalizedValue || 'your-org';
};

const getSafeNextPath = (nextPath) => {
  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return null;
  }

  return nextPath;
};

const Alert = ({ children }) =>
  children ? (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
      {children}
    </div>
  ) : null;

const FieldError = ({ children }) =>
  children ? (
    <p className="mt-2 text-sm text-red-600 dark:text-red-300" role="alert">
      {children}
    </p>
  ) : null;

const FormHeader = ({ eyebrow = 'Account', title, description }) => (
  <div>
    <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">{eyebrow}</p>
    <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">{title}</h1>
    <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-slate-300">{description}</p>
  </div>
);

const SubmitButton = ({ children, isLoading }) => (
  <button
    type="submit"
    disabled={isLoading}
    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70 dark:focus:ring-offset-slate-900"
  >
    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
    {children}
  </button>
);

const TextInput = ({ error, label, id, ...props }) => (
  <label className="block" htmlFor={id}>
    <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{label}</span>
    <input
      id={id}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-950 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500"
      {...props}
    />
    <span id={`${id}-error`}>
      <FieldError>{error}</FieldError>
    </span>
  </label>
);

const PasswordInput = ({ error, id, label, value, onChange, autoComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const startReveal = () => setIsVisible(true);
  const stopReveal = () => setIsVisible(false);
  const handleRevealKeyDown = (event) => {
    if (event.key === ' ' || event.key === 'Enter') {
      startReveal();
    }
  };
  const handleRevealKeyUp = (event) => {
    if (event.key === ' ' || event.key === 'Enter') {
      stopReveal();
    }
  };

  return (
    <label className="block" htmlFor={id}>
      <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{label}</span>
      <span className="mt-2 flex rounded-xl border border-gray-200 bg-white shadow-sm transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950">
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="min-w-0 flex-1 rounded-l-xl bg-transparent px-4 py-3 text-sm text-gray-950 outline-none placeholder:text-gray-400 dark:text-slate-50 dark:placeholder:text-slate-500"
          required
        />
        <button
          type="button"
          onMouseDown={startReveal}
          onMouseUp={stopReveal}
          onMouseLeave={stopReveal}
          onTouchStart={startReveal}
          onTouchEnd={stopReveal}
          onKeyDown={handleRevealKeyDown}
          onKeyUp={handleRevealKeyUp}
          className="inline-flex w-12 items-center justify-center rounded-r-xl text-gray-500 transition hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500 dark:text-slate-400 dark:hover:text-cyan-300"
          aria-label={isVisible ? 'Hide password' : 'Show password'}
        >
          {isVisible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </span>
      <span id={`${id}-error`}>
        <FieldError>{error}</FieldError>
      </span>
    </label>
  );
};

export const LoginPage = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formValues, setFormValues] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field) => (event) => {
    setFormValues((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      await auth.login(formValues.email, formValues.password);

      const nextPath = getSafeNextPath(searchParams.get('next'));
      if (nextPath) {
        navigate(nextPath, { replace: true });
        return;
      }

      const response = await organizationService.getMyOrgs();
      const organizations = response.data?.data?.organizations || [];
      navigate(organizations.length > 0 ? '/app/dashboard' : '/create-org', { replace: true });
    } catch (error) {
      const details = extractErrorDetails(error, 'Unable to log in. Please check your details and try again.');
      setFormError(details.message);
      setFieldErrors(details.fieldErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <FormHeader title="Welcome back" description="Log in with your email and password to continue." />
      <Alert>{formError}</Alert>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <TextInput
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={formValues.email}
          onChange={updateField('email')}
          error={fieldErrors.email}
          required
        />
        <PasswordInput
          id="login-password"
          label="Password"
          value={formValues.password}
          onChange={updateField('password')}
          error={fieldErrors.password}
          autoComplete="current-password"
        />
        <SubmitButton isLoading={isSubmitting}>Log in</SubmitButton>
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-slate-300">
        Don't have an account?{' '}
        <Link className="font-semibold text-brand-600 hover:text-brand-700 dark:text-cyan-300" to="/register">
          Register
        </Link>
      </p>
    </div>
  );
};

export const RegisterPage = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field) => (event) => {
    setFormValues((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (formValues.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters';
    }

    if (formValues.password !== formValues.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords must match';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await auth.register({
        name: formValues.name,
        email: formValues.email,
        password: formValues.password,
      });
      navigate('/create-org', { replace: true });
    } catch (error) {
      const details = extractErrorDetails(error, 'Unable to create your account. Please try again.');
      setFormError(details.message);
      setFieldErrors(details.fieldErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <FormHeader title="Create your account" description="Start with your personal account, then set up your organization." />
      <Alert>{formError}</Alert>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <TextInput
          id="register-name"
          label="Name"
          type="text"
          autoComplete="name"
          value={formValues.name}
          onChange={updateField('name')}
          error={fieldErrors.name}
          required
        />
        <TextInput
          id="register-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={formValues.email}
          onChange={updateField('email')}
          error={fieldErrors.email}
          required
        />
        <PasswordInput
          id="register-password"
          label="Password"
          value={formValues.password}
          onChange={updateField('password')}
          error={fieldErrors.password}
          autoComplete="new-password"
        />
        <PasswordInput
          id="register-confirm-password"
          label="Confirm password"
          value={formValues.confirmPassword}
          onChange={updateField('confirmPassword')}
          error={fieldErrors.confirmPassword}
          autoComplete="new-password"
        />
        <SubmitButton isLoading={isSubmitting}>Create account</SubmitButton>
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-slate-300">
        Already have an account?{' '}
        <Link className="font-semibold text-brand-600 hover:text-brand-700 dark:text-cyan-300" to="/login">
          Login
        </Link>
      </p>
    </div>
  );
};

const WizardProgress = ({ currentStep }) => {
  const steps = ['Basics', 'Logo', 'Confirm'];

  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Organization setup progress">
      {steps.map((step, index) => {
        const isActive = currentStep === index;
        const isComplete = currentStep > index;

        return (
          <li key={step}>
            <div
              className={`h-2 rounded-full transition ${
                isComplete || isActive ? 'bg-brand-600 dark:bg-cyan-300' : 'bg-gray-200 dark:bg-slate-700'
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
};

export const CreateOrgPage = () => {
  const navigate = useNavigate();
  const { orgs = [], createOrg } = useOrg() || {};
  const [currentStep, setCurrentStep] = useState(0);
  const [formValues, setFormValues] = useState({ name: '', description: '' });
  const [logoUrl, setLogoUrl] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const slugPreview = useMemo(() => createSlugPreview(formValues.name), [formValues.name]);

  const updateField = (field) => (event) => {
    setFormValues((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  const validateBasics = () => {
    const nextErrors = {};

    if (formValues.name.trim().length < 2) {
      nextErrors.name = 'Organization name must be at least 2 characters';
    }

    if (formValues.description.length > 500) {
      nextErrors.description = 'Description cannot exceed 500 characters';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleBasicsNext = () => {
    if (validateBasics()) {
      setCurrentStep(1);
    }
  };

  const handleLogoSelect = (event) => {
    const file = event.target.files?.[0];
    setFormError('');

    if (!file) {
      setSelectedLogoFile(null);
      return;
    }

    if (!imageMimeTypes.includes(file.type)) {
      setSelectedLogoFile(null);
      setFormError('Please choose a JPG, PNG, WEBP, or SVG image.');
      return;
    }

    if (file.size > maxLogoSizeBytes) {
      setSelectedLogoFile(null);
      setFormError('Logo image must be 5MB or smaller.');
      return;
    }

    setSelectedLogoFile(file);
  };

  const handleLogoUpload = async () => {
    if (!selectedLogoFile) {
      setFormError('Please choose a logo file first, or skip this step.');
      return;
    }

    setFormError('');
    setIsUploadingLogo(true);

    try {
      const response = await uploadService.uploadOrgLogo(selectedLogoFile);
      setLogoUrl(response.data?.data?.url || '');
      setCurrentStep(2);
    } catch (error) {
      const details = extractErrorDetails(error, 'Unable to upload the logo. You can skip this step and add it later.');
      setFormError(details.message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCreateOrg = async () => {
    if (!validateBasics()) {
      setCurrentStep(0);
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      await createOrg({
        name: formValues.name.trim(),
        description: formValues.description.trim(),
        logo: logoUrl,
      });
      navigate('/app/dashboard?onboarding=true', { replace: true });
    } catch (error) {
      const details = extractErrorDetails(error, 'Unable to create the organization. Please try again.');
      setFormError(details.message);
      setFieldErrors(details.fieldErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <FormHeader
        eyebrow="Setup"
        title="Create organization"
        description="Set up your workspace in three quick steps. You can update these details later."
      />
      <WizardProgress currentStep={currentStep} />
      <Alert>{formError}</Alert>

      {currentStep === 0 ? (
        <div className="space-y-5">
          <TextInput
            id="org-name"
            label="Organization name"
            type="text"
            value={formValues.name}
            onChange={updateField('name')}
            error={fieldErrors.name}
            required
          />
          <label className="block" htmlFor="org-description">
            <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Description</span>
            <textarea
              id="org-description"
              rows={4}
              value={formValues.description}
              onChange={updateField('description')}
              aria-invalid={Boolean(fieldErrors.description)}
              className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-950 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500"
              placeholder="What does your team work on?"
            />
            <FieldError>{fieldErrors.description}</FieldError>
          </label>
          <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:bg-slate-950 dark:text-slate-300">
            Slug preview: <span className="font-semibold text-gray-900 dark:text-slate-100">{slugPreview}</span>
          </div>
          <button
            type="button"
            onClick={handleBasicsNext}
            className="inline-flex w-full justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
          >
            Continue
          </button>
        </div>
      ) : null}

      {currentStep === 1 ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center dark:border-slate-700 dark:bg-slate-950">
            {logoUrl ? (
              <img src={logoUrl} alt="Organization logo preview" className="mx-auto h-20 w-20 rounded-2xl object-contain" />
            ) : (
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm dark:bg-slate-900 dark:text-cyan-300">
                <Upload className="h-8 w-8" aria-hidden="true" />
              </div>
            )}
            <label className="mt-4 inline-flex cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-brand-500 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" htmlFor="org-logo">
              Choose logo
              <input id="org-logo" type="file" accept=".jpg,.jpeg,.png,.webp,.svg,image/*" onChange={handleLogoSelect} className="sr-only" />
            </label>
            <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">
              {selectedLogoFile ? selectedLogoFile.name : 'JPG, PNG, WEBP, or SVG up to 5MB.'}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setCurrentStep(0)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-brand-500 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleLogoUpload}
              disabled={isUploadingLogo}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isUploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Upload logo
            </button>
          </div>
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className="w-full text-center text-sm font-semibold text-gray-600 transition hover:text-brand-600 dark:text-slate-300 dark:hover:text-cyan-300"
          >
            Skip
          </button>
        </div>
      ) : null}

      {currentStep === 2 ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-12 w-12 rounded-xl object-contain" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-sm font-bold text-brand-600 dark:bg-slate-900 dark:text-cyan-300">
                  {formValues.name.charAt(0).toUpperCase() || 'O'}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-gray-950 dark:text-slate-50">{formValues.name || 'Organization'}</h2>
                <p className="truncate text-sm text-gray-500 dark:text-slate-400">{slugPreview}</p>
              </div>
            </div>
            <dl className="mt-5 grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500 dark:text-slate-400">Plan</dt>
                <dd className="font-semibold text-gray-900 dark:text-slate-100">Free</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500 dark:text-slate-400">Logo</dt>
                <dd className="flex items-center gap-1 font-semibold text-gray-900 dark:text-slate-100">
                  {logoUrl ? <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" /> : null}
                  {logoUrl ? 'Uploaded' : 'Skipped'}
                </dd>
              </div>
            </dl>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-brand-500 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleCreateOrg}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Create Organization
            </button>
          </div>
        </div>
      ) : null}

      {orgs.length > 0 ? (
        <p className="text-center text-sm">
          <Link className="font-semibold text-gray-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-cyan-300" to="/app/dashboard">
            Skip for now
          </Link>
        </p>
      ) : null}
    </div>
  );
};
