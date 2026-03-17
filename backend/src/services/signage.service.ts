import Template from "../models/template.model";
import Screen from "../models/screen.model";
import Playlist from "../models/playlist.model";
import mongoose from 'mongoose';
import logger from "../config/logger";


/**
 * Get signage analytics for the dashboard
 * @param companyId Company ID to filter by
 * @param userId User ID for personal scope
 * @param scope "personal" or "company" (default: "personal")
 */
const getSignageStats = async (companyId: string, userId: string, scope: "personal" | "company" = "personal") => {
  const filter: any = {
    $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
  };

  // If personal scope, we restrict to the user's own content.
  if (scope === "personal" && mongoose.Types.ObjectId.isValid(userId)) {
    filter.createdBy = new mongoose.Types.ObjectId(userId);
  }

  // Always include companyId for security and performance if provided
  if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
    filter.companyId = new mongoose.Types.ObjectId(companyId);
  }

  logger.info(`[SignageStats] Scope: ${scope}, Filter: ${JSON.stringify(filter)}`);

  const TWO_MINUTES_AGO = new Date(Date.now() - 2 * 60 * 1000);

  const [totalTemplates, totalScreens, onlineScreens] = await Promise.all([
    Template.countDocuments(filter).catch(e => { logger.error('Template count error:', e); return 0; }),
    Screen.countDocuments(filter).catch(e => { logger.error('Screen count error:', e); return 0; }),
    Screen.countDocuments({
      ...filter,
      lastPing: { $gt: TWO_MINUTES_AGO }
    }).catch(e => { logger.error('Screen online count error:', e); return 0; }),
  ]);

  logger.info(`[SignageStats] Result: { totalTemplates: ${totalTemplates}, totalScreens: ${totalScreens}, onlineScreens: ${onlineScreens} }`);

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

  // ------------------------------------------------------------------
  // Collect all linked playlist IDs across every screen's content zones
  // so we can batch-fetch them in a single DB query.
  // ------------------------------------------------------------------
  const allPlaylistIds = new Set<string>();

  const collectPlaylistIds = (contentObj: any) => {
    if (!contentObj) return;
    for (const zone of Object.values(contentObj) as any[]) {
      if (zone.sourceType === 'playlist' && zone.playlistId) {
        allPlaylistIds.add(zone.playlistId.toString());
      }
    }
  };

  for (const screen of screens) {
    collectPlaylistIds(screen.defaultContent);
    if (screen.schedules) {
      for (const schedule of screen.schedules) {
        collectPlaylistIds(schedule.content);
      }
    }
  }

  // Batch-fetch all referenced playlists
  let playlistMap: Record<string, any> = {};
  if (allPlaylistIds.size > 0) {
    const playlists = await Playlist.find({
      _id: { $in: Array.from(allPlaylistIds).map(id => new mongoose.Types.ObjectId(id)) }
    }).lean();
    for (const pl of playlists) {
      playlistMap[(pl._id as any).toString()] = pl;
    }
  }

  // ------------------------------------------------------------------
  // Helper: find the first available media preview URL in a content object.
  // Handles both direct playlists and linked (shared) playlists.
  // ------------------------------------------------------------------
  const findPreviewInContent = (contentObj: any): { url: string; type: string } | null => {
    if (!contentObj) return null;
    for (const zone of Object.values(contentObj) as any[]) {
      // Direct media in the zone's playlist array
      if (zone.playlist && zone.playlist.length > 0 && zone.playlist[0].url) {
        return { url: zone.playlist[0].url, type: zone.playlist[0].type || 'image' };
      }
      // Linked (shared) playlist
      if (zone.sourceType === 'playlist' && zone.playlistId) {
        const pl = playlistMap[zone.playlistId.toString()];
        if (pl && pl.items && pl.items.length > 0) {
          return { url: pl.items[0].url, type: pl.items[0].type || 'image' };
        }
      }
      // Legacy src field
      if (zone.src) {
        return { url: zone.src, type: 'image' };
      }
    }
    return null;
  };

  const activeDisplays = [];

  for (const screen of screens) {
    let previewUrl = (screen as any).previewUrl;
    let previewType = (screen as any).previewType || 'image';

    // Try defaultContent first
    if (!previewUrl) {
      const defaultPreview = findPreviewInContent(screen.defaultContent);
      if (defaultPreview) {
        previewUrl = defaultPreview.url;
        previewType = defaultPreview.type;
      }
    }

    // Try schedules
    if (!previewUrl && screen.schedules && screen.schedules.length > 0) {
      for (const schedule of screen.schedules) {
        const schedulePreview = findPreviewInContent(schedule.content);
        if (schedulePreview) {
          previewUrl = schedulePreview.url;
          previewType = schedulePreview.type;
          break;
        }
      }
    }

    // Final fallback: template's own previewUrl
    if (!previewUrl && (screen.templateId as any)?.previewUrl) {
      previewUrl = (screen.templateId as any).previewUrl;
      previewType = (screen.templateId as any).previewType || 'image';
    }

    const screenObj = screen.toObject ? screen.toObject() : screen;
    screenObj.previewUrl = previewUrl;
    screenObj.previewType = previewType;
    activeDisplays.push(screenObj);
  }

  return activeDisplays;
}

export default {
  getSignageStats,
  getActiveContent
};
