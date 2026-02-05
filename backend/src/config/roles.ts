const allRoles: Record<string, string[]> = {
  user: [
    "getUsers",
    "getTemplates",
    "createTemplates", // Explicitly added creation rights
    "manageTemplates", // Assuming manage covers edit/delete of own
    "getScreens",
    "createScreens",
    "manageScreens",
    "getMedia",
    "manageMedia",
    "getAnalytics",
  ],
  advertiser: [
    "getScreens",
    "getAnalytics",
  ],
  admin: [
    "getUsers",
    "manageUsers",
    "getTemplates",
    "createTemplates",
    "manageTemplates",
    "getScreens",
    "createScreens",
    "manageScreens",
    "getMedia",
    "manageMedia",
    "getAnalytics",
    "manageAnalytics",
    "manageCompany",
  ],
  super_admin: [
    "getUsers",
    "manageUsers", // Can delete any user
    "deleteUsers", // explicit
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
