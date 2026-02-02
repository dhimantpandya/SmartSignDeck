import mongoose, {
  Schema,
  type Document,
  type FilterQuery,
  type Model,
} from "mongoose";
import { statusConstants } from "../utils/constants/constants";
import { permissionActions } from "../utils/constants/permission.constants";
import { paginate, toJSON } from "./plugins";
import {
  type CustomPaginateOptions,
  type CustomPaginateResult,
} from "./plugins/paginate.plugin";

export interface IPermission extends Document {
  name: string;
  description: string;
  resource: string;
  action: string;
  status: "active" | "inactive";
  created_at: Date;
  updated_at: Date;
}

interface IPermissionModel extends Model<IPermission> {
  isNameTaken: (
    name: string,
    excludePermissionId?: mongoose.Types.ObjectId,
  ) => Promise<boolean>;
  paginate: (
    filter: FilterQuery<IPermission>,
    options: CustomPaginateOptions,
  ) => Promise<CustomPaginateResult<IPermission>>; // Ensure this matches your plugin's signature
}

const permissionSchema = new Schema<IPermission, IPermissionModel>(
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
    resource: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(permissionActions),
      required: true,
    },
    status: {
      type: String,
      enum: [statusConstants.ACTIVE, statusConstants.INACTIVE],
      default: statusConstants.ACTIVE,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

permissionSchema.statics.isNameTaken = async function (
  name: string,
  excludePermissionId?: mongoose.Types.ObjectId,
): Promise<boolean> {
  const permission = await this.findOne({
    name,
    _id: { $ne: excludePermissionId },
  });
  return !(permission == null);
};

permissionSchema.plugin(toJSON);
permissionSchema.plugin(paginate);

const Permission = mongoose.model<IPermission, IPermissionModel>(
  "Permission",
  permissionSchema,
);
export default Permission;
