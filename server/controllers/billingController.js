import mongoose from 'mongoose';
import BillingRecord from '../models/BillingRecord.js';
import { logActivity } from '../services/activityService.js';
import { emitToOrg } from '../services/socketService.js';
import { PLANS } from '../utils/constants.js';
import { generateInvoiceNumber } from '../utils/generateInvoiceNumber.js';

const createHttpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

const getPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 50);

  return { page, limit };
};

const getPlanPayload = (org) => {
  const plan = PLANS[org.plan];

  return {
    plan: org.plan,
    planName: plan.name,
    price: plan.price,
    currency: plan.currency,
    planUpdatedAt: org.planUpdatedAt,
    seatsUsed: org.seatsUsed,
    seatLimit: org.seatLimit,
    features: plan.features,
  };
};

const getPlanChangeType = (previousPlan, newPlan) => {
  if (previousPlan === 'free' && newPlan === 'pro') return 'upgrade';
  if (previousPlan === 'pro' && newPlan === 'free') return 'downgrade';

  return 'subscription';
};

const createBillingRecordWithUniqueInvoice = async (payload, session) => {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const [record] = await BillingRecord.create([{ ...payload, invoiceNumber: generateInvoiceNumber() }], {
        session,
      });

      return record;
    } catch (error) {
      if (error.code !== 11000 || attempt === maxAttempts) {
        throw error;
      }
    }
  }

  throw createHttpError(500, 'Invoice number generation failed');
};

export const getCurrentPlan = async (req, res, next) => {
  try {
    return res.json({ success: true, data: getPlanPayload(req.org) });
  } catch (error) {
    return next(error);
  }
};

export const changePlan = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { newPlan } = req.body;
    const selectedPlan = PLANS[newPlan];
    const previousPlan = req.org.plan;

    if (!selectedPlan) {
      throw createHttpError(400, 'Invalid plan');
    }

    if (previousPlan === newPlan) {
      throw createHttpError(400, 'Organization is already on this plan');
    }

    if (newPlan === 'free' && req.org.seatsUsed > PLANS.free.seatLimit) {
      throw createHttpError(400, 'Remove members before downgrading to the Free plan');
    }

    let billingRecord;

    await session.withTransaction(async () => {
      req.org.plan = newPlan;
      req.org.seatLimit = selectedPlan.seatLimit;
      req.org.planUpdatedAt = new Date();

      billingRecord = await createBillingRecordWithUniqueInvoice(
        {
          orgId: req.orgId,
          actorId: req.user._id,
          type: getPlanChangeType(previousPlan, newPlan),
          previousPlan,
          newPlan,
          amount: selectedPlan.price * 100,
          currency: selectedPlan.currency,
          status: 'paid',
          description: `Plan changed from ${PLANS[previousPlan].name} to ${selectedPlan.name}`,
        },
        session,
      );

      await req.org.save({ session });
    });

    await logActivity({
      orgId: req.orgId,
      actorId: req.user._id,
      action: 'billing.plan_changed',
      targetType: 'billing',
      targetId: billingRecord._id,
      metadata: {
        previousPlan,
        newPlan,
        invoiceNumber: billingRecord.invoiceNumber,
      },
    });

    const notification = {
      type: 'plan_changed',
      title: 'Plan changed',
      message: `Plan changed from ${PLANS[previousPlan].name} to ${selectedPlan.name}.`,
      link: '/billing',
      metadata: {
        previousPlan,
        newPlan,
        invoiceNumber: billingRecord.invoiceNumber,
      },
    };

    emitToOrg(req.orgId, 'billing:plan_changed', {
      plan: getPlanPayload(req.org),
      billingRecord,
    });
    emitToOrg(req.orgId, 'notification:new', notification);

    return res.json({
      success: true,
      data: {
        plan: getPlanPayload(req.org),
        billingRecord,
      },
    });
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
};

export const listBillingHistory = async (req, res, next) => {
  try {
    const { page, limit } = getPagination(req.query);
    const filter = { orgId: req.orgId };

    const [billingRecords, total] = await Promise.all([
      BillingRecord.find(filter)
        .populate({ path: 'actorId', select: 'name email avatar' })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      BillingRecord.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        billingRecords,
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

export const getInvoice = async (req, res, next) => {
  try {
    const billingRecord = await BillingRecord.findOne({
      orgId: req.orgId,
      invoiceNumber: req.params.invoiceNumber,
    }).populate({ path: 'actorId', select: 'name email avatar' });

    if (!billingRecord) {
      throw createHttpError(404, 'Invoice not found');
    }

    return res.json({ success: true, data: { billingRecord } });
  } catch (error) {
    return next(error);
  }
};
