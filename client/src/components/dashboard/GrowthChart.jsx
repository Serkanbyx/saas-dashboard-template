import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import * as dashboardService from '../../services/dashboardService';

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

const GrowthChart = ({ activeOrgId }) => {
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
        const response = await dashboardService.getGrowthChart();
        if (isMounted) {
          setSeries(response.data?.data?.series || []);
        }
      } catch (_error) {
        if (isMounted) {
          setError('Growth chart could not be loaded.');
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
    return <ChartNotice>No growth data available yet.</ChartNotice>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={series} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="growthChartFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="var(--color-brand-600)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-brand-600)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--color-slate-200)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatChartDate} tickLine={false} />
        <YAxis allowDecimals={false} tickLine={false} width={36} />
        <Tooltip labelFormatter={formatChartDate} />
        <Legend />
        <Area
          type="monotone"
          dataKey="value"
          name="Active users"
          stroke="var(--color-brand-600)"
          strokeWidth={2}
          fill="url(#growthChartFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default GrowthChart;
