import { Request, Response } from "express";
import axios from "axios"; // ✅ Add this missing import
import User from "../models/User";
import Campaign from "../models/Campaign";
import redisClient from "../services/redis";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    const emailsSentAgg = await Campaign.aggregate([
      { $group: { _id: null, total: { $sum: "$recipientCount" } } },
    ]);
    const emailsSent = emailsSentAgg[0]?.total || 0;

    const campaigns = await Campaign.countDocuments({ status: "ongoing" });

    res.json({
      totalUsers,
      activeUsers,
      emailsSent,
      campaigns,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};

export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const recentCampaigns = await Campaign.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select("campaignName fromEmail status createdAt");

    const activity = recentCampaigns.map((c) => ({
      action: `Campaign: ${c.campaignName}`,
      timestamp: new Date(c.createdAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      user: c.fromEmail,
    }));

    res.json(activity);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ message: "Failed to fetch recent activity" });
  }
};

export const getSystemStatus = async (req: Request, res: Response) => {
  try {
    // Redis check
    let redisStatus = false;
    try {
      const ping = await redisClient.ping();
      redisStatus = ping === "PONG";
    } catch (redisError) {
      console.warn("Redis ping failed", redisError);
    }

    // FastAPI check
    let fastapiStatus = false;
    try {
      const response = await axios.get<{ status: string }>(
        "http://127.0.0.1:8000/health",
        { timeout: 2000 }
      );
      fastapiStatus = response.data?.status === "healthy";
    } catch (fastapiError: any) {
      console.warn("FastAPI health check failed", fastapiError.message);
    }

    // Node status
    const nodeStatus = true;

    res.json({
      node: nodeStatus,
      fastapi: fastapiStatus,
      redis: redisStatus,
    });
  } catch (error) {
    console.error("System status check failed:", error);
    res.status(500).json({ message: "Failed to fetch system status" });
  }
};


export const getNodeHealth = (req: Request, res: Response) => {
    res.status(200).json({
      status: "healthy",
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      version: process.version,
      timestamp: new Date(),
    });
  };