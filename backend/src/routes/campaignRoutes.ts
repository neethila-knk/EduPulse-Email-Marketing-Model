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


router.use(authenticateJWT);


router.post("/", upload.array("attachments", 5), createCampaign);


router.get("/", getUserCampaigns);


router.get("/:id", getCampaignById);

router.patch("/:id/status", updateCampaignStatus);


router.delete("/:id", deleteCampaign);

export default router;