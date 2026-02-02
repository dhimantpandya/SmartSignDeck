import { Template, Screen } from "../models";

/**
 * Get signage analytics for the dashboard
 * @returns {Promise<Object>}
 */
const getSignageStats = async () => {
  const [totalTemplates, totalScreens, onlineScreens] = await Promise.all([
    Template.countDocuments(),
    Screen.countDocuments(),
    Screen.countDocuments({ status: "online" }),
  ]);

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
