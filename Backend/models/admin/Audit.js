import { getDB } from "../../config/db.js";
import { ObjectId } from "mongodb";

// #region AuditModel

/**
 * Audit Model
 * Manages audit logs and activity tracking (append-only, immutable)
 */
class Audit {
  constructor() {
    this.collectionName = "audit_logs";
  }

  getCollection() {
    const db = getDB();
    return db.collection(this.collectionName);
  }

  // CREATE - Log an audit event (append-only)
  async create(auditData) {
    const collection = this.getCollection();
    const newLog = {
      entityType: auditData.entityType, // ORGANIZATION, EMERGENCY, BLOOD_STOCK, ALERT, HOSPITAL, BLOODBANK, NGO
      action: auditData.action, // CREATED, UPDATED, APPROVED, REJECTED, SUSPENDED, ACTIVATED, DELETED
      performedBy: auditData.performedBy, // User email/code
      performedByRole: auditData.performedByRole, // ADMIN, Doctor, Manager, etc
      entityId: auditData.entityId ? new ObjectId(auditData.entityId) : null,
      entityCode: auditData.entityCode,
      entityName: auditData.entityName,
      changes: auditData.changes || { before: {}, after: {} }, // Track what changed
      ipAddress: auditData.ipAddress,
      timestamp: new Date(),
      status: auditData.status || "SUCCESS", // SUCCESS or FAILURE
      description: auditData.description,
      errorMessage: auditData.errorMessage || null,
      metadata: auditData.metadata || {} // Additional info
    };

    const result = await collection.insertOne(newLog);
    return { _id: result.insertedId, ...newLog };
  }

  // READ - Get all audit logs with pagination and filters
  async findAll(filters = {}, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 50 } = pagination;
    const { entityType, action, performedBy, performedByRole, status, dateFrom, dateTo } = filters;

    let query = {};

    // Filter by entity type
    if (entityType) {
      query.entityType = entityType;
    }

    // Filter by action
    if (action) {
      query.action = action;
    }

    // Filter by performed by
    if (performedBy) {
      query.performedBy = performedBy.toLowerCase();
    }

    // Filter by role
    if (performedByRole) {
      query.performedByRole = performedByRole;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      query.timestamp = {};
      if (dateFrom) {
        query.timestamp.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.timestamp.$lte = new Date(dateTo);
      }
    }

    const total = await collection.countDocuments(query);
    const logs = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // READ - Get audit log by ID
  async findById(logId) {
    const collection = this.getCollection();
    try {
      return await collection.findOne({ _id: new ObjectId(logId) });
    } catch (error) {
      return null;
    }
  }

  // READ - Get logs by entity type
  async findByEntityType(entityType, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 50 } = pagination;

    const total = await collection.countDocuments({ entityType });
    const logs = await collection
      .find({ entityType })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // READ - Get logs by action
  async findByAction(action, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 50 } = pagination;

    const total = await collection.countDocuments({ action });
    const logs = await collection
      .find({ action })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // READ - Get logs by entity ID
  async findByEntityId(entityId, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 50 } = pagination;

    try {
      const objectId = new ObjectId(entityId);
      const total = await collection.countDocuments({ entityId: objectId });
      const logs = await collection
        .find({ entityId: objectId })
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      return { logs: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
    }
  }

  // READ - Get audit statistics
  async getStats(dateFrom, dateTo) {
    const collection = this.getCollection();

    let matchStage = {};
    if (dateFrom || dateTo) {
      matchStage.timestamp = {};
      if (dateFrom) {
        matchStage.timestamp.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        matchStage.timestamp.$lte = new Date(dateTo);
      }
    }

    const stats = await collection.aggregate([
      { $match: matchStage },
      {
        $facet: {
          totalLogs: [{ $count: "count" }],
          byEntityType: [
            { $group: { _id: "$entityType", count: { $sum: 1 } } }
          ],
          byAction: [
            { $group: { _id: "$action", count: { $sum: 1 } } }
          ],
          byStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } }
          ],
          byPerformedBy: [
            { $group: { _id: "$performedBy", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]).toArray();

    if (stats.length === 0) {
      return {
        totalLogs: 0,
        byEntityType: [],
        byAction: [],
        byStatus: [],
        byPerformedBy: []
      };
    }

    const result = stats[0];
    return {
      totalLogs: result.totalLogs.length > 0 ? result.totalLogs[0].count : 0,
      byEntityType: result.byEntityType,
      byAction: result.byAction,
      byStatus: result.byStatus,
      byPerformedBy: result.byPerformedBy
    };
  }

  // READ - Get recent activity
  async getRecentActivity(limit = 20) {
    const collection = this.getCollection();

    return await collection
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  // READ - Count logs by entity type
  async countByEntityType(entityType) {
    const collection = this.getCollection();
    return await collection.countDocuments({ entityType });
  }

  // READ - Get logs for a specific entity code (track all changes to that entity)
  async findByEntityCode(entityCode, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 50 } = pagination;

    const total = await collection.countDocuments({ entityCode });
    const logs = await collection
      .find({ entityCode })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

export default new Audit();
