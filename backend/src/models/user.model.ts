import bcrypt from "bcryptjs";
import mongoose, { Schema, type Document, type FilterQuery } from "mongoose";
import validator from "validator";
import { BCRYPT_SALT_ROUNDS } from "../utils/constants/user.constants";
import { paginate, toJSON } from "./plugins";
import {
  type CustomPaginateOptions,
  type CustomPaginateResult,
} from "./plugins/paginate.plugin";

export type RoleType = "user" | "admin" | "super_admin" | "advertiser";

export interface IUser extends Document {
  first_name: string;
  last_name: string;
  email: string;
  companyId?: mongoose.Schema.Types.ObjectId;
  companyName?: string;
  googleId?: string;
  authProvider: "local" | "google";
  password: string;
  role: RoleType;
  avatar?: string;
  gender?: string;
  dob?: Date;
  language?: string;
  is_email_verified: boolean;
  onboardingCompleted: boolean;
  isPasswordMatch: (password: string) => Promise<boolean>;
}

export interface IUserModel extends mongoose.Model<IUser> {
  isEmailTaken: (
    email: string,
    excludeUserId?: mongoose.Types.ObjectId,
  ) => Promise<boolean>;
  paginate: (
    filter: FilterQuery<IUser>,
    options: CustomPaginateOptions,
  ) => Promise<CustomPaginateResult<IUser>>;
}

const userSchema = new Schema<IUser, IUserModel>(
  {
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: false, trim: true, default: '' },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value: string) {
        if (!validator.isEmail(value)) throw new Error("Invalid email");
      },
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      index: true,
    },
    companyName: {
      type: String,
      trim: true
    },
    googleId: { type: String, unique: true, sparse: true }, // <-- added googleId
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
      required: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      }, // <-- conditional required
      trim: true,
      minlength: 8,
      validate(value: string) {
        if (!/\d/.test(value) || !/[a-zA-Z]/.test(value)) {
          throw new Error(
            "Password must contain at least one letter and one number",
          );
        }
      },
      private: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "super_admin", "advertiser"],
      default: "user",
      required: true,
      index: true,
    },
    avatar: { type: String },
    gender: { type: String, enum: ["male", "female", "other"] },
    dob: { type: Date },
    language: { type: String, enum: ["english", "french", "germen"] },
    is_email_verified: { type: Boolean, default: false },
    onboardingCompleted: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

// plugins
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

// Check if email is already taken
userSchema.statics.isEmailTaken = async function (
  email: string,
  excludeUserId?: mongoose.Types.ObjectId,
) {
  const query: { email: string; _id?: { $ne: mongoose.Types.ObjectId } } = {
    email,
  };
  if (excludeUserId) query._id = { $ne: excludeUserId };
  const user = await this.findOne(query);
  return !!user;
};

// Check password match
userSchema.methods.isPasswordMatch = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS);
  }
  next();
});

const User = mongoose.model<IUser, IUserModel>("User", userSchema);

export default User;
