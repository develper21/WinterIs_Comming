import express from "express";
import {
  getDashboardOverview,
  getOrganizationStats,
  getBloodStockStats,
  getAlertStats,
  getUserStats,
  getRecentActivity,
  getSystemHealth
} from "../../controllers/admin/DashboardController.js";
import authMiddleware from "../../middleware/auth.middleware.js";
import adminAuthMiddleware from "../../middleware/adminAuth.middleware.js";
import superAdminAuthMiddleware from "../../middleware/superAdminAuth.middleware.js";

const router = express.Router();

/**
 * Dashboard Routes
 * All endpoints require admin or superadmin authentication
 * Base path: /api/admin/dashboard
 */

/**
 * GET /api/admin/dashboard/overview
 * Get complete dashboard overview with all statistics
 * Returns: organizations, blood stock, alerts, users, recent activity, system health
 */
router.get("/overview", authMiddleware, superAdminAuthMiddleware, getDashboardOverview);

/**
 * GET /api/admin/dashboard/organizations
 * Get detailed organization statistics
 * Returns: total, hospitals, bloodBanks, ngos, pending, approved, suspended
 */
router.get("/organizations", authMiddleware, superAdminAuthMiddleware, getOrganizationStats);

/**
 * GET /api/admin/dashboard/blood-stock
 * Get detailed blood stock statistics
 * Returns: total units available, critical blood banks, total blood banks, status
 */
router.get("/blood-stock", authMiddleware, superAdminAuthMiddleware, getBloodStockStats);

/**
 * GET /api/admin/dashboard/alerts
 * Get detailed alert statistics
 * Returns: total alerts, unread count, critical/high severity counts, alerts by type
 */
router.get("/alerts", authMiddleware, superAdminAuthMiddleware, getAlertStats);

/**
 * GET /api/admin/dashboard/users
 * Get detailed user statistics
 * Returns: organization users, system admins, total users
 */
router.get("/users", authMiddleware, superAdminAuthMiddleware, getUserStats);

/**
 * GET /api/admin/dashboard/activity
 * Get recent activity logs
 * Query params:
 *   - limit: Number of logs (default: 10, max: 50)
 * Returns: count, logs array with timestamp, action, entity details
 */
router.get("/activity", authMiddleware, superAdminAuthMiddleware, getRecentActivity);

/**
 * GET /api/admin/dashboard/health
 * Get system health status
 * Returns: database connection status, all collections status and document counts
 */
router.get("/health", authMiddleware, superAdminAuthMiddleware, getSystemHealth);

export default router;
