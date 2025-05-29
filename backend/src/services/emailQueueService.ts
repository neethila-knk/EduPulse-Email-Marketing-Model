import Bull from "bull";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { sendEmail, EmailData, prepareAttachments } from "./sendgridService";
import Campaign from "../models/Campaign";

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};

const emailQueue = new Bull("email-queue", {
  redis: redisConfig,
  limiter: {
    max: 50,
    duration: 1000,
  },
});

export interface EmailJob extends EmailData {
  campaignId: string;
  userId: string;
}

export const queueEmails = async (emails: EmailJob[]): Promise<void> => {
  try {
    if (!emails.length) {
      throw new Error("No emails to queue");
    }

    const campaignIds = [...new Set(emails.map((email) => email.campaignId))];

    for (const campaignId of campaignIds) {
      await Campaign.findByIdAndUpdate(campaignId, {
        status: "sending",
        updatedAt: new Date(),
      });
    }

    const jobs = emails.map((email) => ({
      data: email,
      opts: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: true,
      },
    }));

    await emailQueue.addBulk(jobs);

    console.log(
      `Queued ${emails.length} emails for ${campaignIds.length} campaigns`
    );
  } catch (error) {
    console.error("Error adding emails to queue:", error);
    throw error;
  }
};

emailQueue.process(async (job) => {
  const emailData: EmailJob = job.data;

  try {
    await sendEmail(emailData);

    return { success: true, to: emailData.to };
  } catch (error) {
    console.error(`Error processing email to ${emailData.to}:`, error);
    throw error;
  }
});

emailQueue.on("completed", async (job) => {});

emailQueue.on("failed", async (job, err) => {
  const emailData: EmailJob = job.data;
  console.error(
    `Failed to send email to ${emailData.to} for campaign ${emailData.campaignId}:`,
    err.message
  );

  const maxAttempts = job.opts?.attempts || 3;

  if (job.attemptsMade >= maxAttempts) {
    try {
      await Campaign.findByIdAndUpdate(emailData.campaignId, {
        $inc: { "metrics.bounces": 1 },
      });
    } catch (updateErr) {
      console.error(
        `Error updating bounce metrics for campaign ${emailData.campaignId}:`,
        updateErr
      );
    }
  }
});

emailQueue.on("drained", async () => {
  try {
    const pendingCampaigns = await Campaign.find({ status: "sending" });

    for (const campaign of pendingCampaigns) {
      const activeJobs = await emailQueue.getJobs([
        "active",
        "waiting",
        "delayed",
      ]);

      const campaignId = campaign._id as mongoose.Types.ObjectId;

      const campaignJobs = activeJobs.filter(
        (job) => job.data.campaignId === campaignId.toString()
      );

      if (campaignJobs.length === 0) {
        await Campaign.findByIdAndUpdate(campaignId, {
          status: "sent",
          sentAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  } catch (error) {
    console.error("Error updating campaign statuses after queue drain:", error);
  }
});

export { emailQueue };
export default emailQueue;
