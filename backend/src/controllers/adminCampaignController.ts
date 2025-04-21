import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import Campaign from "../models/Campaign";
import User from "../models/User";
import { calculateCampaignMetrics } from "../services/trackingService";
import { getAdminCampaignMetrics, generateCampaignReport } from "../services/adminTrackingService";
import fs from "fs";

// Get all campaigns (admin access)
export const getAllCampaigns = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Query parameters for filtering
    const { status, userId, fromDate, toDate, search } = req.query;
    
    // Build filter object
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (userId) {
      filter.userId = new ObjectId(userId as string);
    }
    
    // Date range filtering
    if (fromDate || toDate) {
      filter.createdAt = {};
      
      if (fromDate) {
        filter.createdAt.$gte = new Date(fromDate as string);
      }
      
      if (toDate) {
        filter.createdAt.$lte = new Date(toDate as string);
      }
    }
    
    // Text search
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      filter.$or = [
        { campaignName: searchRegex },
        { subject: searchRegex },
        { fromEmail: searchRegex },
        { clusterName: searchRegex }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await Campaign.countDocuments(filter);
    
    // Fetch campaigns with pagination and sorting
    const campaigns = await Campaign.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Enhance with user information
    const enhancedCampaigns = await Promise.all(
      campaigns.map(async (campaign) => {
        // Get user information
        const user = await User.findById(campaign.userId)
          .select("username email")
          .lean();

        return {
          ...campaign,
          userInfo: user || { username: "Unknown", email: "Unknown" },
        };
      })
    );

    res.status(200).json({
      campaigns: enhancedCampaigns,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching all campaigns:", error);
    res.status(500).json({ message: 'Failed to fetch campaigns' });
  }
};

// Get campaign by ID (admin access)
export const getAdminCampaignById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid campaign ID' });
      return;
    }
    
    const campaignId = new ObjectId(id);

    // Find the campaign
    const campaign = await Campaign.findById(campaignId).lean();

    if (!campaign) {
      res.status(404).json({ message: 'Campaign not found' });
      return;
    }

    // Get user information
    const user = await User.findById(campaign.userId)
      .select("username email")
      .lean();

    // Calculate additional metrics
    const calculatedMetrics = calculateCampaignMetrics(campaign);

    // Enhance response with user info
    const enhancedCampaign = {
      ...campaign,
      userInfo: user || { username: "Unknown", email: "Unknown" },
      calculatedMetrics,
    };

    res.status(200).json(enhancedCampaign);
  } catch (error) {
    console.error("Error fetching campaign details:", error);
    res.status(500).json({ message: 'Failed to fetch campaign details' });
  }
};

// Update campaign (admin access)
export const updateCampaign = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid campaign ID' });
      return;
    }
    
    const campaignId = new ObjectId(id);
    const { status, metrics } = req.body;

    // Update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only update fields that are provided
    if (status) {
      updateData.status = status;
      
      // Add sentAt date if status is now 'sent' or 'completed'
      if (status === "sent" || status === "completed") {
        updateData.sentAt = new Date();
      }
    }

    if (metrics) {
      // Validate metrics object
      if (
        typeof metrics !== "object" ||
        typeof metrics.opens !== "number" ||
        typeof metrics.clicks !== "number" ||
        typeof metrics.bounces !== "number" ||
        typeof metrics.unsubscribes !== "number"
      ) {
        res.status(400).json({ message: 'Invalid metrics object' });
        return;
      }

      updateData["metrics.opens"] = metrics.opens;
      updateData["metrics.clicks"] = metrics.clicks;
      updateData["metrics.bounces"] = metrics.bounces;
      updateData["metrics.unsubscribes"] = metrics.unsubscribes;
    }

    // Update the campaign
    const result = await Campaign.findOneAndUpdate(
      { _id: campaignId },
      { $set: updateData },
      { new: true }
    ).lean();

    if (!result) {
      res.status(404).json({ message: 'Campaign not found' });
      return;
    }

    res.status(200).json({
      message: "Campaign updated successfully",
      campaign: result,
    });
  } catch (error) {
    console.error("Error updating campaign:", error);
    res.status(500).json({ message: 'Failed to update campaign' });
  }
};

// Delete campaign (admin access)
export const deleteCampaignAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid campaign ID' });
      return;
    }
    
    const campaignId = new ObjectId(id);

    // Find campaign first to get attachment paths
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      res.status(404).json({ message: 'Campaign not found' });
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

    // Delete the campaign
    await Campaign.deleteOne({ _id: campaignId });

    res.status(200).json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({ message: 'Failed to delete campaign' });
  }
};

// Get campaign dashboard stats for admin
export const getCampaignStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get overall metrics
    const totalCampaigns = await Campaign.countDocuments({});
    const activeCampaigns = await Campaign.countDocuments({ 
      status: { $in: ["ongoing", "sending"] } 
    });
    
    // Get total emails sent
    const campaignsAggregate = await Campaign.aggregate([
      {
        $group: {
          _id: null,
          totalRecipients: { $sum: "$recipientCount" },
          totalOpens: { $sum: "$metrics.opens" },
          totalClicks: { $sum: "$metrics.clicks" },
          totalBounces: { $sum: "$metrics.bounces" },
          totalUnsubscribes: { $sum: "$metrics.unsubscribes" }
        }
      }
    ]);
    
    const totals = campaignsAggregate.length > 0 ? campaignsAggregate[0] : {
      totalRecipients: 0,
      totalOpens: 0,
      totalClicks: 0,
      totalBounces: 0,
      totalUnsubscribes: 0
    };
    
    // Get campaign status distribution
    const statusDistribution = await Campaign.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get recent campaigns
    const recentCampaigns = await Campaign.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    // Monthly campaigns data (for charts)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyData = await Campaign.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 },
          recipients: { $sum: "$recipientCount" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);
    
    // Format monthly data
    const monthlyStats = monthlyData.map(item => {
      const date = new Date(item._id.year, item._id.month - 1, 1);
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        year: item._id.year,
        campaigns: item.count,
        recipients: item.recipients
      };
    });

    res.status(200).json({
      totalCampaigns,
      activeCampaigns,
      emailsSent: totals.totalRecipients,
      opens: totals.totalOpens,
      clicks: totals.totalClicks,
      bounces: totals.totalBounces,
      unsubscribes: totals.totalUnsubscribes,
      statusDistribution,
      recentCampaigns,
      monthlyStats
    });
  } catch (error) {
    console.error("Error fetching campaign stats:", error);
    res.status(500).json({ message: 'Failed to fetch campaign statistics' });
  }
};

// Get performance metrics for admin dashboard
export const getPerformanceMetrics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get date range from query params, defaulting to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    const days = parseInt(req.query.days as string) || 30;
    startDate.setDate(startDate.getDate() - days);
    
    // Get metrics using the admin tracking service
    const metrics = await getAdminCampaignMetrics({
      startDate,
      endDate
    });

    // Get time series data for charts if requested
    let timeSeriesData = null;
    if (req.query.includeTimeSeries === 'true') {
      const groupBy = (req.query.groupBy as 'day' | 'week' | 'month') || 'day';
      timeSeriesData = await generateCampaignReport(startDate, endDate, { 
        groupBy,
        includeInactive: req.query.includeInactive === 'true'
      });
    }

    res.status(200).json({
      metrics,
      timeSeriesData
    });
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    res.status(500).json({ message: 'Failed to fetch performance metrics' });
  }
};