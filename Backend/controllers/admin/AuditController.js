import Audit from "../../models/admin/Audit.js";

// #region AuditLog Manage
export const getAuditLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      entityType, 
      action, 
      performedBy, 
      performedByRole, 
      status,
      dateFrom,
      dateTo 
    } = req.query;

    const filters = {
      ...(entityType && { entityType }),
      ...(action && { action }),
      ...(performedBy && { performedBy }),
      ...(performedByRole && { performedByRole }),
      ...(status && { status }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo })
    };

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await Audit.findAll(filters, pagination);

    return res.status(200).json({
      success: true,
      message: "Audit logs retrieved successfully",
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving audit logs",
      error: error.message
    });
  }
};

export const getAuditLogById = async (req, res) => {
  try {
    const { logId } = req.params;

    if (!logId) {
      return res.status(400).json({
        success: false,
        message: "Log ID is required"
      });
    }

    const log = await Audit.findById(logId);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Audit log not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Audit log retrieved successfully",
      data: log
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving audit log",
      error: error.message
    });
  }
};

export const getLogsByEntityType = async (req, res) => {
  try {
    const { entityType } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const validEntityTypes = [
      "ORGANIZATION",
      "EMERGENCY",
      "BLOOD_STOCK",
      "ALERT",
      "HOSPITAL",
      "BLOODBANK",
      "NGO",
      "USER",
      "APPROVAL"
    ];

    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid entity type. Must be one of: ${validEntityTypes.join(", ")}`
      });
    }

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await Audit.findByEntityType(entityType, pagination);

    return res.status(200).json({
      success: true,
      message: `Audit logs for ${entityType} retrieved successfully`,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving logs by entity type",
      error: error.message
    });
  }
};

export const getLogsByAction = async (req, res) => {
  try {
    const { action } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const validActions = [
      "CREATED",
      "UPDATED",
      "APPROVED",
      "REJECTED",
      "SUSPENDED",
      "ACTIVATED",
      "DELETED",
      "ACCESSED",
      "LOGIN",
      "LOGOUT"
    ];

    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Invalid action. Must be one of: ${validActions.join(", ")}`
      });
    }

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await Audit.findByAction(action, pagination);

    return res.status(200).json({
      success: true,
      message: `Audit logs for action ${action} retrieved successfully`,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving logs by action",
      error: error.message
    });
  }
};

export const getLogsByEntityCode = async (req, res) => {
  try {
    const { entityCode } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!entityCode) {
      return res.status(400).json({
        success: false,
        message: "Entity code is required"
      });
    }

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await Audit.findByEntityCode(entityCode, pagination);

    return res.status(200).json({
      success: true,
      message: `Audit logs for entity ${entityCode} retrieved successfully`,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving logs by entity code",
      error: error.message
    });
  }
};

export const getAuditStats = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const stats = await Audit.getStats(dateFrom, dateTo);

    return res.status(200).json({
      success: true,
      message: "Audit statistics retrieved successfully",
      data: stats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving audit statistics",
      error: error.message
    });
  }
};

export const getRecentActivity = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const logs = await Audit.getRecentActivity(parseInt(limit));

    return res.status(200).json({
      success: true,
      message: "Recent activity retrieved successfully",
      data: {
        logs,
        count: logs.length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving recent activity",
      error: error.message
    });
  }
};

export default {
  getAuditLogs,
  getAuditLogById,
  getLogsByEntityType,
  getLogsByAction,
  getLogsByEntityCode,
  getAuditStats,
  getRecentActivity
};
