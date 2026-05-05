import ActivityLog from '../models/ActivityLog.js';
import Invitation from '../models/Invitation.js';
import Membership from '../models/Membership.js';

const chartDays = 30;

const formatDateKey = (date) => date.toISOString().slice(0, 10);

const getStartOfUtcDay = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const addUtcDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

const getRecentDayBuckets = (days = chartDays) => {
  const today = getStartOfUtcDay(new Date());
  const startDate = addUtcDays(today, -(days - 1));

  return Array.from({ length: days }, (_, index) => {
    const date = addUtcDays(startDate, index);
    return {
      date,
      key: formatDateKey(date),
    };
  });
};

const seedFromId = (id) => {
  let hash = 0;

  for (const char of String(id)) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }

  return Math.abs(hash);
};

const getPlanBaseRevenue = (org) => (org.plan === 'pro' ? 9000 : 1200);

const createMockRevenueSeries = (org, days = chartDays) => {
  const seed = seedFromId(org._id);
  const buckets = getRecentDayBuckets(days);

  return buckets.map(({ key }, index) => {
    const base = getPlanBaseRevenue(org);
    const wave = Math.sin((seed + index) * 0.3) * 1500;
    const value = Math.max(0, Math.round(base + wave + index * 50));

    return { date: key, day: index, value };
  });
};

const createMockGrowthSeries = (org, days = chartDays) => {
  const seed = seedFromId(org._id);
  const buckets = getRecentDayBuckets(days);
  const baseUsers = Math.max(org.seatsUsed, org.plan === 'pro' ? 8 : 2);

  return buckets.map(({ key }, index) => {
    const wave = Math.sin((seed + index) * 0.22) * 2;
    const trend = index * (org.plan === 'pro' ? 0.45 : 0.18);
    const value = Math.max(0, Math.round(baseUsers + trend + wave));

    return { date: key, day: index, value };
  });
};

const getGrowthRate = (series) => {
  const firstValue = series[0]?.value || 0;
  const lastValue = series.at(-1)?.value || 0;

  if (firstValue === 0) return 0;

  return Number((((lastValue - firstValue) / firstValue) * 100).toFixed(1));
};

const normalizeActivityChart = (rows, days = chartDays) => {
  const countsByDate = new Map(rows.map((row) => [row._id, row.count]));

  return getRecentDayBuckets(days).map(({ key }, index) => ({
    date: key,
    day: index,
    value: countsByDate.get(key) || 0,
  }));
};

const getActivityChartSeries = async (orgId, days = chartDays) => {
  const [firstBucket] = getRecentDayBuckets(days);

  const rows = await ActivityLog.aggregate([
    { $match: { orgId, createdAt: { $gte: firstBucket.date } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return normalizeActivityChart(rows, days);
};

export const getOverview = async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = getStartOfUtcDay(now);
    const activePendingInvitationFilter = {
      orgId: req.orgId,
      status: 'pending',
      expiresAt: { $gt: now },
    };

    const revenueSeries = createMockRevenueSeries(req.org);
    const growthSeries = createMockGrowthSeries(req.org);

    const [
      totalMembers,
      pendingInvitations,
      activitiesLast7d,
      activeUsersToday,
      recentActivity,
    ] = await Promise.all([
      Membership.countDocuments({ orgId: req.orgId }),
      Invitation.countDocuments(activePendingInvitationFilter),
      ActivityLog.countDocuments({ orgId: req.orgId, createdAt: { $gte: sevenDaysAgo } }),
      ActivityLog.distinct('actorId', { orgId: req.orgId, createdAt: { $gte: todayStart } }),
      ActivityLog.find({ orgId: req.orgId })
        .populate({ path: 'actorId', select: 'name email avatar' })
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    return res.json({
      success: true,
      data: {
        kpis: {
          totalMembers,
          pendingInvitations,
          activitiesLast7d,
          currentPlan: req.org.plan,
          monthlyRevenue: revenueSeries.reduce((sum, point) => sum + point.value, 0),
          growthRate: getGrowthRate(growthSeries),
          activeUsersToday: activeUsersToday.length,
        },
        recentActivity,
        seats: {
          used: req.org.seatsUsed,
          limit: req.org.seatLimit,
        },
        mock: {
          revenue: true,
          growth: true,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getActivityChart = async (req, res, next) => {
  try {
    const series = await getActivityChartSeries(req.orgId);

    return res.json({
      success: true,
      data: {
        mock: false,
        series,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getGrowthChart = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      data: {
        mock: true,
        series: createMockGrowthSeries(req.org),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getRevenueChart = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      data: {
        mock: true,
        series: createMockRevenueSeries(req.org),
      },
    });
  } catch (error) {
    return next(error);
  }
};
