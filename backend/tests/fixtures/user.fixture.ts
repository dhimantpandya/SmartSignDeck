import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import mongoose, { type Types } from "mongoose";
import logger from "../../src/config/logger";
import { Permission, Role } from "../../src/models";
import User from "../../src/models/user.model";
import {
  adminRole,
  defaultPermissions,
  defaultRoles,
  userRole,
} from "./role.fixture";
import { insertAccessTokens } from "./token.fixture";

import { userOne, userTwo, admin } from "./user.data";

const password: string = "password1";
const salt: string = bcrypt.genSaltSync(8);
const hashedPassword: string = bcrypt.hashSync(password, salt);

const insertUsers = async (users: any[]): Promise<void> => {
  try {
    await Role.insertMany(defaultRoles);
    await Permission.insertMany(defaultPermissions);
  } catch (err) {
    // eslint-disable-line
    // Some code
    logger.error(
      "IGNORE:: Something went wrong while inserting the default roles",
    );
  }

  const usersList = users.map((user) => {
    return {
      ...user,
      password: hashedPassword,
    };
  });
  await insertAccessTokens();
  await User.insertMany(usersList);
};

export { admin, insertUsers, userOne, userTwo };
