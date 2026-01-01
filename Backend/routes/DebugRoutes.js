import express from "express";
import { DebugController } from "../controllers/DebugController.js";

const router = express.Router();

// #region DebugRoutes

router.get("/check/:id", DebugController.checkOrganizationAndHospital);
router.get("/hospitals", DebugController.listAllHospitals);
router.get("/organizations", DebugController.listAllOrganizations);

export default router;
