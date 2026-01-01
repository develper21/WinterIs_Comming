import express from "express";
import authMiddleware from "../../middleware/auth.middleware.js";
import adminAuthMiddleware from "../../middleware/adminAuth.middleware.js";
import roleMiddleware from "../../middleware/role.middleware.js";
import HospitalController from "../../controllers/admin/HospitalController.js";

const router = express.Router();

// #region GetEndpoints

/**
 * GET /admin/hospitals
 * List all hospitals with pagination & filters
 * Query: ?status=APPROVED&city=Delhi&page=1&limit=20
 */
router.get(
  "/",
  authMiddleware,
  adminAuthMiddleware,
  HospitalController.getAllHospitals
);

/**
 * GET /admin/hospitals/id/:hospitalId
 * Get single hospital by MongoDB ID
 */
router.get(
  "/id/:hospitalId",
  authMiddleware,
  adminAuthMiddleware,
  HospitalController.getHospitalById
);

/**
 * GET /admin/hospitals/code/:organizationCode
 * Get single hospital by hospital code (HOSP-DEL-001)
 */
router.get(
  "/code/:organizationCode",
  authMiddleware,
  adminAuthMiddleware,
  HospitalController.getHospitalByCode
);

/**
 * GET /admin/hospitals/status/:status
 * Get hospitals filtered by status (APPROVED, PENDING, REJECTED, SUSPENDED)
 * Query: ?page=1&limit=20
 */
router.get(
  "/status/:status",
  authMiddleware,
  adminAuthMiddleware,
  HospitalController.getHospitalsByStatus
);

// #region PostEndpoints

/**
 * POST /admin/hospitals/:id/activate
 * Activate a suspended hospital
 * Requires: Admin role
 */
router.post(
  "/:id/activate",
  authMiddleware,
  adminAuthMiddleware,
  roleMiddleware(["ADMIN", "SuperAdmin"]),
  HospitalController.activateHospital
);

/**
 * POST /admin/hospitals/:id/suspend
 * Suspend a hospital
 * Requires: Admin role
 * Body: { reason: "string" }
 */
router.post(
  "/:id/suspend",
  authMiddleware,
  adminAuthMiddleware,
  roleMiddleware(["ADMIN", "SuperAdmin"]),
  HospitalController.suspendHospital
);

export default router;
