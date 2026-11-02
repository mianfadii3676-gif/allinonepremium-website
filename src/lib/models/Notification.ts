import mongoose, { Schema, Model } from "mongoose";
import { INotification, NotificationType } from "@/types";

const NotificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: [true, "Notification type is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
    },
    relatedModel: {
      type: String,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

NotificationSchema.index({ isRead: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
