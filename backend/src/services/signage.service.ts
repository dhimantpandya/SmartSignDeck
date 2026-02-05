import { Template, Screen } from "../models";
import mongoose from 'mongoose';

/**
 * Get signage analytics for the dashboard
 * @returns {Promise<Object>}
 */
const getSignageStats = async (companyId: string, userId?: string) => {
  const filter: any = { deletedAt: null };

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    filter.createdBy = new mongoose.Types.ObjectId(userId);
  }

  if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
    filter.companyId = new mongoose.Types.ObjectId(companyId);
  }

  console.log('[DEBUG] SignageStats Query Filter:', JSON.stringify(filter));

  const [totalTemplates, totalScreens, onlineScreens] = await Promise.all([
    Template.countDocuments(filter).catch(e => (console.error('Template count error:', e), 0)),
    Screen.countDocuments(filter).catch(e => (console.error('Screen count error:', e), 0)),
    Screen.countDocuments({ ...filter, status: "online" }).catch(e => (console.error('Screen online count error:', e), 0)),
  ]);

  console.log('[DEBUG] SignageStats Result:', { totalTemplates, totalScreens, onlineScreens });

  return {
    totalTemplates,
    totalScreens,
    onlineScreens,
    offlineScreens: totalScreens - onlineScreens,
  };
};

export default {
  getSignageStats,
};
