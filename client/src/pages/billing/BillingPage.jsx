import { AlertTriangle, Check, CreditCard, Eye, Loader2, Receipt } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, EmptyState, Modal, PlanBadge, Spinner } from '../../components/common';
import { useOrg } from '../../hooks/useOrg';
import * as billingService from '../../services/billingService';

const plans = {
  free: {
    key: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    seatLimit: 5,
    features: ['Up to 5 members', 'Basic analytics', 'Community support'],
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    price: 29,
    currency: 'USD',
    seatLimit: 50,
    features: ['Up to 50 members', 'Advanced analytics', 'Priority support', 'Activity export', 'Custom branding'],
  },
};

const planList = [plans.free, plans.pro];

const currencyFormatter = new Intl.NumberFormat(undefined, {
  currency: 'USD',
  style: 'currency',
});

const formatPlanName = (plan) => plans[plan]?.name || 'Free';

const formatDate = (value) => {
  if (!value) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
};

const formatCurrency = (amount = 0, currency = 'USD', isMinorUnit = false) =>
  new Intl.NumberFormat(undefined, {
    currency,
    style: 'currency',
  }).format(isMinorUnit ? amount / 100 : amount);

const getErrorMessage = (error, fallbackMessage) =>
  error.response?.data?.message || error.response?.data?.errors?.[0]?.message || fallbackMessage;

const getRecordId = (record) => record?._id || record?.id || record?.invoiceNumber;

const getOrgId = (org) => org?._id || org?.id;

const StatusBadge = ({ status }) => {
  const normalizedStatus = status || 'pending';
  const variants = { failed: 'danger', paid: 'success', pending: 'warning' };

  return <Badge variant={variants[normalizedStatus] || 'warning'}>{normalizedStatus}</Badge>;
};

const PageHeader = () => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">Billing</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">Plan and billing</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-slate-300">
        Manage your workspace plan, seats, and demo invoice history.
      </p>
    </div>
    <span className="inline-flex w-fit items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
      This is a demo billing system &mdash; no real payments are processed.
    </span>
  </div>
);

const PlanCard = ({ currentPlan }) => {
  const seatsUsed = currentPlan?.seatsUsed || 0;
  const seatLimit = currentPlan?.seatLimit || plans.free.seatLimit;
  const seatPercent = seatLimit > 0 ? Math.min(Math.round((seatsUsed / seatLimit) * 100), 100) : 0;

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Current Plan</p>
          <h3 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">
            {currentPlan?.planName || formatPlanName(currentPlan?.plan)}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            {formatCurrency(currentPlan?.price || 0, currentPlan?.currency || 'USD')} / month
          </p>
        </div>
        <div className="flex w-fit items-center gap-2">
          <CreditCard className="h-4 w-4 text-brand-600 dark:text-cyan-300" aria-hidden="true" />
          <PlanBadge plan={currentPlan?.plan} />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="font-medium text-gray-700 dark:text-slate-200">Seats used</span>
          <span className="text-gray-500 dark:text-slate-400">
            {seatsUsed} / {seatLimit}
          </span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-slate-800" aria-hidden="true">
          <div className="h-2 rounded-full bg-brand-600 dark:bg-cyan-400" style={{ width: `${seatPercent}%` }} />
        </div>
      </div>

      <ul className="mt-6 grid gap-3 text-sm text-gray-600 dark:text-slate-300 sm:grid-cols-2">
        {(currentPlan?.features || plans[currentPlan?.plan]?.features || plans.free.features).map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

const PlanComparison = ({ currentPlanKey, isChangingPlan, onSelectPlan }) => (
  <section className="grid gap-4 lg:grid-cols-2" aria-label="Plans comparison">
    {planList.map((plan) => {
      const isCurrentPlan = currentPlanKey === plan.key;

      return (
        <article
          key={plan.key}
          className={`rounded-3xl border bg-white p-6 shadow-sm transition-colors dark:bg-slate-900 ${
            isCurrentPlan ? 'border-brand-300 ring-2 ring-brand-100 dark:border-cyan-500 dark:ring-cyan-950' : 'border-gray-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{isCurrentPlan ? 'Current plan' : 'Available plan'}</p>
              <h3 className="mt-2 text-2xl font-semibold text-gray-950 dark:text-slate-50">{plan.name}</h3>
            </div>
            {isCurrentPlan ? (
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-cyan-950/40 dark:text-cyan-200">
                Active
              </span>
            ) : null}
          </div>

          <p className="mt-5 text-3xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">
            {currencyFormatter.format(plan.price)}
            <span className="text-sm font-medium text-gray-500 dark:text-slate-400"> / month</span>
          </p>

          <ul className="mt-6 space-y-3 text-sm text-gray-600 dark:text-slate-300">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            disabled={isCurrentPlan || isChangingPlan}
            onClick={() => onSelectPlan(plan)}
            className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-900 ${
              isCurrentPlan
                ? 'border border-gray-200 text-gray-600 dark:border-slate-700 dark:text-slate-300'
                : 'bg-brand-600 text-white hover:bg-brand-700 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400'
            }`}
          >
            {isChangingPlan ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {isCurrentPlan ? 'Current plan' : `Switch to ${plan.name}`}
          </button>
        </article>
      );
    })}
  </section>
);

const BillingHistoryTable = ({ billingHistory, isLoading, onViewInvoice, viewingInvoiceNumber }) => (
  <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="border-b border-gray-200 p-5 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <span className="rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-cyan-950/40 dark:text-cyan-300">
          <Receipt className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-gray-950 dark:text-slate-50">Billing History</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Invoices and plan changes for this workspace.</p>
        </div>
      </div>
    </div>

    <div className="hidden overflow-x-auto md:block">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-slate-950 dark:text-slate-400">
          <tr>
            <th scope="col" className="px-5 py-3">
              Invoice #
            </th>
            <th scope="col" className="px-5 py-3">
              Date
            </th>
            <th scope="col" className="px-5 py-3">
              Description
            </th>
            <th scope="col" className="px-5 py-3">
              Amount
            </th>
            <th scope="col" className="px-5 py-3">
              Status
            </th>
            <th scope="col" className="px-5 py-3 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm dark:divide-slate-800">
          {isLoading ? (
            <tr>
              <td colSpan={6} className="px-5 py-10 text-center text-gray-500 dark:text-slate-400">
                <Spinner className="mx-auto" label="Loading billing history" />
                <span className="mt-3 block">Loading billing history...</span>
              </td>
            </tr>
          ) : null}

          {!isLoading && billingHistory.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-10 text-center text-gray-500 dark:text-slate-400">
                No billing history yet.
              </td>
            </tr>
          ) : null}

          {!isLoading
            ? billingHistory.map((record) => {
                const isViewing = viewingInvoiceNumber === record.invoiceNumber;

                return (
                  <tr key={getRecordId(record)} className="bg-white transition hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800/70">
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-950 dark:text-slate-50">{record.invoiceNumber}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-gray-600 dark:text-slate-300">{formatDate(record.createdAt)}</td>
                    <td className="min-w-64 px-5 py-4 text-gray-600 dark:text-slate-300">{record.description || 'Plan invoice'}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-gray-600 dark:text-slate-300">
                      {formatCurrency(record.amount, record.currency, true)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={isViewing}
                          onClick={() => onViewInvoice(record.invoiceNumber)}
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-brand-500 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                        >
                          {isViewing ? <Spinner color="current" label="Loading invoice" size="sm" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            : null}
        </tbody>
      </table>
    </div>
    <div className="space-y-3 p-4 md:hidden">
      {isLoading ? (
        <div className="rounded-2xl border border-gray-200 px-5 py-8 text-center text-gray-500 dark:border-slate-800 dark:text-slate-400">
          <Spinner className="mx-auto" label="Loading billing history" />
          <span className="mt-3 block text-sm">Loading billing history...</span>
        </div>
      ) : null}

      {!isLoading && billingHistory.length === 0 ? (
        <EmptyState icon={Receipt} title="No billing history yet" message="Invoices and plan changes will appear here after billing events are created." />
      ) : null}

      {!isLoading
        ? billingHistory.map((record) => {
            const isViewing = viewingInvoiceNumber === record.invoiceNumber;

            return (
              <article key={getRecordId(record)} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-gray-950 dark:text-slate-50">{record.invoiceNumber}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{record.description || 'Plan invoice'}</p>
                  </div>
                  <StatusBadge status={record.status} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">Date</dt>
                    <dd className="mt-1 text-gray-700 dark:text-slate-200">{formatDate(record.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">Amount</dt>
                    <dd className="mt-1 text-gray-700 dark:text-slate-200">{formatCurrency(record.amount, record.currency, true)}</dd>
                  </div>
                </dl>
                <Button variant="secondary" className="mt-4 w-full" disabled={isViewing} onClick={() => onViewInvoice(record.invoiceNumber)} isLoading={isViewing} icon={Eye}>
                  View
                </Button>
              </article>
            );
          })
        : null}
    </div>
  </section>
);

const PlanChangeModal = ({ currentPlanKey, isSubmitting, onClose, onConfirm, seatsUsed, selectedPlan }) => {
  const isDowngrade = currentPlanKey === 'pro' && selectedPlan?.key === 'free';
  const hasSeatOverflow = isDowngrade && seatsUsed > selectedPlan.seatLimit;

  return (
    <Modal isOpen onClose={onClose} title={`Switch to ${selectedPlan.name}`}>
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">Confirm</p>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
          <dl className="space-y-3">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500 dark:text-slate-400">Current plan</dt>
              <dd className="font-semibold text-gray-950 dark:text-slate-50">{formatPlanName(currentPlanKey)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500 dark:text-slate-400">New plan</dt>
              <dd className="font-semibold text-gray-950 dark:text-slate-50">{selectedPlan.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500 dark:text-slate-400">Seats</dt>
              <dd className="font-semibold text-gray-950 dark:text-slate-50">
                {seatsUsed} / {selectedPlan.seatLimit}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500 dark:text-slate-400">Price</dt>
              <dd className="font-semibold text-gray-950 dark:text-slate-50">{currencyFormatter.format(selectedPlan.price)} / month</dd>
            </div>
          </dl>
        </div>

        {isDowngrade ? (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              hasSeatOverflow
                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200'
                : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100'
            }`}
            role="alert"
          >
            {hasSeatOverflow
              ? `Free supports ${selectedPlan.seatLimit} seats. Remove ${seatsUsed - selectedPlan.seatLimit} member(s) before downgrading.`
              : 'Downgrading removes Pro limits and advanced features for this workspace.'}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={isSubmitting || hasSeatOverflow} onClick={onConfirm} isLoading={isSubmitting}>
            Confirm Change
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const InvoiceModal = ({ invoice, onClose }) => (
  <Modal isOpen onClose={onClose} title={invoice.invoiceNumber}>
    <div>
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">Invoice</p>

      <dl className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500 dark:text-slate-400">Date</dt>
          <dd className="font-semibold text-gray-950 dark:text-slate-50">{formatDate(invoice.createdAt)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500 dark:text-slate-400">Description</dt>
          <dd className="text-right font-semibold text-gray-950 dark:text-slate-50">{invoice.description || 'Plan invoice'}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500 dark:text-slate-400">Plan</dt>
          <dd className="font-semibold text-gray-950 dark:text-slate-50">{formatPlanName(invoice.newPlan)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500 dark:text-slate-400">Amount</dt>
          <dd className="font-semibold text-gray-950 dark:text-slate-50">{formatCurrency(invoice.amount, invoice.currency, true)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500 dark:text-slate-400">Status</dt>
          <dd>
            <StatusBadge status={invoice.status} />
          </dd>
        </div>
      </dl>
    </div>
  </Modal>
);

export const BillingPage = () => {
  const { activeOrg, refreshOrgs } = useOrg() || {};
  const activeOrgId = getOrgId(activeOrg);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [viewingInvoiceNumber, setViewingInvoiceNumber] = useState('');
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [pageError, setPageError] = useState('');

  const currentPlanKey = currentPlan?.plan || activeOrg?.plan || 'free';
  const seatsUsed = currentPlan?.seatsUsed ?? activeOrg?.seatsUsed ?? 0;

  const normalizedCurrentPlan = useMemo(() => {
    const fallbackPlan = plans[currentPlanKey] || plans.free;

    return {
      ...fallbackPlan,
      ...currentPlan,
      plan: currentPlanKey,
      planName: currentPlan?.planName || fallbackPlan.name,
      price: currentPlan?.price ?? fallbackPlan.price,
      seatLimit: currentPlan?.seatLimit ?? activeOrg?.seatLimit ?? fallbackPlan.seatLimit,
      seatsUsed,
    };
  }, [activeOrg?.seatLimit, currentPlan, currentPlanKey, seatsUsed]);

  const loadHistory = useCallback(async () => {
    if (!activeOrgId) {
      setBillingHistory([]);
      setIsLoadingHistory(false);
      return;
    }

    setIsLoadingHistory(true);

    try {
      const response = await billingService.listBillingHistory({ limit: 20 });
      setBillingHistory(response.data?.data?.billingRecords || []);
    } catch (error) {
      setPageError(getErrorMessage(error, 'Billing history could not be loaded.'));
    } finally {
      setIsLoadingHistory(false);
    }
  }, [activeOrgId]);

  const loadBilling = useCallback(async () => {
    if (!activeOrgId) {
      setCurrentPlan(null);
      setBillingHistory([]);
      setIsLoadingPlan(false);
      setIsLoadingHistory(false);
      return;
    }

    setIsLoadingPlan(true);
    setPageError('');

    try {
      const [planResponse, historyResponse] = await Promise.all([
        billingService.getCurrentPlan(),
        billingService.listBillingHistory({ limit: 20 }),
      ]);

      setCurrentPlan(planResponse.data?.data || null);
      setBillingHistory(historyResponse.data?.data?.billingRecords || []);
    } catch (error) {
      setPageError(getErrorMessage(error, 'Billing details could not be loaded.'));
    } finally {
      setIsLoadingPlan(false);
      setIsLoadingHistory(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  const handleConfirmPlanChange = async () => {
    if (!selectedPlan) {
      return;
    }

    setIsChangingPlan(true);
    setPageError('');

    try {
      const response = await billingService.changePlan({ newPlan: selectedPlan.key });
      const nextPlan = response.data?.data?.plan;

      setCurrentPlan(nextPlan || null);
      setSelectedPlan(null);
      toast.success(`Switched to ${selectedPlan.name}.`);
      await Promise.all([loadHistory(), refreshOrgs?.()]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Plan could not be changed.'));
    } finally {
      setIsChangingPlan(false);
    }
  };

  const handleViewInvoice = async (invoiceNumber) => {
    setViewingInvoiceNumber(invoiceNumber);

    try {
      const response = await billingService.getInvoice(invoiceNumber);
      setInvoice(response.data?.data?.billingRecord || null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Invoice could not be loaded.'));
    } finally {
      setViewingInvoiceNumber('');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <PageHeader />
      </section>

      {pageError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200" role="alert">
          {pageError}
        </div>
      ) : null}

      {isLoadingPlan ? (
        <section className="rounded-3xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <Spinner className="mx-auto" label="Loading plan details" size="lg" />
          <span className="mt-3 block text-sm">Loading plan details...</span>
        </section>
      ) : (
        <>
          <PlanCard currentPlan={normalizedCurrentPlan} />
          <PlanComparison currentPlanKey={currentPlanKey} isChangingPlan={isChangingPlan} onSelectPlan={setSelectedPlan} />
        </>
      )}

      <BillingHistoryTable
        billingHistory={billingHistory}
        isLoading={isLoadingHistory}
        onViewInvoice={handleViewInvoice}
        viewingInvoiceNumber={viewingInvoiceNumber}
      />

      {selectedPlan ? (
        <PlanChangeModal
          currentPlanKey={currentPlanKey}
          isSubmitting={isChangingPlan}
          onClose={() => setSelectedPlan(null)}
          onConfirm={handleConfirmPlanChange}
          seatsUsed={seatsUsed}
          selectedPlan={selectedPlan}
        />
      ) : null}

      {invoice ? <InvoiceModal invoice={invoice} onClose={() => setInvoice(null)} /> : null}
    </div>
  );
};
