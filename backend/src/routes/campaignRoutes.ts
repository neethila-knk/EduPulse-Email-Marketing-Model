import express from "express";
import { 
  createCampaign, 
  getUserCampaigns, 
  getCampaignById, 
  updateCampaignStatus, 
  deleteCampaign,
  upload
} from "../controllers/campaignController";
import { authenticateJWT } from "../middleware/authMiddleware";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Create a new campaign
router.post("/", upload.array("attachments", 5), createCampaign);

// Get all campaigns for the current user
router.get("/", getUserCampaigns);

// Get a single campaign by ID
router.get("/:id", getCampaignById);

// Update campaign status
router.patch("/:id/status", updateCampaignStatus);

// Delete a campaign
router.delete("/:id", deleteCampaign);



export default router;