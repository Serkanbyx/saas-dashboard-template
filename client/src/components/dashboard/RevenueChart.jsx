import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import * as dashboardService from '../../services/dashboardService';

const currencyFormatter = new Intl.NumberFormat(undefined, {
  currency: 'USD',
  maximumFractionDigits: 0,
  style: 'currency',
});

const formatChartDate = (value) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));

const ChartSkeleton = () => (
  <div className="h-[300px] animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-800" aria-hidden="true" />
);

const ChartNotice = ({ children }) => (
  <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-gray-200 px-6 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
    {children}
  </div>
);

const RevenueChart = ({ activeOrgId }) => {
  const [series, setSeries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadChart = async () => {
      if (!activeOrgId) {
        setSeries([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await dashboardService.getRevenueChart();
        if (isMounted) {
          setSeries(response.data?.data?.series || []);
        }
      } catch (_error) {
        if (isMounted) {
          setError('Revenue chart could not be loaded.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadChart();

    return () => {
      isMounted = false;
    };
  }, [activeOrgId]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (error) {
    return <ChartNotice>{error}</ChartNotice>;
  }

  if (series.length === 0) {
    return <ChartNotice>No revenue data available yet.</ChartNotice>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={series} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-slate-200)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatChartDate} tickLine={false} />
        <YAxis tickFormatter={(value) => currencyFormatter.format(value)} tickLine={false} width={72} />
        <Tooltip formatter={(value) => currencyFormatter.format(value)} labelFormatter={formatChartDate} />
        <Legend />
        <Bar dataKey="value" fill="var(--color-brand-600)" name="Revenue" radius={[10, 10, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;
