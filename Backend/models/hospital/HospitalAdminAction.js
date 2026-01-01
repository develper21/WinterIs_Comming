import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";

// #region HospitalAdminActionModel

/**
 * HospitalAdminAction Model
 * 
 * PURPOSE:
 * Audit trail for all admin actions on hospitals
 * Ensures accountability and traceability
 * 
 * ACTIONS TRACKED:
 * - VERIFY: Admin verifies a pending hospital
 * - REJECT: Admin rejects a pending hospital
 * - SUSPEND: Admin suspends a verified hospital
 * - REACTIVATE: Admin reactivates a suspended hospital
 * 
 * RELATIONSHIPS:
 * - hospitalId → hospitals collection
 * - adminId → admins collection
 */
class HospitalAdminAction {
    constructor() {
        this.collectionName = "hospitalAdminActions";
    }

    getCollection() {
        const db = getDB();
        return db.collection(this.collectionName);
    }

    /**
     * CREATE - Log a new admin action
     * @param {Object} actionData
     * @returns {Promise<Object>}
     */
    async create(actionData) {
        const collection = this.getCollection();

        const action = {
            hospitalId: new ObjectId(actionData.hospitalId),
            adminId: new ObjectId(actionData.adminId),
            action: actionData.action, // VERIFY, REJECT, SUSPEND, REACTIVATE
            reason: actionData.reason || "",
            remarks: actionData.remarks || "",
            previousStatus: actionData.previousStatus || null,
            newStatus: actionData.newStatus || null,
            metadata: actionData.metadata || {}, // Additional context
            actionAt: new Date()
        };

        const result = await collection.insertOne(action);
        return { _id: result.insertedId, ...action };
    }

    /**
     * READ - Find action by ID
     */
    async findById(id) {
        const collection = this.getCollection();
        try {
            return await collection.findOne({
                _id: new ObjectId(id)
            });
        } catch (error) {
            console.error("Error finding action by ID:", error);
            return null;
        }
    }

    /**
     * READ - Find all actions for a hospital
     * @param {string} hospitalId
     * @param {Object} pagination
     * @returns {Promise<Object>}
     */
    async findByHospitalId(hospitalId, pagination = {}) {
        const collection = this.getCollection();
        const { page = 1, limit = 20 } = pagination;

        const query = { hospitalId: new ObjectId(hospitalId) };

        const total = await collection.countDocuments(query);
        const actions = await collection
            .find(query)
            .sort({ actionAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
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
     * @param {string} adminId
     * @param {Object} pagination
     * @returns {Promise<Object>}
     */
    async findByAdminId(adminId, pagination = {}) {
        const collection = this.getCollection();
        const { page = 1, limit = 20 } = pagination;

        const query = { adminId: new ObjectId(adminId) };

        const total = await collection.countDocuments(query);
        const actions = await collection
            .find(query)
            .sort({ actionAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
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
     * READ - Find actions by action type
     * @param {string} action - VERIFY, REJECT, SUSPEND, REACTIVATE
     * @param {Object} pagination
     * @returns {Promise<Object>}
     */
    async findByAction(action, pagination = {}) {
        const collection = this.getCollection();
        const { page = 1, limit = 20 } = pagination;

        const query = { action };

        const total = await collection.countDocuments(query);
        const actions = await collection
            .find(query)
            .sort({ actionAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
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
     * READ - Get latest action for a hospital
     * @param {string} hospitalId
     * @returns {Promise<Object|null>}
     */
    async getLatestByHospital(hospitalId) {
        const collection = this.getCollection();
        try {
            return await collection.findOne(
                { hospitalId: new ObjectId(hospitalId) },
                { sort: { actionAt: -1 } }
            );
        } catch (error) {
            console.error("Error getting latest action:", error);
            return null;
        }
    }

    /**
     * READ - Find actions within date range
     * @param {Date} startDate
     * @param {Date} endDate
     * @param {Object} filters - {hospitalId, adminId, action}
     * @param {Object} pagination
     * @returns {Promise<Object>}
     */
    async findByDateRange(startDate, endDate, filters = {}, pagination = {}) {
        const collection = this.getCollection();
        const { page = 1, limit = 20 } = pagination;

        const query = {
            actionAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        // Add optional filters
        if (filters.hospitalId) {
            query.hospitalId = new ObjectId(filters.hospitalId);
        }
        if (filters.adminId) {
            query.adminId = new ObjectId(filters.adminId);
        }
        if (filters.action) {
            query.action = filters.action;
        }

        const total = await collection.countDocuments(query);
        const actions = await collection
            .find(query)
            .sort({ actionAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
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
     * READ - Get action history with hospital and admin details (aggregated)
     * @param {Object} filters
     * @param {Object} pagination
     * @returns {Promise<Object>}
     */
    async getActionHistoryWithDetails(filters = {}, pagination = {}) {
        const collection = this.getCollection();
        const { page = 1, limit = 20 } = pagination;

        const matchStage = {};
        if (filters.hospitalId) {
            matchStage.hospitalId = new ObjectId(filters.hospitalId);
        }
        if (filters.adminId) {
            matchStage.adminId = new ObjectId(filters.adminId);
        }
        if (filters.action) {
            matchStage.action = filters.action;
        }

        const pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: "hospitals",
                    localField: "hospitalId",
                    foreignField: "_id",
                    as: "hospital"
                }
            },
            {
                $lookup: {
                    from: "admins",
                    localField: "adminId",
                    foreignField: "_id",
                    as: "admin"
                }
            },
            {
                $unwind: {
                    path: "$hospital",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: "$admin",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    action: 1,
                    reason: 1,
                    remarks: 1,
                    previousStatus: 1,
                    newStatus: 1,
                    actionAt: 1,
                    "hospital.name": 1,
                    "hospital.hospitalCode": 1,
                    "hospital.email": 1,
                    "admin.name": 1,
                    "admin.email": 1,
                    "admin.adminCode": 1
                }
            },
            { $sort: { actionAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ];

        const actions = await collection.aggregate(pipeline).toArray();
        const total = await collection.countDocuments(matchStage);

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
     * DELETE - Delete action (Admin only, for cleanup)
     */
    async deleteById(id) {
        const collection = this.getCollection();
        try {
            const result = await collection.deleteOne({
                _id: new ObjectId(id)
            });
            return result.deletedCount > 0;
        } catch (error) {
            console.error("Error deleting action:", error);
            return false;
        }
    }

    /**
     * DELETE - Delete all actions for a hospital (when hospital is deleted)
     */
    async deleteByHospitalId(hospitalId) {
        const collection = this.getCollection();
        try {
            const result = await collection.deleteMany({
                hospitalId: new ObjectId(hospitalId)
            });
            return result.deletedCount;
        } catch (error) {
            console.error("Error deleting actions by hospital:", error);
            return 0;
        }
    }

    /**
     * ANALYTICS - Get action statistics
     */
    async getStats() {
        const collection = this.getCollection();
        try {
            const total = await collection.countDocuments();
            const verify = await collection.countDocuments({ action: "VERIFY" });
            const reject = await collection.countDocuments({ action: "REJECT" });
            const suspend = await collection.countDocuments({ action: "SUSPEND" });
            const reactivate = await collection.countDocuments({ action: "REACTIVATE" });

            return {
                total,
                byAction: {
                    VERIFY: verify,
                    REJECT: reject,
                    SUSPEND: suspend,
                    REACTIVATE: reactivate
                }
            };
        } catch (error) {
            console.error("Error getting action stats:", error);
            return null;
        }
    }

    /**
     * ANALYTICS - Get admin activity statistics
     * @param {string} adminId
     * @returns {Promise<Object>}
     */
    async getAdminStats(adminId) {
        const collection = this.getCollection();
        try {
            const total = await collection.countDocuments({
                adminId: new ObjectId(adminId)
            });

            const verify = await collection.countDocuments({
                adminId: new ObjectId(adminId),
                action: "VERIFY"
            });

            const reject = await collection.countDocuments({
                adminId: new ObjectId(adminId),
                action: "REJECT"
            });

            const suspend = await collection.countDocuments({
                adminId: new ObjectId(adminId),
                action: "SUSPEND"
            });

            const reactivate = await collection.countDocuments({
                adminId: new ObjectId(adminId),
                action: "REACTIVATE"
            });

            return {
                total,
                byAction: {
                    VERIFY: verify,
                    REJECT: reject,
                    SUSPEND: suspend,
                    REACTIVATE: reactivate
                }
            };
        } catch (error) {
            console.error("Error getting admin stats:", error);
            return null;
        }
    }

    /**
     * ANALYTICS - Get action count by admin (leaderboard)
     */
    async getActionCountByAdmin() {
        const collection = this.getCollection();
        try {
            return await collection.aggregate([
                {
                    $group: {
                        _id: "$adminId",
                        totalActions: { $sum: 1 },
                        verifications: {
                            $sum: { $cond: [{ $eq: ["$action", "VERIFY"] }, 1, 0] }
                        },
                        rejections: {
                            $sum: { $cond: [{ $eq: ["$action", "REJECT"] }, 1, 0] }
                        },
                        suspensions: {
                            $sum: { $cond: [{ $eq: ["$action", "SUSPEND"] }, 1, 0] }
                        },
                        reactivations: {
                            $sum: { $cond: [{ $eq: ["$action", "REACTIVATE"] }, 1, 0] }
                        }
                    }
                },
                {
                    $lookup: {
                        from: "admins",
                        localField: "_id",
                        foreignField: "_id",
                        as: "admin"
                    }
                },
                {
                    $unwind: {
                        path: "$admin",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        totalActions: 1,
                        verifications: 1,
                        rejections: 1,
                        suspensions: 1,
                        reactivations: 1,
                        "admin.name": 1,
                        "admin.email": 1,
                        "admin.adminCode": 1
                    }
                },
                { $sort: { totalActions: -1 } }
            ]).toArray();
        } catch (error) {
            console.error("Error getting action count by admin:", error);
            return [];
        }
    }

    /**
     * ANALYTICS - Get recent actions (for activity feed)
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    async getRecentActions(limit = 10) {
        const collection = this.getCollection();
        try {
            return await collection.aggregate([
                { $sort: { actionAt: -1 } },
                { $limit: limit },
                {
                    $lookup: {
                        from: "hospitals",
                        localField: "hospitalId",
                        foreignField: "_id",
                        as: "hospital"
                    }
                },
                {
                    $lookup: {
                        from: "admins",
                        localField: "adminId",
                        foreignField: "_id",
                        as: "admin"
                    }
                },
                {
                    $unwind: {
                        path: "$hospital",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $unwind: {
                        path: "$admin",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        action: 1,
                        reason: 1,
                        actionAt: 1,
                        "hospital.name": 1,
                        "hospital.hospitalCode": 1,
                        "admin.name": 1,
                        "admin.adminCode": 1
                    }
                }
            ]).toArray();
        } catch (error) {
            console.error("Error getting recent actions:", error);
            return [];
        }
    }
}

export default new HospitalAdminAction();
