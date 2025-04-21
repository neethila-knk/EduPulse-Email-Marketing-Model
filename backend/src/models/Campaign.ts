// models/Campaign.ts

import mongoose, { Document, Schema } from "mongoose";

export interface ICampaign extends Document {
  userId: mongoose.Types.ObjectId;
  campaignName: string;
  subject: string;
  fromEmail: string;
  clusterId: mongoose.Types.ObjectId;
  clusterName?: string;
  recipientCount: number;
  htmlContent?: string;
  plainBody: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  scheduledFor?: Date;
  sentAt?: Date;
  attachments?: string[];
  metrics?: {
    opens: number;
    clicks: number;
    bounces: number;
    unsubscribes: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    campaignName: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    fromEmail: {
      type: String,
      required: true,
      trim: true,
    },
    clusterId: {
      type: Schema.Types.ObjectId,
      ref: "Cluster",
      required: true,
    },
    clusterName: {
      type: String,
      trim: true,
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    htmlContent: {
      type: String,
    },
    plainBody: {
      type: String,
      required: true,
    },
    status: {
        type: String,
        enum: ["draft", "scheduled", "sending", "sent", "failed", "completed", "cancelled", "ongoing"],
        default: "draft",
    },
    scheduledFor: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    attachments: [String],
    metrics: {
      opens: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      bounces: { type: Number, default: 0 },
      unsubscribes: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICampaign>("Campaign", CampaignSchema);