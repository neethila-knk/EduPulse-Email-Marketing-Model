// routes/userClustersRouter.ts

import express, { Request, Response } from "express";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import { authenticateJWT } from "../middleware/authMiddleware";

dotenv.config();
const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Database connection
const mongoUri = process.env.MONGO_URI!;
const client = new MongoClient(mongoUri);
const db = client.db("edudb");
const clusterCollection = db.collection("clusters");

/**
 * @route   GET /api/user-clusters
 * @desc    Get all active clusters available for users
 * @access  Private
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user exists in request
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    
    // Find only active clusters
    const result = await clusterCollection.find({
      status: "active"
    }).toArray();

    if (result.length === 0) {
      res.json([]);
      return;
    }

    // Transform to the expected format for the frontend select component
    const clusters = result.map((cluster) => ({
      id: cluster._id,
      value: cluster._id.toString(), // For select dropdown value
      label: cluster.name, // For select dropdown display
      count: cluster.size || cluster.emails?.length || 0,
      description: cluster.description || "",
      primaryInterest: cluster.primary_interest || "",
      primaryDomainType: cluster.primary_domain_type || ""
    }));

    res.json(clusters);
  } catch (error) {
    console.error("Error fetching user clusters:", error);
    res.status(500).json({ error: "Unable to fetch clusters." });
  }
});

/**
 * @route   GET /api/user-clusters/:id
 * @desc    Get a specific cluster by ID with full details
 * @access  Private
 */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    
    const clusterId = req.params.id;
    
    // Validate the cluster ID
    let objectId;
    try {
      objectId = new ObjectId(clusterId);
    } catch (error) {
      res.status(400).json({ error: "Invalid cluster ID format" });
      return;
    }

    // Find the specific cluster
    const cluster = await clusterCollection.findOne({
      _id: objectId,
      status: "active"
    });

    if (!cluster) {
      res.status(404).json({ error: "Cluster not found or not active" });
      return;
    }

    // Return the cluster with key information but not the emails
    const clusterDetails = {
      id: cluster._id,
      name: cluster.name,
      description: cluster.description || "",
      size: cluster.size || cluster.emails?.length || 0,
      primaryInterest: cluster.primary_interest || "",
      primaryDomainType: cluster.primary_domain_type || "",
      domainDistribution: cluster.domain_distribution || {},
      keywordDistribution: cluster.keyword_distribution || {},
      emailCount: cluster.emails?.length || 0
    };

    res.json(clusterDetails);
  } catch (error) {
    console.error("Error fetching cluster details:", error);
    res.status(500).json({ error: "Unable to fetch cluster details." });
  }
});

/**
 * @route   GET /api/user-clusters/domains/:id
 * @desc    Get domain distribution for a specific cluster
 * @access  Private
 */
router.get("/domains/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    
    const clusterId = req.params.id;
    
    let objectId;
    try {
      objectId = new ObjectId(clusterId);
    } catch (error) {
      res.status(400).json({ error: "Invalid cluster ID format" });
      return;
    }

    const cluster = await clusterCollection.findOne(
      { _id: objectId, status: "active" },
      { projection: { domain_distribution: 1 } }
    );

    if (!cluster) {
      res.status(404).json({ error: "Cluster not found" });
      return;
    }

    res.json(cluster.domain_distribution || {});
  } catch (error) {
    console.error("Error fetching domain distribution:", error);
    res.status(500).json({ error: "Unable to fetch domain distribution." });
  }
});

/**
 * @route   GET /api/user-clusters/keywords/:id
 * @desc    Get keyword distribution for a specific cluster
 * @access  Private
 */
router.get("/keywords/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    
    const clusterId = req.params.id;
    
    let objectId;
    try {
      objectId = new ObjectId(clusterId);
    } catch (error) {
      res.status(400).json({ error: "Invalid cluster ID format" });
      return;
    }

    const cluster = await clusterCollection.findOne(
      { _id: objectId, status: "active" },
      { projection: { keyword_distribution: 1 } }
    );

    if (!cluster) {
      res.status(404).json({ error: "Cluster not found" });
      return;
    }

    res.json(cluster.keyword_distribution || {});
  } catch (error) {
    console.error("Error fetching keyword distribution:", error);
    res.status(500).json({ error: "Unable to fetch keyword distribution." });
  }
});

export default router;