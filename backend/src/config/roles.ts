const allRoles: Record<string, string[]> = {
  user: [
    "getTemplates",
    "manageTemplates",
    "getScreens",
    "manageScreens",
    "getMedia",
    "manageMedia",
    "getAnalytics",
  ],
  admin: [
    "getUsers",
    "manageUsers",
    "getTemplates",
    "manageTemplates",
    "getScreens",
    "manageScreens",
    "getMedia",
    "manageMedia",
    "getAnalytics",
    "manageAnalytics",
    "manageCompany",
  ],
  super_admin: [
    "getUsers",
    "manageUsers",
    "getTemplates",
    "manageTemplates",
    "getScreens",
    "manageScreens",
    "getMedia",
    "manageMedia",
    "getAnalytics",
    "manageAnalytics",
    "manageCompany",
    "manageAllCompanies",
  ],
};

const roles: string[] = Object.keys(allRoles);
const roleRights = new Map<string, string[]>(Object.entries(allRoles));

export { roleRights, roles };
