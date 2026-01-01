import express from "express";
import { SyncController } from "../controllers/SyncController.js";

const router = express.Router();

// #region SyncRoutes
router.post("/create-hospital/:organizationId", SyncController.createHospitalFromOrganization);
router.post("/sync-all-hospitals", SyncController.syncAllHospitals);

export default router;
