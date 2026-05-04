import { logger } from '../config/logger.js';
import ActivityLog from '../models/ActivityLog.js';
import { emitToOrg } from './socketService.js';

export const logActivity = async ({ orgId, actorId, action, targetType, targetId, metadata = {} }) => {
  try {
    const log = await ActivityLog.create({ orgId, actorId, action, targetType, targetId, metadata });
    if (orgId) {
      emitToOrg(orgId, 'activity:new', log);
    }
    return log;
  } catch (error) {
    logger.error({ err: error, orgId, actorId, action }, 'Activity log failed');
    return null;
  }
};
