import mongoose, { Schema, Model } from "mongoose";
import { AdminRole, IAdminUser } from "@/types";

const AdminUserSchema = new Schema<IAdminUser>(
  {
    username: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9._-]{3,32}$/, "Username may use letters, numbers, dots, dashes and underscores (3–32 characters)"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(AdminRole),
      default: AdminRole.ADMIN,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        delete ret.password;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

AdminUserSchema.index({ role: 1 });
AdminUserSchema.index({ username: 1 }, { unique: true, sparse: true });

const AdminUser: Model<IAdminUser> =
  mongoose.models.AdminUser || mongoose.model<IAdminUser>("AdminUser", AdminUserSchema);

export default AdminUser;
