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
    sourceType?: "local" | "playlist"; // New field: define source
    playlistId?: string; // New field: if source is playlist
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
  daysOfWeek?: number[]; // [0-6] 0=Sun
  startDate?: Date;
  endDate?: Date;
  priority?: number; // Higher overrides lower
  content: IScreenContent;
}



export interface IScreen extends Document {
  name: string;
  location?: string;
  templateId: mongoose.Schema.Types.ObjectId;
  defaultContent: IScreenContent;
  schedules: ISchedule[];
  companyId: mongoose.Schema.Types.ObjectId;
  createdBy: mongoose.Schema.Types.ObjectId;
  isPublic: boolean;
  secretKey?: string;
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
        daysOfWeek: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] },
        startDate: { type: Date },
        endDate: { type: Date },
        priority: { type: Number, default: 0 },
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
    secretKey: {
      type: String,
      unique: true,
      sparse: true,
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
