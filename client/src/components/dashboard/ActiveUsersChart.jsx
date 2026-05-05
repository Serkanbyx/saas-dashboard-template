import { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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

const ActiveUsersChart = ({ activeOrgId }) => {
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
        const response = await dashboardService.getActivityChart();
        if (isMounted) {
          setSeries(response.data?.data?.series || []);
        }
      } catch (_error) {
        if (isMounted) {
          setError('Activity chart could not be loaded.');
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
    return <ChartNotice>No activity events in the last 30 days.</ChartNotice>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={series} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-slate-200)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatChartDate} tickLine={false} />
        <YAxis allowDecimals={false} tickLine={false} width={36} />
        <Tooltip labelFormatter={formatChartDate} />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          name="Activity events"
          stroke="var(--color-brand-600)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ActiveUsersChart;
