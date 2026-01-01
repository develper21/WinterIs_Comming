import Dashboard from "../../models/admin/Dashboard.js";

// #region DashboardController

/**
 * Dashboard Controller
 * Handles dashboard overview data aggregation
 */

/**
 * GET /api/admin/dashboard/overview
 * Get complete dashboard overview with all statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDashboardOverview = async (req, res) => {
  try {
    const overview = await Dashboard.getCompleteOverview();

    return res.status(200).json({
      success: true,
      message: "Dashboard overview retrieved successfully",
      data: overview
    });
  } catch (error) {
    console.error("Dashboard Overview Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard overview",
      error: error.message
    });
  }
};

/**
 * GET /api/admin/dashboard/organizations
 * Get organization statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getOrganizationStats = async (req, res) => {
  try {
    const stats = await Dashboard.getOrganizationStats();

    return res.status(200).json({
      success: true,
      message: "Organization statistics retrieved successfully",
      data: stats
    });
  } catch (error) {
    console.error("Organization Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve organization statistics",
      error: error.message
    });
  }
};

/**
 * GET /api/admin/dashboard/blood-stock
 * Get blood stock statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getBloodStockStats = async (req, res) => {
  try {
    const stats = await Dashboard.getBloodStockStats();

    return res.status(200).json({
      success: true,
      message: "Blood stock statistics retrieved successfully",
      data: stats
    });
  } catch (error) {
    console.error("Blood Stock Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve blood stock statistics",
      error: error.message
    });
  }
};

/**
 * GET /api/admin/dashboard/alerts
 * Get alert statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAlertStats = async (req, res) => {
  try {
    const stats = await Dashboard.getAlertStats();

    return res.status(200).json({
      success: true,
      message: "Alert statistics retrieved successfully",
      data: stats
    });
  } catch (error) {
    console.error("Alert Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve alert statistics",
      error: error.message
    });
  }
};

/**
 * GET /api/admin/dashboard/users
 * Get user statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUserStats = async (req, res) => {
  try {
    const stats = await Dashboard.getUserStats();

    return res.status(200).json({
      success: true,
      message: "User statistics retrieved successfully",
      data: stats
    });
  } catch (error) {
    console.error("User Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user statistics",
      error: error.message
    });
  }
};

/**
 * GET /api/admin/dashboard/activity
 * Get recent activity logs
 * Query params:
 *   - limit: Number of logs to retrieve (default: 10, max: 50)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRecentActivity = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const parsedLimit = Math.min(parseInt(limit) || 10, 50);

    const activity = await Dashboard.getRecentActivity(parsedLimit);

    return res.status(200).json({
      success: true,
      message: "Recent activity retrieved successfully",
      data: {
        count: activity.length,
        logs: activity
      }
    });
  } catch (error) {
    console.error("Recent Activity Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve recent activity",
      error: error.message
    });
  }
};

/**
 * GET /api/admin/dashboard/health
 * Get system health status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getSystemHealth = async (req, res) => {
  try {
    const health = await Dashboard.getSystemHealth();

    return res.status(200).json({
      success: true,
      message: "System health retrieved successfully",
      data: health
    });
  } catch (error) {
    console.error("System Health Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve system health",
      error: error.message
    });
  }
};
