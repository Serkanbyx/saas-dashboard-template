import mongoose from 'mongoose';
import Membership from '../models/Membership.js';
import Organization from '../models/Organization.js';

export const tenantContext = async (req, res, next) => {
  try {
    const orgId = req.params.orgId || req.headers['x-org-id'];

    if (!orgId || !mongoose.isValidObjectId(orgId)) {
      return res.status(400).json({ success: false, message: 'Invalid organization context' });
    }

    const org = await Organization.findOne({ _id: orgId, isDeleted: false });

    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    if (req.user.platformRole === 'superadmin') {
      req.org = org;
      req.orgId = org._id;
      req.membership = { role: 'owner' };

      req.log?.info({ orgId: org._id, userId: req.user._id }, 'Super admin tenant bypass');
      return next();
    }

    const membership = await Membership.findOne({ userId: req.user._id, orgId: org._id });

    if (!membership) {
      return res.status(403).json({ success: false, message: 'Not a member of this organization' });
    }

    req.org = org;
    req.orgId = org._id;
    req.membership = membership;

    return next();
  } catch (error) {
    return next(error);
  }
};
