import mongoose, { Schema, Document } from "mongoose";

export interface IActivity extends Document {
  userId?: mongoose.Types.ObjectId;
  adminId?: mongoose.Types.ObjectId;
  action: string;
  description?: string;
  resourceType?: string;
  resourceId?: mongoose.Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const ActivitySchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: "Admin",
  },
  action: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  resourceType: {
    type: String,
    trim: true,
  },
  resourceId: {
    type: Schema.Types.ObjectId,
  },
  ipAddress: {
    type: String,
    trim: true,
  },
  userAgent: {
    type: String,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
});


ActivitySchema.index({ userId: 1, timestamp: -1 });
ActivitySchema.index({ adminId: 1, timestamp: -1 });
ActivitySchema.index({ resourceType: 1, resourceId: 1 });
ActivitySchema.index({ timestamp: -1 });


ActivitySchema.statics.logActivity = async function (activityData: Partial<IActivity>) {
  try {
    const activity = new this(activityData);
    return await activity.save();
  } catch (error) {
    console.error("Error logging activity:", error);
  
    return null;
  }
};

const Activity = mongoose.model<IActivity>("Activity", ActivitySchema);
export default Activity;