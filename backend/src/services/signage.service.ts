import Template from "../models/template.model";
import Screen from "../models/screen.model";
import mongoose from 'mongoose';

/**
 * Get signage analytics for the dashboard
 * @param companyId Company ID to filter by
 * @param userId User ID for personal scope
 * @param scope "personal" or "company" (default: "personal")
 */
const getSignageStats = async (companyId: string, userId: string, scope: "personal" | "company" = "personal") => {
  const filter: any = {
    deletedAt: null
  };

  // If personal scope, we restrict to the user's own content.
  // If company scope, we show everything in the company.
  if (scope === "personal" && mongoose.Types.ObjectId.isValid(userId)) {
    filter.createdBy = new mongoose.Types.ObjectId(userId);
  }

  // Always include companyId for security and performance if provided
  if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
    filter.companyId = new mongoose.Types.ObjectId(companyId);
  }

  console.log('[DEBUG] SignageStats Query Filter:', JSON.stringify(filter));

  const TWO_MINUTES_AGO = new Date(Date.now() - 2 * 60 * 1000);

  const [totalTemplates, totalScreens, onlineScreens] = await Promise.all([
    Template.countDocuments(filter).catch(e => (console.error('Template count error:', e), 0)),
    Screen.countDocuments(filter).catch(e => (console.error('Screen count error:', e), 0)),
    Screen.countDocuments({
      ...filter,
      lastPing: { $gt: TWO_MINUTES_AGO }
    }).catch(e => (console.error('Screen online count error:', e), 0)),
  ]);

  console.log('[DEBUG] SignageStats Result:', { totalTemplates, totalScreens, onlineScreens });

  return {
    totalTemplates,
    totalScreens,
    onlineScreens,
    offlineScreens: totalScreens - onlineScreens,
  };
};

/**
 * Get active displays (Screens with designated content and linked templates)
 */
const getActiveContent = async (companyId: string, userId?: string) => {
  const filter: any = {
    deletedAt: null
  };

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    filter.createdBy = new mongoose.Types.ObjectId(userId);
  }

  if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
    filter.companyId = new mongoose.Types.ObjectId(companyId);
  }

  // Find screens that are linked to a template
  const screens = await Screen.find(filter)
    .populate('templateId')
    .sort({ updated_at: -1 });

  // Filter for screens that actually have content (defaultContent not empty)
  // and have a valid template attached
  const activeDisplays = screens.filter(screen => {
    const hasTemplate = !!screen.templateId;
    const hasContent = screen.defaultContent && Object.keys(screen.defaultContent).length > 0;

    // Deep check for actual media in the content
    let hasMedia = false;
    if (hasContent) {
      Object.values(screen.defaultContent).forEach((zone: any) => {
        if (zone.type === 'image' || zone.type === 'video' || (zone.playlist && zone.playlist.length > 0)) {
          hasMedia = true;
        }
      });
    }

    return hasTemplate && hasMedia;
  });

  return activeDisplays;
}

export default {
  getSignageStats,
  getActiveContent
};
