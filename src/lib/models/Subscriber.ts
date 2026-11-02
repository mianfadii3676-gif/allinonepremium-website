import mongoose, { Schema, Model } from "mongoose";

export interface ISubscriber {
  email: string;
  status: "subscribed" | "unsubscribed";
  unsubscribeToken: string;
  consentAt: Date;
  unsubscribedAt?: Date;
  source?: string;
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    status: { type: String, enum: ["subscribed", "unsubscribed"], default: "subscribed", index: true },
    unsubscribeToken: { type: String, required: true, unique: true },
    consentAt: { type: Date, required: true },
    unsubscribedAt: { type: Date },
    source: { type: String, default: "homepage" },
  },
  { timestamps: true }
);

const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber || mongoose.model<ISubscriber>("Subscriber", SubscriberSchema);

export default Subscriber;
