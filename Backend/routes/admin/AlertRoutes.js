import express from "express";
import authMiddleware from "../../middleware/auth.middleware.js";
import organizationAuthMiddleware from "../../middleware/organizationAuth.middleware.js";
import AlertController from "../../controllers/admin/AlertController.js";

const router = express.Router();

// #region PostEndpoints

/**
 * POST /api/admin/alerts
 * Create a new alert
 * Body: { type, title, message, severity, relatedEntity, relatedEntityType, createdBy }
 */
router.post(
  "/",
  authMiddleware,
  organizationAuthMiddleware,
  AlertController.createAlert
);

// #region GetEndpoints

/**
 * GET /api/admin/alerts
 * List all alerts with pagination & filters
 * Query: ?page=1&limit=20&unreadOnly=false&severity=CRITICAL&type=DELAYED_EMERGENCY
 */
router.get(
  "/",
  authMiddleware,
  organizationAuthMiddleware,
  AlertController.getAllAlerts
);

/**
 * GET /api/admin/alerts/summary
 * Get alerts summary for dashboard
 */
router.get(
  "/summary",
  authMiddleware,
  organizationAuthMiddleware,
  AlertController.getAlertsSummary
);

/**
 * GET /api/admin/alerts/unread/count
 * Get count of unread alerts
 */
router.get(
  "/unread/count",
  authMiddleware,
  organizationAuthMiddleware,
  AlertController.getUnreadCount
);

/**
 * GET /api/admin/alerts/by-type/:type
 * Get alerts filtered by type
 * Types: DELAYED_EMERGENCY, NO_BLOOD_BANK_RESPONSE, NGO_FALLBACK_TRIGGERED, CRITICAL_SHORTAGE, etc.
 */
router.get(
  "/by-type/:type",
  authMiddleware,
  organizationAuthMiddleware,
  AlertController.getAlertsByType
);

/**
 * GET /api/admin/alerts/:alertId
 * Get specific alert by ID
 */
router.get(
  "/:alertId",
  authMiddleware,
  organizationAuthMiddleware,
  AlertController.getAlertById
);

// #region PostEndpoints

/**
 * POST /api/admin/alerts/:alertId/mark-read
 * Mark a single alert as read
 */
router.post(
  "/:alertId/mark-read",
  authMiddleware,
  organizationAuthMiddleware,
  AlertController.markAlertAsRead
);

/**
 * POST /api/admin/alerts/mark-multiple-read
 * Mark multiple alerts as read
 * Body: { alertIds: ["id1", "id2", "id3"] }
 */
router.post(
  "/mark-multiple-read",
  authMiddleware,
  organizationAuthMiddleware,
  AlertController.markMultipleAlertsAsRead
);

/**
 * POST /api/admin/alerts/:alertId/archive
 * Archive an alert (soft delete)
 */
router.post(
  "/:alertId/archive",
  authMiddleware,
  organizationAuthMiddleware,
  AlertController.archiveAlert
);

export default router;
