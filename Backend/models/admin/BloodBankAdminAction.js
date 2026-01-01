import { getDB } from "../../config/db.js";
import { ObjectId } from "mongodb";

// #region BloodBankAdminActionModel

/**
 * BloodBankAdminAction Model
 * 
 * PURPOSE:
 * - Audit trail for ALL admin actions on blood banks
 * - Track verification, rejection, suspension, reactivation
 * - Maintain accountability and transparency
 * - Enable admin activity reporting
 * 
 * COLLECTION: bloodbank_admin_actions
 * 
 * RELATIONSHIPS:
 * - bloodBankId → organizations (type: bloodbank)
 * - adminId → admins
 */
class BloodBankAdminAction {
  constructor() {
    this.collectionName = "bloodbank_admin_actions";
  }

  getCollection() {
    const db = getDB();
    return db.collection(this.collectionName);
  }

  /**
   * CREATE - Log admin action
   * 
   * @param {Object} actionData
   * @param {string} actionData.bloodBankId - Blood Bank ObjectId
   * @param {string} actionData.adminId - Admin ObjectId
   * @param {string} actionData.actionType - VERIFY | REJECT | SUSPEND | REACTIVATE
   * @param {string} actionData.reason - Reason for action
   * @param {Object} actionData.metadata - Additional metadata
   */
  async create(actionData) {
    const collection = this.getCollection();
    
    const newAction = {
      bloodBankId: new ObjectId(actionData.bloodBankId),
      adminId: new ObjectId(actionData.adminId),
      
      // Action Details
      actionType: actionData.actionType, // VERIFY | REJECT | SUSPEND | REACTIVATE
      reason: actionData.reason || null,
      remarks: actionData.remarks || null,
      
      // Previous and New Status
      previousStatus: actionData.previousStatus || null,
      newStatus: actionData.newStatus,
      
      // Metadata
      metadata: {
        ipAddress: actionData.metadata?.ipAddress || null,
        userAgent: actionData.metadata?.userAgent || null,
        location: actionData.metadata?.location || null,
        ...actionData.metadata
      },
      
      // Timestamps
      actionTimestamp: new Date(),
      createdAt: new Date()
    };

    const result = await collection.insertOne(newAction);
    return { _id: result.insertedId, ...newAction };
  }

  /**
   * READ - Find all actions for a blood bank
   */
  async findByBloodBankId(bloodBankId, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 20 } = pagination;

    const query = { bloodBankId: new ObjectId(bloodBankId) };

    const total = await collection.countDocuments(query);
    const actions = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ actionTimestamp: -1 })
      .toArray();

    return {
      actions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * READ - Find all actions by an admin
   */
  async findByAdminId(adminId, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 20 } = pagination;

    const query = { adminId: new ObjectId(adminId) };

    const total = await collection.countDocuments(query);
    const actions = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ actionTimestamp: -1 })
      .toArray();

    return {
      actions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * READ - Find actions by type
   */
  async findByActionType(actionType, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 20 } = pagination;

    const query = { actionType };

    const total = await collection.countDocuments(query);
    const actions = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ actionTimestamp: -1 })
      .toArray();

    return {
      actions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * READ - Find actions within date range
   */
  async findByDateRange(startDate, endDate, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 20 } = pagination;

    const query = {
      actionTimestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const total = await collection.countDocuments(query);
    const actions = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ actionTimestamp: -1 })
      .toArray();

    return {
      actions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * READ - Get action by ID
   */
  async findById(id) {
    const collection = this.getCollection();
    try {
      return await collection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error("Error finding action by ID:", error);
      return null;
    }
  }

  /**
   * READ - Get complete audit trail for a blood bank with admin details
   */
  async getAuditTrailWithDetails(bloodBankId) {
    const collection = this.getCollection();
    try {
      return await collection.aggregate([
        { $match: { bloodBankId: new ObjectId(bloodBankId) } },
        {
          $lookup: {
            from: "admins",
            localField: "adminId",
            foreignField: "_id",
            as: "adminDetails"
          }
        },
        {
          $lookup: {
            from: "organizations",
            localField: "bloodBankId",
            foreignField: "_id",
            as: "bloodBankDetails"
          }
        },
        {
          $unwind: {
            path: "$adminDetails",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: "$bloodBankDetails",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            actionType: 1,
            reason: 1,
            remarks: 1,
            previousStatus: 1,
            newStatus: 1,
            actionTimestamp: 1,
            "admin.name": "$adminDetails.name",
            "admin.email": "$adminDetails.email",
            "admin.adminCode": "$adminDetails.adminCode",
            "bloodBank.name": "$bloodBankDetails.name",
            "bloodBank.organizationCode": "$bloodBankDetails.organizationCode"
          }
        },
        { $sort: { actionTimestamp: -1 } }
      ]).toArray();
    } catch (error) {
      console.error("Error getting audit trail:", error);
      return [];
    }
  }

  /**
   * ANALYTICS - Get admin action statistics
   */
  async getAdminActionStats(adminId = null) {
    const collection = this.getCollection();
    try {
      const matchStage = adminId 
        ? { $match: { adminId: new ObjectId(adminId) } }
        : { $match: {} };

      return await collection.aggregate([
        matchStage,
        {
          $group: {
            _id: "$actionType",
            count: { $sum: 1 },
            lastAction: { $max: "$actionTimestamp" }
          }
        },
        { $sort: { count: -1 } }
      ]).toArray();
    } catch (error) {
      console.error("Error getting admin action stats:", error);
      return [];
    }
  }

  /**
   * ANALYTICS - Get daily action counts
   */
  async getDailyActionCounts(days = 30) {
    const collection = this.getCollection();
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      return await collection.aggregate([
        {
          $match: {
            actionTimestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$actionTimestamp" } },
              actionType: "$actionType"
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.date": -1 } }
      ]).toArray();
    } catch (error) {
      console.error("Error getting daily action counts:", error);
      return [];
    }
  }

  /**
   * DELETE - Remove action (admin only, for data cleanup)
   */
  async deleteById(id) {
    const collection = this.getCollection();
    try {
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting action:", error);
      return false;
    }
  }
}

export default new BloodBankAdminAction();
