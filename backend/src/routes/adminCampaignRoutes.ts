import express from "express";
import { authenticateAdminJWT } from "../middleware/adminAuthMiddleware";
import {
  getAllCampaigns,
  getAdminCampaignById,
  updateCampaign,
  deleteCampaignAdmin,

} from "../controllers/adminCampaignController";

const router = express.Router();


router.use(authenticateAdminJWT);


router.get("/campaigns", getAllCampaigns);
router.get("/campaigns/:id", getAdminCampaignById);
router.put("/campaigns/:id", updateCampaign);
router.delete("/campaigns/:id", deleteCampaignAdmin);


export default router;