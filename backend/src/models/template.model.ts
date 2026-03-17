import mongoose, {
  Schema,
  type Document,
  type Model,
  type FilterQuery,
} from "mongoose";
import { paginate, toJSON } from "./plugins";
import {
  type CustomPaginateOptions,
  type CustomPaginateResult,
} from "./plugins/paginate.plugin";

export interface Zone {
  id: string;
  name: string;
  type: "video" | "image" | "text" | "mixed";
  x: number;
  y: number;
  width: number;
  height: number;
  media: any[];
  mediaType?: 'image' | 'video' | 'both';
  lockedMediaType?: 'image' | 'video' | 'both' | null;
}

export interface ITemplate extends Document {
  name: string;
  resolution: string;
  zones: Zone[];
  companyId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  collaborators: mongoose.Types.ObjectId[];
  isPublic: boolean;
  visibility: "private" | "company" | "public" | "global";
  lastModifiedBy?: mongoose.Types.ObjectId;
  previewUrl?: string;
  previewType?: "image" | "video";
  created_at: Date;
  updated_at: Date;
  deletedAt?: Date | null;
}

export interface ITemplateModel extends Model<ITemplate> {
  paginate: (
    filter: FilterQuery<ITemplate>,
    options: CustomPaginateOptions,
  ) => Promise<CustomPaginateResult<ITemplate>>;
}

const templateSchema = new Schema<ITemplate, ITemplateModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    resolution: {
      type: String,
      required: true,
      trim: true,
    },
    zones: {
      type: Schema.Types.Mixed,
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collaborators: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    visibility: {
      type: String,
      enum: ["private", "company", "public", "global"],
      default: "private",
      index: true,
    },
    previewUrl: {
      type: String,
      trim: true,
    },
    previewType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

// add plugin that converts mongoose to json
templateSchema.plugin(toJSON);
templateSchema.plugin(paginate);

const Template = mongoose.model<ITemplate, ITemplateModel>(
  "Template",
  templateSchema,
);

export default Template;
