import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";

// #region HospitalBloodRequestModel

/**
 * HospitalBloodRequest Model
 * 
 * PURPOSE:
 * Manages emergency blood requests from hospitals to blood banks
 * Critical for real-time blood availability and emergency response
 * 
 * REQUEST LIFECYCLE:
 * PENDING → ACCEPTED → FULFILLED (successful)
 * PENDING → REJECTED (blood not available)
 * PENDING → CANCELLED (hospital cancels)
 * ACCEPTED → CANCELLED (before fulfillment)
 * 
 * RELATIONSHIPS:
 * - hospitalId → hospitals collection
 * - bloodBankId → organizations collection (type: bloodbank)
 * 
 * URGENCY LEVELS:
 * - CRITICAL: Life-threatening, immediate response required
 * - HIGH: Urgent, within 2-4 hours
 * - MEDIUM: Within 24 hours
 * - LOW: Scheduled, within 48 hours
 */
class HospitalBloodRequest {
    constructor() {
        this.collectionName = "hospitalBloodRequests";
    }

    getCollection() {
        const db = getDB();
        return db.collection(this.collectionName);
    }

    /**
     * CREATE - Create new blood request
     * @param {Object} requestData
     * @returns {Promise<Object>}
     */
    async create(requestData) {
        const collection = this.getCollection();

        const request = {
            // References
            hospitalId: new ObjectId(requestData.hospitalId),
            bloodBankId: new ObjectId(requestData.bloodBankId),

            // Request Details
            bloodGroup: requestData.bloodGroup, // A+, A-, B+, B-, AB+, AB-, O+, O-
            component: requestData.component || "WHOLE_BLOOD", // WHOLE_BLOOD, PLASMA, PLATELETS, RBC
            unitsRequired: requestData.unitsRequired,
            urgency: requestData.urgency || "MEDIUM", // CRITICAL, HIGH, MEDIUM, LOW

            // Patient Information (anonymized for privacy)
            patientAge: requestData.patientAge || null,
            patientGender: requestData.patientGender || null,
            medicalCondition: requestData.medicalCondition || "",

            // Request Status
            status: "PENDING", // PENDING, ACCEPTED, REJECTED, FULFILLED, CANCELLED

            // Fulfillment Details
            unitsFulfilled: 0,
            acceptedAt: null,
            fulfilledAt: null,
            rejectedAt: null,
            cancelledAt: null,

            // Communication
            hospitalNotes: requestData.hospitalNotes || "",
            bloodBankResponse: "",
            rejectionReason: "",
            cancellationReason: "",

            // Tracking
            requestedAt: new Date(),
            expectedDeliveryTime: requestData.expectedDeliveryTime || null,
            actualDeliveryTime: null,

            // Metadata
            priority: this.calculatePriority(requestData.urgency, requestData.bloodGroup),
            isEmergency: requestData.urgency === "CRITICAL",
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await collection.insertOne(request);
        return { _id: result.insertedId, ...request };
    }

    /**
     * Helper - Calculate priority score for sorting
     */
    calculatePriority(urgency, bloodGroup) {
        const urgencyScore = {
            CRITICAL: 100,
            HIGH: 75,
            MEDIUM: 50,
            LOW: 25
        };

        // Rare blood groups get higher priority
        const rareBloodGroups = ["AB-", "B-", "A-", "O-"];
        const rarityBonus = rareBloodGroups.includes(bloodGroup) ? 10 : 0;

        return (urgencyScore[urgency] || 50) + rarityBonus;
    }

    /**
     * READ - Find request by ID
     */
    async findById(id) {
        const collection = this.getCollection();
        try {
            return await collection.findOne({
                _id: new ObjectId(id)
            });
        } catch (error) {
            console.error("Error finding request by ID:", error);
            return null;
        }
    }

    /**
     * READ - Find all requests by hospital
     * @param {string} hospitalId
     * @param {Object} filters - {status, urgency, bloodGroup}
     * @param {Object} pagination
     * @returns {Promise<Object>}
     */
    async findByHospitalId(hospitalId, filters = {}, pagination = {}) {
        const collection = this.getCollection();
        const { page = 1, limit = 20 } = pagination;

        const matchStage = { hospitalId: new ObjectId(hospitalId) };

        // Add filters
        if (filters.status) matchStage.status = filters.status;
        if (filters.urgency) matchStage.urgency = filters.urgency;
        if (filters.bloodGroup) matchStage.bloodGroup = filters.bloodGroup;
        if (filters.component) matchStage.component = filters.component;

        const pipeline = [
            { $match: matchStage },
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
                    path: "$bloodBankDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    bloodBankId: { $ifNull: ["$bloodBankDetails", "$bloodBankId"] }
                }
            },
            {
                $project: {
                    bloodBankDetails: 0
                }
            },
            { $sort: { priority: -1, requestedAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ];

        const total = await collection.countDocuments(matchStage);
        const requests = await collection.aggregate(pipeline).toArray();

        return {
            requests,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * READ - Find all requests by blood bank
     * @param {string} bloodBankId
     * @param {Object} filters
     * @param {Object} pagination
     * @returns {Promise<Object>}
     */
    async findByBloodBankId(bloodBankId, filters = {}, pagination = {}) {
        const collection = this.getCollection();
        const { page = 1, limit = 20 } = pagination;

        const query = { bloodBankId: new ObjectId(bloodBankId) };

        // Add filters
        if (filters.status) query.status = filters.status;
        if (filters.urgency) query.urgency = filters.urgency;
        if (filters.bloodGroup) query.bloodGroup = filters.bloodGroup;
        if (filters.component) query.component = filters.component;

        const total = await collection.countDocuments(query);
        const requests = await collection
            .find(query)
            .sort({ priority: -1, requestedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        return {
            requests,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * READ - Find critical/urgent requests
     * @param {Object} filters - {hospitalId, bloodBankId, bloodGroup}
     * @param {Object} pagination
     * @returns {Promise<Object>}
     */
    async findCriticalRequests(filters = {}, pagination = {}) {
        const collection = this.getCollection();
        const { page = 1, limit = 20 } = pagination;

        const query = {
            urgency: { $in: ["CRITICAL", "HIGH"] },
            status: { $in: ["PENDING", "ACCEPTED"] }
        };

        // Add optional filters
        if (filters.hospitalId) {
            query.hospitalId = new ObjectId(filters.hospitalId);
        }
        if (filters.bloodBankId) {
            query.bloodBankId = new ObjectId(filters.bloodBankId);
        }
        if (filters.bloodGroup) {
            query.bloodGroup = filters.bloodGroup;
        }

        const total = await collection.countDocuments(query);
        const requests = await collection
            .find(query)
            .sort({ priority: -1, requestedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        return {
            requests,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * READ - Get requests with hospital and blood bank details (aggregated)
     */
    async getRequestsWithDetails(filters = {}, pagination = {}) {
        const collection = this.getCollection();
        const { page = 1, limit = 20 } = pagination;

        const matchStage = {};
        if (filters.hospitalId) {
            matchStage.hospitalId = new ObjectId(filters.hospitalId);
        }
        if (filters.bloodBankId) {
            matchStage.bloodBankId = new ObjectId(filters.bloodBankId);
        }
        if (filters.status) {
            matchStage.status = filters.status;
        }
        if (filters.urgency) {
            matchStage.urgency = filters.urgency;
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
                    from: "organizations",
                    localField: "bloodBankId",
                    foreignField: "_id",
                    as: "bloodBank"
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
                    path: "$bloodBank",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    bloodGroup: 1,
                    component: 1,
                    unitsRequired: 1,
                    unitsFulfilled: 1,
                    urgency: 1,
                    status: 1,
                    priority: 1,
                    requestedAt: 1,
                    acceptedAt: 1,
                    fulfilledAt: 1,
                    hospitalNotes: 1,
                    bloodBankResponse: 1,
                    "hospital.name": 1,
                    "hospital.hospitalCode": 1,
                    "hospital.phone": 1,
                    "hospital.address": 1,
                    "bloodBank.name": 1,
                    "bloodBank.organizationCode": 1,
                    "bloodBank.phone": 1,
                    "bloodBank.address": 1
                }
            },
            { $sort: { priority: -1, requestedAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ];

        const requests = await collection.aggregate(pipeline).toArray();
        const total = await collection.countDocuments(matchStage);

        return {
            requests,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * UPDATE - Accept request (Blood Bank action)
     * @param {string} id
     * @param {string} bloodBankResponse
     * @returns {Promise<boolean>}
     */
    async acceptRequest(id, bloodBankResponse = "") {
        const collection = this.getCollection();
        try {
            const result = await collection.updateOne(
                {
                    _id: new ObjectId(id),
                    status: "PENDING"
                },
                {
                    $set: {
                        status: "ACCEPTED",
                        acceptedAt: new Date(),
                        bloodBankResponse,
                        updatedAt: new Date()
                    }
                }
            );
            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error accepting request:", error);
            return false;
        }
    }

    /**
     * UPDATE - Reject request (Blood Bank action)
     * @param {string} id
     * @param {string} rejectionReason
     * @returns {Promise<boolean>}
     */
    async rejectRequest(id, rejectionReason) {
        const collection = this.getCollection();
        try {
            const result = await collection.updateOne(
                {
                    _id: new ObjectId(id),
                    status: "PENDING"
                },
                {
                    $set: {
                        status: "REJECTED",
                        rejectedAt: new Date(),
                        rejectionReason,
                        updatedAt: new Date()
                    }
                }
            );
            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error rejecting request:", error);
            return false;
        }
    }

    /**
     * UPDATE - Fulfill request (Blood Bank action)
     * @param {string} id
     * @param {number} unitsFulfilled
     * @returns {Promise<boolean>}
     */
    async fulfillRequest(id, unitsFulfilled) {
        const collection = this.getCollection();
        try {
            const result = await collection.updateOne(
                {
                    _id: new ObjectId(id),
                    status: "ACCEPTED"
                },
                {
                    $set: {
                        status: "FULFILLED",
                        unitsFulfilled,
                        fulfilledAt: new Date(),
                        actualDeliveryTime: new Date(),
                        updatedAt: new Date()
                    }
                }
            );
            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error fulfilling request:", error);
            return false;
        }
    }

    /**
     * UPDATE - Cancel request (Hospital action)
     * @param {string} id
     * @param {string} cancellationReason
     * @returns {Promise<boolean>}
     */
    async cancelRequest(id, cancellationReason) {
        const collection = this.getCollection();
        try {
            const result = await collection.updateOne(
                {
                    _id: new ObjectId(id),
                    status: { $in: ["PENDING", "ACCEPTED"] }
                },
                {
                    $set: {
                        status: "CANCELLED",
                        cancelledAt: new Date(),
                        cancellationReason,
                        updatedAt: new Date()
                    }
                }
            );
            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error cancelling request:", error);
            return false;
        }
    }

    /**
     * UPDATE - Update request details
     */
    async updateById(id, updateData) {
        const collection = this.getCollection();
        try {
            // Prevent updating critical fields
            delete updateData._id;
            delete updateData.hospitalId;
            delete updateData.bloodBankId;
            delete updateData.requestedAt;
            delete updateData.status;

            const result = await collection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { ...updateData, updatedAt: new Date() } }
            );
            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error updating request:", error);
            return false;
        }
    }

    /**
     * DELETE - Delete request
     */
    async deleteById(id) {
        const collection = this.getCollection();
        try {
            const result = await collection.deleteOne({
                _id: new ObjectId(id)
            });
            return result.deletedCount > 0;
        } catch (error) {
            console.error("Error deleting request:", error);
            return false;
        }
    }

    /**
     * ANALYTICS - Get request statistics for hospital
     */
    async getStatsByHospital(hospitalId) {
        const collection = this.getCollection();
        try {
            const total = await collection.countDocuments({
                hospitalId: new ObjectId(hospitalId)
            });

            const pending = await collection.countDocuments({
                hospitalId: new ObjectId(hospitalId),
                status: "PENDING"
            });

            const accepted = await collection.countDocuments({
                hospitalId: new ObjectId(hospitalId),
                status: "ACCEPTED"
            });

            const fulfilled = await collection.countDocuments({
                hospitalId: new ObjectId(hospitalId),
                status: "FULFILLED"
            });

            const rejected = await collection.countDocuments({
                hospitalId: new ObjectId(hospitalId),
                status: "REJECTED"
            });

            const cancelled = await collection.countDocuments({
                hospitalId: new ObjectId(hospitalId),
                status: "CANCELLED"
            });

            // Get total units requested and fulfilled
            const aggregation = await collection.aggregate([
                { $match: { hospitalId: new ObjectId(hospitalId) } },
                {
                    $group: {
                        _id: null,
                        totalUnitsRequested: { $sum: "$unitsRequired" },
                        totalUnitsFulfilled: { $sum: "$unitsFulfilled" }
                    }
                }
            ]).toArray();

            const units = aggregation[0] || {
                totalUnitsRequested: 0,
                totalUnitsFulfilled: 0
            };

            return {
                total,
                byStatus: {
                    PENDING: pending,
                    ACCEPTED: accepted,
                    FULFILLED: fulfilled,
                    REJECTED: rejected,
                    CANCELLED: cancelled
                },
                units: {
                    requested: units.totalUnitsRequested,
                    fulfilled: units.totalUnitsFulfilled,
                    fulfillmentRate: units.totalUnitsRequested > 0
                        ? ((units.totalUnitsFulfilled / units.totalUnitsRequested) * 100).toFixed(2)
                        : 0
                }
            };
        } catch (error) {
            console.error("Error getting hospital stats:", error);
            return null;
        }
    }

    /**
     * ANALYTICS - Get request statistics for blood bank
     */
    async getStatsByBloodBank(bloodBankId) {
        const collection = this.getCollection();
        try {
            const total = await collection.countDocuments({
                bloodBankId: new ObjectId(bloodBankId)
            });

            const pending = await collection.countDocuments({
                bloodBankId: new ObjectId(bloodBankId),
                status: "PENDING"
            });

            const accepted = await collection.countDocuments({
                bloodBankId: new ObjectId(bloodBankId),
                status: "ACCEPTED"
            });

            const fulfilled = await collection.countDocuments({
                bloodBankId: new ObjectId(bloodBankId),
                status: "FULFILLED"
            });

            const rejected = await collection.countDocuments({
                bloodBankId: new ObjectId(bloodBankId),
                status: "REJECTED"
            });

            // Get total units fulfilled
            const aggregation = await collection.aggregate([
                { $match: { bloodBankId: new ObjectId(bloodBankId) } },
                {
                    $group: {
                        _id: null,
                        totalUnitsRequested: { $sum: "$unitsRequired" },
                        totalUnitsFulfilled: { $sum: "$unitsFulfilled" }
                    }
                }
            ]).toArray();

            const units = aggregation[0] || {
                totalUnitsRequested: 0,
                totalUnitsFulfilled: 0
            };

            return {
                total,
                byStatus: {
                    PENDING: pending,
                    ACCEPTED: accepted,
                    FULFILLED: fulfilled,
                    REJECTED: rejected
                },
                units: {
                    requested: units.totalUnitsRequested,
                    fulfilled: units.totalUnitsFulfilled,
                    fulfillmentRate: units.totalUnitsRequested > 0
                        ? ((units.totalUnitsFulfilled / units.totalUnitsRequested) * 100).toFixed(2)
                        : 0
                }
            };
        } catch (error) {
            console.error("Error getting blood bank stats:", error);
            return null;
        }
    }

    /**
     * ANALYTICS - Get requests by blood group
     */
    async getStatsByBloodGroup() {
        const collection = this.getCollection();
        try {
            return await collection.aggregate([
                {
                    $group: {
                        _id: "$bloodGroup",
                        totalRequests: { $sum: 1 },
                        totalUnitsRequested: { $sum: "$unitsRequired" },
                        totalUnitsFulfilled: { $sum: "$unitsFulfilled" },
                        criticalRequests: {
                            $sum: { $cond: [{ $eq: ["$urgency", "CRITICAL"] }, 1, 0] }
                        }
                    }
                },
                { $sort: { totalRequests: -1 } }
            ]).toArray();
        } catch (error) {
            console.error("Error getting blood group stats:", error);
            return [];
        }
    }

    /**
     * ANALYTICS - Get average response time
     */
    async getAverageResponseTime(bloodBankId = null) {
        const collection = this.getCollection();
        try {
            const matchStage = {
                acceptedAt: { $ne: null },
                requestedAt: { $ne: null }
            };

            if (bloodBankId) {
                matchStage.bloodBankId = new ObjectId(bloodBankId);
            }

            const result = await collection.aggregate([
                { $match: matchStage },
                {
                    $project: {
                        responseTime: {
                            $subtract: ["$acceptedAt", "$requestedAt"]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgResponseTime: { $avg: "$responseTime" }
                    }
                }
            ]).toArray();

            if (result.length > 0) {
                const avgMs = result[0].avgResponseTime;
                const avgMinutes = Math.round(avgMs / 60000);
                return {
                    milliseconds: avgMs,
                    minutes: avgMinutes,
                    hours: (avgMinutes / 60).toFixed(2)
                };
            }

            return null;
        } catch (error) {
            console.error("Error calculating average response time:", error);
            return null;
        }
    }
}

export default new HospitalBloodRequest();
