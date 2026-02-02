import mongoose, {
  Schema,
  type Document,
  type Model,
  type FilterQuery,
} from "mongoose";
import { tokenTypes } from "../config/tokens";
import { toJSON } from "./plugins";
import {
  type CustomPaginateOptions,
  type CustomPaginateResult,
} from "./plugins/paginate.plugin";

export interface IToken extends Document {
  jti: string;
  otp?: string | null;
  user: mongoose.Schema.Types.ObjectId;
  type: string;
  expires: Date;
  blacklisted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ITokenModel extends Model<IToken> {
  paginate: (
    filter: FilterQuery<IToken>,
    options: CustomPaginateOptions,
  ) => Promise<CustomPaginateResult<IToken>>;
}

const tokenSchema = new Schema<IToken, ITokenModel>(
  {
    jti: {
      type: String,
      required: true,
      index: true,
    },

    // Used ONLY for OTP-based flows (reset password / verify email)
    otp: {
      type: String,
      default: null,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        tokenTypes.REFRESH,
        tokenTypes.RESET_PASSWORD,
        tokenTypes.VERIFY_EMAIL,
        tokenTypes.ACCESS,
      ],
      required: true,
    },

    expires: {
      type: Date,
      required: true,
    },

    blacklisted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

// ✅ TTL INDEX — auto-delete expired OTP tokens
// MongoDB will remove documents automatically after `expires`
tokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

// Convert mongoose objects to JSON cleanly
tokenSchema.plugin(toJSON);

const Token = mongoose.model<IToken, ITokenModel>("Token", tokenSchema);

export default Token;
