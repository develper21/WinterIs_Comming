import express from "express";
import authMiddleware from "../../middleware/auth.middleware.js";
import adminAuthMiddleware from "../../middleware/adminAuth.middleware.js";
import roleMiddleware from "../../middleware/role.middleware.js";
import NgoController from "../../controllers/admin/NgoController.js";

const router = express.Router();

// #region GetEndpoints

/**
 * GET /admin/ngos
 * List all NGOs with pagination & filters
 * Query: ?status=APPROVED&page=1&limit=20
 */
router.get(
  "/",
  authMiddleware,
  adminAuthMiddleware,
  NgoController.getAllNGOs
);

/**
 * GET /admin/ngos/id/:ngoId
 * Get single NGO by MongoDB ID
 */
router.get(
  "/id/:ngoId",
  authMiddleware,
  adminAuthMiddleware,
  NgoController.getNGOById
);

/**
 * GET /admin/ngos/code/:organizationCode
 * Get single NGO by NGO code (NGO-DEL-001)
 */
router.get(
  "/code/:organizationCode",
  authMiddleware,
  adminAuthMiddleware,
  NgoController.getNGOByCode
);

/**
 * GET /admin/ngos/status/:status
 * Get NGOs filtered by status (APPROVED, PENDING, REJECTED, SUSPENDED)
 * Query: ?page=1&limit=20
 */
router.get(
  "/status/:status",
  authMiddleware,
  adminAuthMiddleware,
  NgoController.getNGOsByStatus
);

/**
 * GET /admin/ngos/:ngoId/donor-coverage
 * Get aggregated donor coverage (NO individual donor data exposed)
 */
router.get(
  "/:ngoId/donor-coverage",
  authMiddleware,
  adminAuthMiddleware,
  NgoController.getNGODonorCoverage
);

// #region PostEndpoints

/**
 * POST /admin/ngos/:id/enable
 * Enable NGO participation
 * Requires: Admin role
 */
router.post(
  "/:id/enable",
  authMiddleware,
  adminAuthMiddleware,
  roleMiddleware(["ADMIN", "SuperAdmin"]),
  NgoController.enableNGO
);

/**
 * POST /admin/ngos/:id/disable
 * Disable NGO participation
 * Requires: Admin role
 * Body: { reason?: string }
 */
router.post(
  "/:id/disable",
  authMiddleware,
  adminAuthMiddleware,
  roleMiddleware(["ADMIN", "SuperAdmin"]),
  NgoController.disableNGO
);

export default router;
