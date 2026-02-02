import mongoose from "mongoose";
import Permission from "../../src/models/permission.model";

interface PermissionData {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  resource: string;
  action: string;
  status: string;
}

const permissionOne: PermissionData = {
  _id: new mongoose.Types.ObjectId(),
  name: "PERMISSION-1",
  description: "Permission 1 Description",
  resource: "user",
  action: "create",
  status: "active",
};

const permissionTwo: PermissionData = {
  _id: new mongoose.Types.ObjectId(),
  name: "PERMISSION-2",
  description: "Permission 2 Description",
  resource: "user",
  action: "create",
  status: "active",
};

const permissionThree: PermissionData = {
  _id: new mongoose.Types.ObjectId(),
  name: "PERMISSION-3",
  description: "Permission 3 Description",
  resource: "user",
  action: "create",
  status: "inactive",
};

const insertPermissions = async (
  permissions: PermissionData[],
): Promise<void> => {
  await Permission.insertMany(permissions);
};

export { insertPermissions, permissionOne, permissionThree, permissionTwo };
