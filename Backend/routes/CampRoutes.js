import express from "express";
import {
  getAvailableCampsWithSlots,
  getCampSlots
} from "../controllers/CampController.js";

// #region CampRoutes
const router = express.Router();

router.get("/available-camps", getAvailableCampsWithSlots);
router.get("/:campId/slots", getCampSlots);

export default router;
