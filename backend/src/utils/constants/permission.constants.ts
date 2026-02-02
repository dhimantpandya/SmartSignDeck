export const PERMISSION_CREATED: string = "Permission created successfully.";
export const PERMISSION_UPDATED: string = "Permission updated successfully.";
export const PERMISSION_DELETED: string = "Permission deleted successfully.";
export const PERMISSION_TAKEN: string =
  "A permission with the same name already exists.";
export const permissionActions = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  GET: "get",
  GET_ALL: "get_all",
} as const;
