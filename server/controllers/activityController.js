import ActivityLog from '../models/ActivityLog.js';

const getPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 50);

  return { page, limit };
};

const getActivityFilter = (req) => {
  const filter = { orgId: req.orgId };

  if (req.query.action) {
    filter.action = req.query.action;
  }

  if (req.query.actorId) {
    filter.actorId = req.query.actorId;
  }

  if (req.query.targetType) {
    filter.targetType = req.query.targetType;
  }

  return filter;
};

const normalizeActionStats = (rows) => ({
  total: rows.reduce((sum, row) => sum + row.count, 0),
  byAction: rows.map((row) => ({ action: row._id, count: row.count })),
});

export const listActivity = async (req, res, next) => {
  try {
    const { page, limit } = getPagination(req.query);
    const filter = getActivityFilter(req);

    const [activities, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate({ path: 'actorId', select: 'name email avatar' })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ActivityLog.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        activities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getActivityStats = async (req, res, next) => {
  try {
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const createStatsPipeline = (since) => [
      { $match: { orgId: req.orgId, createdAt: { $gte: since } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ];

    const [last7d, last30d] = await Promise.all([
      ActivityLog.aggregate(createStatsPipeline(sevenDaysAgo)),
      ActivityLog.aggregate(createStatsPipeline(thirtyDaysAgo)),
    ]);

    return res.json({
      success: true,
      data: {
        last7d: normalizeActionStats(last7d),
        last30d: normalizeActionStats(last30d),
      },
    });
  } catch (error) {
    return next(error);
  }
};
