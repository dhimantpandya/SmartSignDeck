import Joi from "joi";
import { objectId, password, toLowerCase } from "./custom.validation";

/* eslint-disable @typescript-eslint/no-unused-vars */
interface CreateUserSchema {
  body: {
    email: string;
    password?: string;
    first_name: string;
    last_name: string;
    role?: string;
  };
}

/* eslint-disable @typescript-eslint/no-unused-vars */
interface GetUsersSchema {
  query: {
    first_name?: string;
    last_name?: string;
    role?: string;
    limit?: number;
    select?: string;
    populate?: string;
    sort?: string;
    skip?: number;
  };
}

/* eslint-disable @typescript-eslint/no-unused-vars */
interface GetUserSchema {
  params: {
    userId: string;
  };
}

/* eslint-disable @typescript-eslint/no-unused-vars */
interface UpdateUserSchema {
  params: {
    userId: string;
  };
  body: {
    email?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
  };
}

/* eslint-disable @typescript-eslint/no-unused-vars */
interface DeleteUserSchema {
  params: {
    userId: string;
  };
}

const createUser = {
  body: Joi.object().keys({
    email: Joi.string()
      .trim()
      .required()
      .email()
      .custom(toLowerCase)
      .label("Email"),
    password: Joi.string()
      .trim()
      .optional()
      .custom(password, "Password validator function")
      .label("Password"),
    first_name: Joi.string()
      .trim()
      .required()
      .min(2)
      .max(16)
      .label("First name"),
    last_name: Joi.string().trim().required().min(2).max(16).label("Last name"),
    role: Joi.string().trim().optional().label("Role"),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    first_name: Joi.string().trim().label("First name"),
    last_name: Joi.string().trim().label("Last name"),
    role: Joi.string().label("Role"),
    limit: Joi.number().integer().label("Limit"),
    search: Joi.string().trim().label("Search"),
    select: Joi.string().label("Select"),
    populate: Joi.string().label("Populate"),
    sort: Joi.string().label("Sort"),
    skip: Joi.number().integer().label("Skip"),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().trim().required().custom(objectId).label("Id"),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.string().trim().required().custom(objectId).label("Id"),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().trim().email().label("Email"),
      password: Joi.string().custom(password).label("Password"),
      first_name: Joi.string()
        .trim()
        .optional()
        .min(2)
        .max(16)
        .label("First name"),
      last_name: Joi.string()
        .trim()
        .optional()
        .min(2)
        .max(16)
        .label("Last name"),
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().trim().required().custom(objectId).label("Id"),
  }),
};

export { createUser, deleteUser, getUser, getUsers, updateUser };
