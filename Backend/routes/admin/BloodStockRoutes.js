import express from "express";
import authMiddleware from "../../middleware/auth.middleware.js";
import adminAuthMiddleware from "../../middleware/adminAuth.middleware.js";
import organizationAuthMiddleware from "../../middleware/organizationAuth.middleware.js";
import BloodStockController from "../../controllers/admin/BloodStockController.js";

const router = express.Router();

// #region BloodBankInitialization

/**
 * POST /api/admin/blood-stock/initialize
 * Initialize blood stock for a new blood bank (Blood Bank users only)
 * Body: { bloodBankId }
 */
router.post(
  "/initialize",
  authMiddleware,
  organizationAuthMiddleware,
  BloodStockController.initializeBloodStock
);

// #region BloodBankRoutes

/**
 * POST /api/admin/blood-stock/update/:bloodBankId
 * Update blood stock (Blood Bank users only)
 * Body: { bloodGroup, units, action }
 */
router.post(
  "/update/:bloodBankId",
  authMiddleware,
  organizationAuthMiddleware,
  BloodStockController.updateBloodStock
);

// #region BloodBankAnalytics

/**
 * GET /api/admin/blood-stock
 * Get all blood stocks with pagination (Blood Bank users can see their own)
 */
router.get(
  "/",
  authMiddleware,
  organizationAuthMiddleware,
  BloodStockController.getAllBloodStocks
);

/**
 * GET /api/admin/blood-stock/summary
 * Get overall blood stock summary across all blood banks
 */
router.get(
  "/summary",
  authMiddleware,
  organizationAuthMiddleware,
  BloodStockController.getBloodStockSummary
);

/**
 * GET /api/admin/blood-stock/by-blood-group/:bloodGroup
 * Get stock breakdown by specific blood group
 */
router.get(
  "/by-blood-group/:bloodGroup",
  authMiddleware,
  organizationAuthMiddleware,
  BloodStockController.getStockByBloodGroup
);

/**
 * GET /api/admin/blood-stock/by-bloodbank/:bloodBankId
 * Get complete stock breakdown for a specific blood bank
 */
router.get(
  "/by-bloodbank/:bloodBankId",
  authMiddleware,
  organizationAuthMiddleware,
  BloodStockController.getStockByBloodBank
);

/**
 * GET /api/admin/blood-stock/shortages
 * Get critical shortage alerts
 */
router.get(
  "/shortages",
  authMiddleware,
  organizationAuthMiddleware,
  BloodStockController.getShortageAlerts
);

export default router;
