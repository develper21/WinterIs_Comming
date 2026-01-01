import express from "express";
import authMiddleware from "../../middleware/auth.middleware.js";
import adminAuthMiddleware from "../../middleware/adminAuth.middleware.js";
import AuditController from "../../controllers/admin/AuditController.js";

const router = express.Router();

// #region GetEndpoints

/**
 * GET /api/admin/logs
 * Get all audit logs with filters and pagination
 * Query: ?page=1&limit=50&entityType=ORGANIZATION&action=APPROVED&performedBy=admin@sebn.com&dateFrom=2025-12-01&dateTo=2025-12-31
 */
router.get(
  "/",
  authMiddleware,
  adminAuthMiddleware,
  AuditController.getAuditLogs
);

/**
 * GET /api/admin/logs/stats
 * Get audit statistics and dashboard data
 * Query: ?dateFrom=2025-12-01&dateTo=2025-12-31
 */
router.get(
  "/stats",
  authMiddleware,
  adminAuthMiddleware,
  AuditController.getAuditStats
);

/**
 * GET /api/admin/logs/recent
 * Get recent activity (last N logs)
 * Query: ?limit=20
 */
router.get(
  "/recent",
  authMiddleware,
  adminAuthMiddleware,
  AuditController.getRecentActivity
);

/**
 * GET /api/admin/logs/by-entity-type/:entityType
 * Get logs for a specific entity type
 * Types: ORGANIZATION, EMERGENCY, BLOOD_STOCK, ALERT, HOSPITAL, BLOODBANK, NGO
 */
router.get(
  "/by-entity-type/:entityType",
  authMiddleware,
  adminAuthMiddleware,
  AuditController.getLogsByEntityType
);

/**
 * GET /api/admin/logs/by-action/:action
 * Get logs for a specific action
 * Actions: CREATED, UPDATED, APPROVED, REJECTED, SUSPENDED, ACTIVATED, DELETED
 */
router.get(
  "/by-action/:action",
  authMiddleware,
  adminAuthMiddleware,
  AuditController.getLogsByAction
);

/**
 * GET /api/admin/logs/by-entity-code/:entityCode
 * Get all logs for a specific entity (track all changes)
 * Example: HOSP-DEL-001, BB-MUM-001, EMG-2025-001
 */
router.get(
  "/by-entity-code/:entityCode",
  authMiddleware,
  adminAuthMiddleware,
  AuditController.getLogsByEntityCode
);

/**
 * GET /api/admin/logs/:logId
 * Get specific audit log by ID
 */
router.get(
  "/:logId",
  authMiddleware,
  adminAuthMiddleware,
  AuditController.getAuditLogById
);

export default router;
