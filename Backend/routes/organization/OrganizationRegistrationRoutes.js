import express from "express";
import {
  registerOrganization,
  getOrganizationStatus,
  getPendingOrganizations,
  getAllOrganizations
} from "../../controllers/organization/OrganizationRegistrationController.js";
import adminAuthMiddleware from "../../middleware/adminAuth.middleware.js";
import superAdminAuthMiddleware from "../../middleware/superAdminAuth.middleware.js";
import authMiddleware from "../../middleware/auth.middleware.js";

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
 * Get all organizations (admin/superadmin only)
 */
router.get("/all", authMiddleware, superAdminAuthMiddleware, getAllOrganizations);

/**
 * GET /api/auth/pending
 * Get all pending organizations (admin/superadmin only)
 */
router.get("/pending", authMiddleware, superAdminAuthMiddleware, getPendingOrganizations);

export default router;
