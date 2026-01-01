import express from "express";
import {
  registerOrganization,
  getOrganizationStatus,
  getPendingOrganizations,
  getAllOrganizations
} from "../../controllers/organization/OrganizationRegistrationController.js";
import adminAuthMiddleware from "../../middleware/adminAuth.middleware.js";

const router = express.Router();

// #region PublicRoutes

/**
 * POST /api/auth/register
 * Organization Registration
 */
router.post("/register", registerOrganization);

/**
 * GET /api/auth/status/:organizationCode
 * Check organization registration status
 */
router.get("/status/:organizationCode", getOrganizationStatus);

// #region ProtectedRoutes

/**
 * GET /api/auth/all
 * Get all organizations (admin only)
 */
router.get("/all", adminAuthMiddleware, getAllOrganizations);

/**
 * GET /api/auth/pending
 * Get all pending organizations (admin only)
 */
router.get("/pending", adminAuthMiddleware, getPendingOrganizations);

export default router;
