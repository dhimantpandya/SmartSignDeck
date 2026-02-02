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

export type IScreenContent = Record<
  string,
  {
    type: "video" | "image" | "text" | "mixed";
    playlist: Array<{
      url: string;
      duration: number;
      type: "video" | "image";
    }>;
  }
>;

export interface ISchedule {
  name: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  content: IScreenContent;
}

export interface IAudienceRule {
  ageRange?: string;
  gender?: string;
  content: IScreenContent;
}

export interface ITriggerRule {
  type: "weather" | "api" | "daypart";
  condition: string;
  content: IScreenContent;
}

export interface IScreen extends Document {
  name: string;
  location?: string;
  templateId: mongoose.Schema.Types.ObjectId;
  defaultContent: IScreenContent;
  schedules: ISchedule[];
  audienceRules: IAudienceRule[];
  triggerRules: ITriggerRule[];
  companyId: mongoose.Schema.Types.ObjectId;
  createdBy: mongoose.Schema.Types.ObjectId;
  isPublic: boolean;
  status: "online" | "offline" | "syncing";
  lastPing: Date;
  created_at: Date;
  updated_at: Date;
  deletedAt?: Date | null;
}

export interface IScreenModel extends Model<IScreen> {
  paginate: (
    filter: FilterQuery<IScreen>,
    options: CustomPaginateOptions,
  ) => Promise<CustomPaginateResult<IScreen>>;
}

const screenSchema = new Schema<IScreen, IScreenModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      index: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "Template",
      required: true,
      index: true,
    },
    defaultContent: {
      type: Schema.Types.Mixed,
      default: {},
    },
    schedules: [
      {
        name: { type: String, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        content: { type: Schema.Types.Mixed, required: true },
      },
    ],
    audienceRules: [
      {
        ageRange: String,
        gender: String,
        content: { type: Schema.Types.Mixed, required: true },
      },
    ],
    triggerRules: [
      {
        type: { type: String, enum: ["weather", "api", "daypart"], required: true },
        condition: { type: String, required: true },
        content: { type: Schema.Types.Mixed, required: true },
      },
    ],
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
    status: {
      type: String,
      enum: ["online", "offline", "syncing"],
      default: "offline",
      index: true,
    },
    lastPing: {
      type: Date,
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

screenSchema.index({ name: 1 });
screenSchema.index({ location: 1 });
screenSchema.index({ status: 1, lastPing: -1 });

// add plugin that converts mongoose to json
screenSchema.plugin(toJSON);
screenSchema.plugin(paginate);

const Screen = mongoose.model<IScreen, IScreenModel>("Screen", screenSchema);
export default Screen;
