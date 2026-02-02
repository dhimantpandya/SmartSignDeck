import Joi from "joi";
import { objectId } from "./custom.validation";
import { statusConstants } from "../utils/constants/constants";

/* eslint-disable @typescript-eslint/no-unused-vars */
interface CreateRole {
  body: {
    name: string;
    description: string;
    permissions: string[];
    status?: "active" | "inactive";
  };
}

/* eslint-disable @typescript-eslint/no-unused-vars */
interface GetRoleList {
  query: {
    _id?: string;
    name?: string;
    description?: string;
    status?: "active" | "inactive";
    populate?: string;
    sort?: string;
    limit?: number;
    page?: number;
  };
}

/* eslint-disable @typescript-eslint/no-unused-vars */
interface GetRole {
  params: {
    roleId: string;
  };
}

/* eslint-disable @typescript-eslint/no-unused-vars */
interface UpdateRole {
  params: {
    roleId: string;
  };
  body: {
    name?: string;
    description?: string;
    permissions: string[];
    status?: "active" | "inactive";
  };
}

/* eslint-disable @typescript-eslint/no-unused-vars */
interface DeleteRole {
  params: {
    roleId: string;
  };
}

const createRole = {
  body: Joi.object().keys({
    name: Joi.string().trim().uppercase().required().label("Role name"),
    description: Joi.string().trim().required().label("Description"),
    permissions: Joi.array()
      .items(Joi.string().trim().custom(objectId))
      .default([])
      .label("Permissions"),
    status: Joi.string()
      .optional()
      .valid(statusConstants.ACTIVE, statusConstants.INACTIVE)
      .label("Status"),
  }),
};

const getRoleList = {
  query: Joi.object().keys({
    _id: Joi.optional().custom(objectId),
    name: Joi.string().trim().uppercase().optional().label("Name"),
    description: Joi.string().trim().optional().label("Description"),
    status: Joi.string()
      .trim()
      .optional()
      .valid(statusConstants.ACTIVE, statusConstants.INACTIVE)
      .label("Status"),
    populate: Joi.string().optional().label("Populate"),
    sort: Joi.string().label("Sort"),
    limit: Joi.number().integer().label("Limit"),
    page: Joi.number().integer().label("Page"),
  }),
};

const getRole = {
  params: Joi.object().keys({
    roleId: Joi.string().trim().required().custom(objectId).label("Id"),
  }),
};

const updateRole = {
  params: Joi.object().keys({
    roleId: Joi.string().trim().required().custom(objectId).label("Id"),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim().uppercase().optional().label("Role name"),
      description: Joi.string()
        .trim()
        .uppercase()
        .optional()
        .label("Description"),
      permissions: Joi.array()
        .items(Joi.string().custom(objectId))
        .optional()
        .label("Permissions"),
      status: Joi.string()
        .optional()
        .valid(statusConstants.ACTIVE, statusConstants.INACTIVE)
        .label("Status"),
    })
    .min(1),
};

const deleteRole = {
  params: Joi.object().keys({
    roleId: Joi.string().trim().required().custom(objectId).label("Id"),
  }),
};

export { createRole, deleteRole, getRole, getRoleList, updateRole };
