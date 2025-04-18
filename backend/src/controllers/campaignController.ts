import { Request, Response } from "express";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";
import Campaign from "../models/Campaign";
import { queueEmails, EmailJob } from "../services/emailQueueService";
import { prepareAttachments } from "../services/sendgridService";
import { calculateCampaignMetrics } from "../services/trackingService";
import mongoose from "mongoose";
import Notification from "../models/Notification";

// Add type extension for Request
declare global {
  namespace Express {
    interface User {
      _id: string;
      email: string;
      isActive: boolean;
      username?: string;
      // Add other user properties as needed
    }
  }
}

dotenv.config();
const mongoUri = process.env.MONGO_URI!;
const client = new MongoClient(mongoUri);
const db = client.db("edudb");
const campaignCollection = db.collection("campaigns");
const clusterCollection = db.collection("clusters");

// Configure storage for attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/campaign-attachments");

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

export const upload = multer({ storage });

// Create a new campaign
export const createCampaign = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      campaignName,
      subject,
      fromEmail,
      clusterId,
      htmlContent,
      plainBody,
    } = req.body;

    // Check if user exists
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Get the user ID from the authenticated user
    const userId = new ObjectId(req.user._id);

    // Find the cluster to get the emails and name
    let recipientEmails: string[] = [];
    let clusterName = "";

    if (clusterId) {
      try {
        const objectId = new ObjectId(clusterId);
        const cluster = await clusterCollection.findOne({
          _id: objectId,
          status: "active",
        });

        if (cluster) {
          recipientEmails = cluster.emails || [];
          clusterName = cluster.name || "";
        } else {
          res.status(404).json({ error: "Cluster not found or not active" });
          return;
        }
      } catch (err) {
        console.error("Error retrieving cluster emails:", err);
        res.status(400).json({ error: "Invalid cluster ID" });
        return;
      }
    } else {
      res.status(400).json({ error: "No cluster ID provided" });
      return;
    }

    // Handle file attachments (if any)
    let attachmentPaths: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      attachmentPaths = (req.files as Express.Multer.File[]).map(
        (file: Express.Multer.File) => file.path
      );
    }

    // Create the campaign document
    const campaign = {
      userId,
      campaignName,
      subject,
      fromEmail,
      clusterId: new ObjectId(clusterId),
      clusterName,
      recipientCount: recipientEmails.length,
      htmlContent,
      plainBody,
      status: "ongoing", // Initial status
      attachments: attachmentPaths,
      createdAt: new Date(),
      updatedAt: new Date(),
      metrics: {
        opens: 0,
        clicks: 0,
        bounces: 0,
        unsubscribes: 0,
      },
    };

    // Insert into campaigns collection using Mongoose
    const newCampaign = new Campaign(campaign);
    await newCampaign.save();
    const campaignId = (newCampaign._id as mongoose.Types.ObjectId).toString();
    // Prepare email attachments for SendGrid
    const preparedAttachments = prepareAttachments(attachmentPaths);

    // Prepare email jobs for the queue
    // Use a verified sender if available from environment
    const verifiedSender = process.env.SENDGRID_VERIFIED_SENDER;

    // Prepare email jobs for the queue
    const emailJobs = recipientEmails.map((email) => ({
      to: email,
      from: verifiedSender || fromEmail,
      subject,
      text: plainBody,
      html: htmlContent || undefined,
      attachments: preparedAttachments,
      campaignId,
      userId: userId.toString(),
      customArgs: {
        campaignId,
      },
    }));

    // Log email sending details
    console.log(
      `Preparing to send ${emailJobs.length} emails for campaign ${campaignId}`
    );
    console.log(
      `Using sender: ${verifiedSender || fromEmail} (verified sender: ${
        verifiedSender ? "Yes" : "No"
      })`
    );

    // Queue emails for sending
    await queueEmails(emailJobs as EmailJob[]);

    // Return success response
    res.status(201).json({
      message: "Campaign created successfully. Emails are being sent.",
      campaignId,
      recipientCount: recipientEmails.length,
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ error: "Failed to create campaign" });
  }
};

// Get all campaigns for the current user
export const getUserCampaigns = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = new ObjectId(req.user._id);

    // Use Mongoose to find campaigns
    const campaigns = await Campaign.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
};

// Get a single campaign by ID with analytics
export const getCampaignById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const campaignId = new ObjectId(req.params.id);
    const userId = new ObjectId(req.user._id);

    // Find the campaign using Mongoose
    const campaign = await Campaign.findOne({
      _id: campaignId,
      userId,
    }).lean();

    if (!campaign) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }

    // Calculate additional metrics for display
    const calculatedMetrics = calculateCampaignMetrics(campaign);

    // Enhance response with calculated metrics
    const enhancedCampaign = {
      ...campaign,
      calculatedMetrics,
    };

    res.json(enhancedCampaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
};

// Update campaign status
// Update campaign status with notification creation
export const updateCampaignStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const campaignId = new ObjectId(req.params.id);
    const userId = new ObjectId(req.user._id);
    const { status } = req.body;

    // Validate status
    if (
      ![
        "draft",
        "ongoing",
        "sending",
        "sent",
        "failed",
        "cancelled",
        "completed",
      ].includes(status)
    ) {
      res.status(400).json({ error: "Invalid status value" });
      return;
    }

    // Find the campaign first to get the old status for notification
    const campaign = await Campaign.findOne({
      _id: campaignId,
      userId,
    });

    if (!campaign) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }

    // Store the old status for notification
    const oldStatus = campaign.status;

    // Update using Mongoose
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Add sentAt date if status is now 'sent'
    if (status === "sent" || status === "completed") {
      updateData.sentAt = new Date();
    }

    const result = await Campaign.findOneAndUpdate(
      { _id: campaignId, userId },
      { $set: updateData },
      { new: true }
    );

    if (!result) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }

    // Now create a notification for the status change
    if (oldStatus !== status) {
      console.log(`Creating notification for status change: ${oldStatus} -> ${status}`);
      
      try {
        // Import Notification model at the top of your file
        // import Notification from "../models/Notification";
        
        // Create notification message based on status
        let title = 'Campaign Status Updated';
        let message = `Your campaign "${campaign.campaignName || 'Unnamed Campaign'}" status changed from ${oldStatus} to ${status}.`;

        
        // Customize message for specific statuses
        if (status === 'completed') {
          title = 'Campaign Completed';
          message = `Your campaign "${campaign.campaignName || 'Unnamed Campaign'}" has been successfully completed.`;
        } else if (status === 'ongoing') {
          title = 'Campaign In Progress';
          message = `Your campaign "${campaign.campaignName || 'Unnamed Campaign'}" is now in progress.`;
        } else if (status === 'canceled' || status === 'cancelled') {
          title = 'Campaign Canceled';
          message = `Your campaign "${campaign.campaignName || 'Unnamed Campaign'}" has been canceled.`;
        }
        
        // Create and save the notification
        const notification = new Notification({
          userId,
          title,
          message,
          type: 'campaign',
          link: `/campaigns/${campaignId}`,
          read: false,
          createdAt: new Date()
        });
        
        await notification.save();
        console.log('Notification created successfully:', notification._id);
      } catch (notifError) {
        // Log but don't fail the request if notification creation fails
        console.error('Error creating notification:', notifError);
      }
    }

    res.json({
      message: "Campaign status updated successfully",
      campaign: result,
    });
  } catch (error) {
    console.error("Error updating campaign status:", error);
    res.status(500).json({ error: "Failed to update campaign status" });
  }
};

// Delete a campaign
export const deleteCampaign = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const campaignId = new ObjectId(req.params.id);
    const userId = new ObjectId(req.user._id);

    // Find campaign first to get attachment paths
    const campaign = await Campaign.findOne({
      _id: campaignId,
      userId,
    });

    if (!campaign) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }

    // Check if campaign is already sent - optionally prevent deletion
    if (campaign.status === "sent" || campaign.status === "sending") {
      res.status(400).json({
        error:
          "Cannot delete a campaign that has already been sent or is in progress",
      });
      return;
    }

    // Delete any associated attachments
    if (campaign.attachments && campaign.attachments.length > 0) {
      campaign.attachments.forEach((attachment: string) => {
        try {
          if (fs.existsSync(attachment)) {
            fs.unlinkSync(attachment);
          }
        } catch (err) {
          console.error("Error deleting attachment:", err);
        }
      });
    }

    // Delete the campaign using Mongoose
    await Campaign.deleteOne({ _id: campaignId });

    res.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({ error: "Failed to delete campaign" });
  }
};


