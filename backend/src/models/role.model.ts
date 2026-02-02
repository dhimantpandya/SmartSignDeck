import mongoose, {
  type Document,
  type Model,
  Schema,
  type FilterQuery,
} from "mongoose";
import { paginate, toJSON } from "./plugins";
import {
  type CustomPaginateOptions,
  type CustomPaginateResult,
} from "./plugins/paginate.plugin";
import { type IPermission } from "./permission.model";
import { statusConstants } from "../utils/constants/constants";

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: mongoose.Schema.Types.ObjectId[];
  status: "active" | "inactive";
  created_at: Date;
  updated_at: Date;
}

export interface IRolePermissions extends Document {
  name: string;
  description: string;
  permissions: IPermission[];
  status: "active" | "inactive";
  created_at: Date;
  updated_at: Date;
}

export interface IRoleModel extends Model<IRole> {
  isNameTaken: (
    name: string,
    excludeUserId?: mongoose.Types.ObjectId,
  ) => Promise<boolean>;
  paginate: (
    filter: FilterQuery<IRole>,
    options: CustomPaginateOptions,
  ) => Promise<CustomPaginateResult<IRole>>; // Ensure this matches your plugin's signature
}

const roleSchema = new Schema<IRole, IRoleModel>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],
    status: {
      type: String,
      enum: [statusConstants.ACTIVE, statusConstants.INACTIVE],
      default: statusConstants.ACTIVE,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

/**
 * Check if role name is taken
 * @param {string} name - The role name
 * @param {ObjectId} [excludeRoleId] - The id of the role to be excluded
 * @returns {Promise<boolean>}
 */
roleSchema.statics.isNameTaken = async function (
  name: string,
  excludeRoleId?: mongoose.Types.ObjectId,
): Promise<boolean> {
  const role = await this.findOne({ name, _id: { $ne: excludeRoleId } });
  return !(role == null);
};

// add plugin that converts mongoose to json
roleSchema.plugin(toJSON);
roleSchema.plugin(paginate);

const Role = mongoose.model<IRole, IRoleModel>("Role", roleSchema);
export default Role;
