import Alert from "../../models/admin/Alert.js";

// #region Alert Controller
export const createAlert = async (req, res) => {
  try {
    const { type, title, message, severity, relatedEntity, relatedEntityType, createdBy } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "Type, title, and message are required"
      });
    }

    const validTypes = [
      "DELAYED_EMERGENCY",
      "NO_BLOOD_BANK_RESPONSE",
      "NGO_FALLBACK_TRIGGERED",
      "CRITICAL_SHORTAGE",
      "LOW_STOCK_WARNING",
      "ORGANIZATION_SUSPENDED",
      "EMERGENCY_ESCALATION",
      "SYSTEM_ERROR"
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid alert type. Must be one of: ${validTypes.join(", ")}`
      });
    }

    const validSeverities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    if (severity && !validSeverities.includes(severity)) {
      return res.status(400).json({
        success: false,
        message: `Invalid severity. Must be one of: ${validSeverities.join(", ")}`
      });
    }

    const alert = await Alert.create({
      type,
      title,
      message,
      severity: severity || "MEDIUM",
      relatedEntity: relatedEntity || {},
      relatedEntityType,
      createdBy: createdBy || "system"
    });

    return res.status(201).json({
      success: true,
      message: "Alert created successfully",
      data: alert
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating alert",
      error: error.message
    });
  }
};

export const getAllAlerts = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false, severity, type, relatedEntityType } = req.query;

    const filters = {
      unreadOnly: unreadOnly === "true",
      ...(severity && { severity }),
      ...(type && { type }),
      ...(relatedEntityType && { relatedEntityType })
    };

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await Alert.findAll(filters, pagination);

    return res.status(200).json({
      success: true,
      message: "Alerts retrieved successfully",
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving alerts",
      error: error.message
    });
  }
};

export const getAlertById = async (req, res) => {
  try {
    const { alertId } = req.params;

    if (!alertId) {
      return res.status(400).json({
        success: false,
        message: "Alert ID is required"
      });
    }

    const alert = await Alert.findById(alertId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Alert retrieved successfully",
      data: alert
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving alert",
      error: error.message
    });
  }
};

export const markAlertAsRead = async (req, res) => {
  try {
    const { alertId } = req.params;

    if (!alertId) {
      return res.status(400).json({
        success: false,
        message: "Alert ID is required"
      });
    }

    const alert = await Alert.findById(alertId);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found"
      });
    }

    const success = await Alert.markAsRead(alertId);

    if (!success) {
      return res.status(500).json({
        success: false,
        message: "Error marking alert as read"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Alert marked as read successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error marking alert as read",
      error: error.message
    });
  }
};

export const markMultipleAlertsAsRead = async (req, res) => {
  try {
    const { alertIds } = req.body;

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Alert IDs array is required"
      });
    }

    const count = await Alert.markMultipleAsRead(alertIds);

    return res.status(200).json({
      success: true,
      message: `${count} alert(s) marked as read successfully`,
      data: { markedCount: count }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error marking alerts as read",
      error: error.message
    });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Alert.getUnreadCount();

    return res.status(200).json({
      success: true,
      message: "Unread count retrieved successfully",
      data: { unreadCount }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving unread count",
      error: error.message
    });
  }
};

export const getAlertsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const validTypes = [
      "DELAYED_EMERGENCY",
      "NO_BLOOD_BANK_RESPONSE",
      "NGO_FALLBACK_TRIGGERED",
      "CRITICAL_SHORTAGE",
      "LOW_STOCK_WARNING",
      "ORGANIZATION_SUSPENDED",
      "EMERGENCY_ESCALATION",
      "SYSTEM_ERROR"
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid alert type. Must be one of: ${validTypes.join(", ")}`
      });
    }

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await Alert.findByType(type, pagination);

    return res.status(200).json({
      success: true,
      message: `Alerts of type ${type} retrieved successfully`,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving alerts by type",
      error: error.message
    });
  }
};

export const archiveAlert = async (req, res) => {
  try {
    const { alertId } = req.params;

    if (!alertId) {
      return res.status(400).json({
        success: false,
        message: "Alert ID is required"
      });
    }

    const alert = await Alert.findById(alertId);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found"
      });
    }

    const success = await Alert.archiveAlert(alertId);

    if (!success) {
      return res.status(500).json({
        success: false,
        message: "Error archiving alert"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Alert archived successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error archiving alert",
      error: error.message
    });
  }
};

export const getAlertsSummary = async (req, res) => {
  try {
    const summary = await Alert.getSummary();

    return res.status(200).json({
      success: true,
      message: "Alerts summary retrieved successfully",
      data: summary
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving alerts summary",
      error: error.message
    });
  }
};

export default {
  createAlert,
  getAllAlerts,
  getAlertById,
  markAlertAsRead,
  markMultipleAlertsAsRead,
  getUnreadCount,
  getAlertsByType,
  archiveAlert,
  getAlertsSummary
};
