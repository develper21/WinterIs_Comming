import { getDB } from "../../config/db.js";
import { ObjectId } from "mongodb";

// #region AlertModel

/**
 * Alert Model
 * Manages system alerts and notifications for admins
 */
class Alert {
  constructor() {
    this.collectionName = "alerts";
  }

  getCollection() {
    const db = getDB();
    return db.collection(this.collectionName);
  }

  // CREATE - Create a new alert
  async create(alertData) {
    const collection = this.getCollection();
    const newAlert = {
      type: alertData.type, // DELAYED_EMERGENCY, NO_BLOOD_BANK_RESPONSE, NGO_FALLBACK_TRIGGERED, CRITICAL_SHORTAGE, etc.
      title: alertData.title,
      message: alertData.message,
      severity: alertData.severity || "MEDIUM", // LOW, MEDIUM, HIGH, CRITICAL
      relatedEntity: alertData.relatedEntity || {}, // { emergencyId, bloodBankId, hospitalId, etc. }
      relatedEntityType: alertData.relatedEntityType, // "EMERGENCY", "BLOOD_BANK", "HOSPITAL", "SHORTAGE", etc.
      isRead: false,
      createdAt: new Date(),
      readAt: null,
      createdBy: alertData.createdBy,
      status: "ACTIVE"
    };

    const result = await collection.insertOne(newAlert);
    return { _id: result.insertedId, ...newAlert };
  }

  // READ - Get all alerts with pagination and filters
  async findAll(filters = {}, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 20 } = pagination;
    const { unreadOnly = false, severity, type, relatedEntityType, status = "ACTIVE" } = filters;

    let query = { status };

    // Filter by read status
    if (unreadOnly) {
      query.isRead = false;
    }

    // Filter by severity
    if (severity) {
      query.severity = severity;
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by related entity type
    if (relatedEntityType) {
      query.relatedEntityType = relatedEntityType;
    }

    const total = await collection.countDocuments(query);
    const alerts = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return {
      alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // READ - Get alert by ID
  async findById(alertId) {
    const collection = this.getCollection();
    try {
      return await collection.findOne({ _id: new ObjectId(alertId) });
    } catch (error) {
      return null;
    }
  }

  // UPDATE - Mark alert as read
  async markAsRead(alertId) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { _id: new ObjectId(alertId) },
        {
          $set: {
            isRead: true,
            readAt: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      return false;
    }
  }

  // UPDATE - Mark multiple alerts as read
  async markMultipleAsRead(alertIds) {
    const collection = this.getCollection();
    try {
      const objectIds = alertIds.map(id => new ObjectId(id));
      const result = await collection.updateMany(
        { _id: { $in: objectIds } },
        {
          $set: {
            isRead: true,
            readAt: new Date()
          }
        }
      );
      return result.modifiedCount;
    } catch (error) {
      return 0;
    }
  }

  // READ - Get unread count
  async getUnreadCount() {
    const collection = this.getCollection();
    return await collection.countDocuments({ isRead: false, status: "ACTIVE" });
  }

  // READ - Get alerts by type
  async findByType(type, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 20 } = pagination;

    const total = await collection.countDocuments({ type, status: "ACTIVE" });
    const alerts = await collection
      .find({ type, status: "ACTIVE" })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return {
      alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // UPDATE - Archive alert (soft delete)
  async archiveAlert(alertId) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { _id: new ObjectId(alertId) },
        { $set: { status: "ARCHIVED", archivedAt: new Date() } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      return false;
    }
  }

  // READ - Get alerts summary for dashboard
  async getSummary() {
    const collection = this.getCollection();
    
    const summary = await collection.aggregate([
      { $match: { status: "ACTIVE" } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: {
            $sum: { $cond: ["$isRead", 0, 1] }
          },
          critical: {
            $sum: { $cond: [{ $eq: ["$severity", "CRITICAL"] }, 1, 0] }
          },
          high: {
            $sum: { $cond: [{ $eq: ["$severity", "HIGH"] }, 1, 0] }
          },
          medium: {
            $sum: { $cond: [{ $eq: ["$severity", "MEDIUM"] }, 1, 0] }
          },
          low: {
            $sum: { $cond: [{ $eq: ["$severity", "LOW"] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    if (summary.length === 0) {
      return {
        total: 0,
        unread: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };
    }

    return summary[0];
  }
}

export default new Alert();
