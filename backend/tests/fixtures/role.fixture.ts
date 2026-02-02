import mongoose, { type Types } from "mongoose";
import { Role } from "../../src/models";

export interface Permission {
  _id: Types.ObjectId;
  name: string;
  description: string;
  resource: string;
  action: string;
  status: string;
}

const defaultPermissions: Permission[] = [
  {
    _id: new mongoose.Types.ObjectId("649d1965a463deeed0fa45a0"),
    name: "create user",
    description: "can create the new user",
    resource: "User",
    action: "create",
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("649d1965a463deeed0fa45a1"),
    name: "update user",
    description: "can update user",
    resource: "User",
    action: "update",
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("649d1965a463deeed0fa45a2"),
    name: "get user",
    description: "can get the user details",
    resource: "User",
    action: "get",
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("649d1965a463deeed0fa45a3"),
    name: "get all users",
    description: "can get the list of the all users",
    resource: "User",
    action: "get_all",
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("649d1965a463deeed0fa45a4"),
    name: "delete user",
    description: "delete user",
    resource: "User",
    action: "delete",
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("65fae0ffaa579c75aa2dae33"),
    name: "create role",
    description: "can create the new role",
    resource: "Role",
    action: "create",
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("65fae10651173a639a00c4f0"),
    name: "update role",
    description: "can update role",
    resource: "Role",
    action: "update",
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("65fae10b0b6318591904209d"),
    name: "get role",
    description: "can get the role details",
    resource: "Role",
    action: "get",
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("65fae10fc7e0fa2079cd6112"),
    name: "get all roles",
    description: "can get the list of the all roles",
    resource: "Role",
    action: "get_all",
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("65fae113f7497078d4cba718"),
    name: "delete role",
    description: "delete role",
    resource: "Role",
    action: "delete",
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("649d1965a463deeed0fb45a0"),
    name: "create todo",
    description: "can create the new todo",
    resource: "Todo",
    action: "create",
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("649d1965a463deeed0fb45a1"),
    name: "update todo",
    description: "can update todo",
    resource: "Todo",
    action: "update",
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("649d1965a463deeed0fb45a2"),
    name: "get todo",
    description: "can get the todo details",
    resource: "Todo",
    action: "get",
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("649d1965a463deeed0fb45a3"),
    name: "get all todos",
    description: "can get the list of the all todos",
    resource: "Todo",
    action: "get_all",
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("649d1965a463deeed0fb45a4"),
    name: "delete todo",
    description: "delete todo",
    resource: "Todo",
    action: "delete",
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("33e58810ac3736fad6b153e3"),
    name: "create permission",
    description: "can create permission",
    resource: "Permission",
    action: "create",
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("5b4b3bd130e6fa0df44591d0"),
    name: "update permission",
    description: "can update permission",
    resource: "Permission",
    action: "update",
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("e802b8f3142593c5ad7355a3"),
    name: "get permission",
    description: "can get permission",
    resource: "Permission",
    action: "get",
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("32ef5e30b691fd1479bb263e"),
    name: "get_all permission",
    description: "can get_all permission",
    resource: "Permission",
    action: "get_all",
    status: "active",
  },
  {
    _id: new mongoose.Types.ObjectId("2c5d73b4d8a7dd042646ca14"),
    name: "delete permission",
    description: "can delete permission",
    resource: "Permission",
    action: "delete",
    status: "active",
  }, // ADD_NEW_PERMISSION_OBJECTS
];

export interface UserRole {
  _id: Types.ObjectId;
  name: string;
  description: string;
  permissions: Types.ObjectId[];
  status: string;
}

const roleOne: UserRole = {
  _id: new mongoose.Types.ObjectId("649d18a0efe4a5ff050c0869"),
  name: "ROLE-1",
  description: "ROLE-1 description",
  permissions: [
    new mongoose.Types.ObjectId("649d1965a463deeed0fa45a2"),
    new mongoose.Types.ObjectId("649d1965a463deeed0fa45a1"),
  ],
  status: "active",
};

const roleTwo: UserRole = {
  _id: new mongoose.Types.ObjectId("649d18a0efe4a5ff050c0870"),
  name: "ROLE-2",
  description: "ROLE-2 description",
  permissions: [
    new mongoose.Types.ObjectId("649d1965a463deeed0fa45a2"),
    new mongoose.Types.ObjectId("649d1965a463deeed0fa45a1"),
  ],
  status: "active",
};

const roleThree: UserRole = {
  _id: new mongoose.Types.ObjectId("649d18a0efe4a5ff050c0871"),
  name: "ROLE-3",
  description: "ROLE-3 description",
  permissions: [
    new mongoose.Types.ObjectId("649d1965a463deeed0fa45a2"),
    new mongoose.Types.ObjectId("649d1965a463deeed0fa45a1"),
  ],
  status: "inactive",
};

const userRole: UserRole = {
  _id: new mongoose.Types.ObjectId("649d18a0efe4a5fe050c0869"),
  name: "user",
  description: "user of the whole system",
  permissions: [
    new mongoose.Types.ObjectId("649d1965a463deeed0fa45a2"),
    new mongoose.Types.ObjectId("649d1965a463deeed0fa45a1"),
    new mongoose.Types.ObjectId("649d1965a463deeed0fb45a0"),
    new mongoose.Types.ObjectId("649d1965a463deeed0fb45a1"),
    new mongoose.Types.ObjectId("649d1965a463deeed0fb45a2"),
    new mongoose.Types.ObjectId("649d1965a463deeed0fb45a3"),
    new mongoose.Types.ObjectId("649d1965a463deeed0fa45a4"),
    new mongoose.Types.ObjectId("649d1965a463deeed0fb45a4"),
    new mongoose.Types.ObjectId("659532f24d77305e954d71b5"),
    new mongoose.Types.ObjectId("659532f880991cabd413743f"),
    new mongoose.Types.ObjectId("659532fca81b18d63875ef4a"),
    new mongoose.Types.ObjectId("659532ffd9a9c2d82bc12c7e"),
    new mongoose.Types.ObjectId("659533034c75d93cba864737"),
    new mongoose.Types.ObjectId("33e58810ac3736fad6b153e3"),
    new mongoose.Types.ObjectId("5b4b3bd130e6fa0df44591d0"),
    new mongoose.Types.ObjectId("e802b8f3142593c5ad7355a3"),
    new mongoose.Types.ObjectId("32ef5e30b691fd1479bb263e"),
    new mongoose.Types.ObjectId("2c5d73b4d8a7dd042646ca14"), // ADD_NEW_PERMISSION_IDS
  ],
  status: "active",
};

const adminRole: UserRole = {
  _id: new mongoose.Types.ObjectId("649d18a0efe4a5fe050c0870"),
  name: "admin",
  description: "admin of the whole system",
  permissions: defaultPermissions.map((permission) => permission._id),
  status: "active",
};

const defaultRoles: UserRole[] = [userRole, adminRole];

const insertRoles = async (roles: UserRole[]): Promise<void> => {
  await Role.insertMany(
    roles.map((role) => ({
      ...role,
      permissions:
        role.name === "admin" ? defaultPermissions : role.permissions,
    })),
  );
};

export {
  adminRole,
  defaultPermissions,
  defaultRoles,
  insertRoles,
  roleOne,
  roleThree,
  roleTwo,
  userRole,
};
