import Joi from "joi";
import { statusConstants } from "../utils/constants/constants";
import { objectId } from "./custom.validation";

/* eslint-disable @typescript-eslint/no-unused-vars */
interface CreatePermission {
  body: {
    name: string;
    description: string;
    resource: string;
    action: "create" | "update" | "delete" | "get" | "get_all";
    status?: "active" | "inactive";
  };
}

/* eslint-disable @typescript-eslint/no-unused-vars */
interface GetPermissionList {
  query: {
    _id?: string;
    name?: string;
    description?: string;
    resource?: string;
    action?: "create" | "update" | "delete" | "get" | "get_all";
    status?: "active" | "inactive";
    sort?: string;
    limit?: number;
    page?: number;
  };
}

/* eslint-disable @typescript-eslint/no-unused-vars */
interface GetPermission {
  params: {
    permissionId: string;
  };
}

/* eslint-disable @typescript-eslint/no-unused-vars */
interface UpdatePermission {
  params: {
    permissionId: string;
  };
  body: {
    name?: string;
    description?: string;
    resource?: string;
    action?: "create" | "update" | "delete" | "get" | "get_all";
    status?: "active" | "inactive";
  };
}

/* eslint-disable @typescript-eslint/no-unused-vars */
interface DeletePermission {
  params: {
    permissionId: string;
  };
}

const createPermission = {
  body: Joi.object().keys({
    name: Joi.string().trim().required().uppercase().label("Name"),
    description: Joi.string().trim().required().label("Description"),
    resource: Joi.string().trim().required().label("Resource"),
    action: Joi.string()
      .trim()
      .required()
      .valid("create", "update", "delete", "get", "get_all")
      .label("Action"),
    status: Joi.string()
      .optional()
      .valid(statusConstants.ACTIVE, statusConstants.INACTIVE)
      .label("Status"),
  }),
};

const updatePermission = {
  params: Joi.object().keys({
    permissionId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim().uppercase().optional().label("Name"),
      description: Joi.string().trim().optional().label("Description"),
      resource: Joi.string().trim().optional().label("Resource"),
      action: Joi.string()
        .trim()
        .optional()
        .valid("create", "update", "delete", "get", "get_all")
        .label("Action"),
      status: Joi.string()
        .optional()
        .valid(statusConstants.ACTIVE, statusConstants.INACTIVE)
        .label("Status"),
    })
    .min(1),
};

const getPermissionList = {
  query: Joi.object().keys({
    _id: Joi.optional().custom(objectId).label("Id"),
    name: Joi.string().trim().uppercase().optional().label("Name"),
    description: Joi.string().trim().optional().label("Description"),
    resource: Joi.string().trim().optional().label("Resource"),
    action: Joi.string()
      .trim()
      .optional()
      .valid("create", "update", "delete", "get", "get_all")
      .label("Action"),
    status: Joi.string()
      .trim()
      .optional()
      .valid(statusConstants.ACTIVE, statusConstants.INACTIVE),
    sort: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getPermission = {
  params: Joi.object().keys({
    permissionId: Joi.string().trim().required().custom(objectId).label("Id"),
  }),
};

const deletePermission = {
  params: Joi.object().keys({
    permissionId: Joi.string().trim().required().custom(objectId).label("Id"),
  }),
};

export {
  createPermission,
  deletePermission,
  getPermission,
  getPermissionList,
  updatePermission,
};
