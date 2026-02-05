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

export interface IZone {
  id: string;
  type: "video" | "image" | "text" | "mixed";
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
  media?: any[];
  mediaType?: "image" | "video" | "both";
  lockedMediaType?: "image" | "video" | "both" | null;
}

export interface ITemplate extends Document {
  name: string;
  resolution: string;
  zones: IZone[];
  companyId: mongoose.Schema.Types.ObjectId;
  createdBy: mongoose.Schema.Types.ObjectId;
  isPublic: boolean;
  isActive: boolean;
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

const zoneSchema = new Schema<IZone>({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ["video", "image", "text", "mixed"],
    required: true,
  },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  name: { type: String },
  media: { type: Array, default: [] },
  mediaType: {
    type: String,
    enum: ["image", "video", "both"],
    default: "both",
  },
  lockedMediaType: {
    type: String,
    enum: ["image", "video", "both", null],
    default: null,
  },
});

const templateSchema = new Schema<ITemplate, ITemplateModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    resolution: {
      type: String,
      required: true,
      default: "1920x1080",
    },
    zones: [zoneSchema],
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
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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
