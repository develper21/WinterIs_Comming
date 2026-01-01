import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";

// #region HospitalNgoDriveModel

/**
 * HospitalNgoDrive Model
 * 
 * PURPOSE:
 * Manages blood donation drives initiated by hospitals in collaboration with NGOs
 * Facilitates community blood donation campaigns
 * 
 * DRIVE LIFECYCLE:
 * PENDING → ACCEPTED → SCHEDULED → IN_PROGRESS → COMPLETED (successful)
 * PENDING → REJECTED (NGO declines)
 * PENDING/ACCEPTED/SCHEDULED → CANCELLED (either party cancels)
 * SCHEDULED → EXPIRED (drive date passed without execution)
 * 
 * RELATIONSHIPS:
 * - hospitalId → hospitals collection
 * - ngoId → organizations collection (type: ngo)
 * - bloodBankId → organizations collection (type: bloodbank) [optional, for collection]
 * 
 * DRIVE TYPES:
 * - EMERGENCY: Urgent blood collection drive
 * - SCHEDULED: Planned community drive
 * - CORPORATE: Corporate office blood donation camp
 * - EDUCATIONAL: School/college blood donation camp
 */
class HospitalNgoDrive {
    constructor() {
        this.collectionName = "hospitalNgoDrives";
    }

    getCollection() {
        const db = getDB();
        return db.collection(this.collectionName);
    }

    /**
     * CREATE - Create new blood donation drive
     * @param {Object} driveData
     * @returns {Promise<Object>}
     */
    async create(driveData) {
        const collection = this.getCollection();

        const drive = {
            // References
            hospitalId: new ObjectId(driveData.hospitalId),
            ngoId: new ObjectId(driveData.ngoId),
            bloodBankId: driveData.bloodBankId ? new ObjectId(driveData.bloodBankId) : null,

            // Drive Information
            driveTitle: driveData.driveTitle,
            driveType: driveData.driveType || "SCHEDULED", // EMERGENCY, SCHEDULED, CORPORATE, EDUCATIONAL
            description: driveData.description || "",

            // Location Details
            location: {
                venueName: driveData.location?.venueName || driveData.location,
                address: driveData.location?.address || "",
                city: driveData.location?.city || "",
                state: driveData.location?.state || "",
                pinCode: driveData.location?.pinCode || "",
                coordinates: driveData.location?.coordinates || null // [longitude, latitude]
            },

            // Schedule
            driveDate: new Date(driveData.driveDate),
            startTime: driveData.startTime || "09:00",
            endTime: driveData.endTime || "17:00",
            duration: driveData.duration || 8, // hours

            // Targets & Goals
            expectedDonors: driveData.expectedDonors || 0,
            expectedUnits: driveData.expectedUnits || 0,
            targetBloodGroups: driveData.targetBloodGroups || [], // Specific blood groups needed

            // Actual Results
            actualDonors: 0,
            actualUnits: 0,
            donorsByBloodGroup: {
                "O+": 0,
                "O-": 0,
                "A+": 0,
                "A-": 0,
                "B+": 0,
                "B-": 0,
                "AB+": 0,
                "AB-": 0
            },

            // Drive Status
            status: "PENDING", // PENDING, ACCEPTED, REJECTED, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, EXPIRED

            // Lifecycle Timestamps
            requestedAt: new Date(),
            acceptedAt: null,
            scheduledAt: null,
            startedAt: null,
            completedAt: null,
            rejectedAt: null,
            cancelledAt: null,

            // Communication
            hospitalNotes: driveData.hospitalNotes || "",
            ngoResponse: "",
            rejectionReason: "",
            cancellationReason: "",
            cancellationBy: null, // "HOSPITAL" or "NGO"

            // Resources & Logistics
            facilitiesProvided: driveData.facilitiesProvided || [], // Refreshments, Medical staff, etc.
            equipmentRequired: driveData.equipmentRequired || [], // Blood collection kits, etc.
            volunteersRequired: driveData.volunteersRequired || 0,
            volunteersAssigned: 0,

            // Publicity & Outreach
            publicityChannels: driveData.publicityChannels || [], // Social media, Posters, etc.
            expectedReach: driveData.expectedReach || 0,

            // Metadata
            isPublic: driveData.isPublic !== false, // Public drives visible to all
            isEmergency: driveData.driveType === "EMERGENCY",
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await collection.insertOne(drive);
        return { _id: result.insertedId, ...drive };
    }

    /**
     * READ - Find drive by ID
     */
    async findById(id) {
        const collection = this.getCollection();
        try {
            return await collection.findOne({
                _id: new ObjectId(id)
            });
        } catch (error) {
            console.error("Error finding drive by ID:", error);
            return null;
        }
    }

    /**
     * READ - Find all drives by hospital
     * @param {string} hospitalId
     * @param {Object} filters - {status, driveType}
     * @param {Object} pagination
     * @returns {Promise<Object>}
     */
    async findByHospitalId(hospitalId, filters = {}, pagination = {}) {
        const collection = this.getCollection();
        const { page = 1, limit = 20 } = pagination;

        const query = { hospitalId: new ObjectId(hospitalId) };

        // Add filters
        if (filters.status) query.status = filters.status;
        if (filters.driveType) query.driveType = filters.driveType;

        const total = await collection.countDocuments(query);
        const drives = await collection
            .find(query)
            .sort({ driveDate: -1, requestedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        return {
            drives,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * READ - Find all drives by NGO
     * @param {string} ngoId
     * @param {Object} filters
     * @param {Object} pagination
     * @returns {Promise<Object>}
     */
    async findByNgoId(ngoId, filters = {}, pagination = {}) {
        const collection = this.getCollection();
        const { page = 1, limit = 20 } = pagination;

        const query = { ngoId: new ObjectId(ngoId) };

        // Add filters
        if (filters.status) query.status = filters.status;
        if (filters.driveType) query.driveType = filters.driveType;

        const total = await collection.countDocuments(query);
        const drives = await collection
            .find(query)
            .sort({ driveDate: -1, requestedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        return {
            drives,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * READ - Find drives by status
     */
    async findByStatus(status, pagination = {}) {
        const collection = this.getCollection();
        const { page = 1, limit = 20 } = pagination;

        const query = { status };

        const total = await collection.countDocuments(query);
        const drives = await collection
            .find(query)
            .sort({ driveDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        return {
            drives,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * READ - Find upcoming drives
     * @param {Object} filters - {hospitalId, ngoId, city, state}
     * @param {Object} pagination
     * @returns {Promise<Object>}
     */
    async findUpcomingDrives(filters = {}, pagination = {}) {
        const collection = this.getCollection();
        const { page = 1, limit = 20 } = pagination;

        const query = {
            driveDate: { $gte: new Date() },
            status: { $in: ["ACCEPTED", "SCHEDULED"] }
        };

        // Add optional filters
        if (filters.hospitalId) {
            query.hospitalId = new ObjectId(filters.hospitalId);
        }
        if (filters.ngoId) {
            query.ngoId = new ObjectId(filters.ngoId);
        }
        if (filters.city) {
            query["location.city"] = new RegExp(filters.city, "i");
        }
        if (filters.state) {
            query["location.state"] = new RegExp(filters.state, "i");
        }
        if (filters.isPublic !== undefined) {
            query.isPublic = filters.isPublic;
        }

        const total = await collection.countDocuments(query);
        const drives = await collection
            .find(query)
            .sort({ driveDate: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        return {
            drives,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * READ - Find past drives
     */
    async findPastDrives(filters = {}, pagination = {}) {
        const collection = this.getCollection();
        const { page = 1, limit = 20 } = pagination;

        const query = {
            driveDate: { $lt: new Date() },
            status: { $in: ["COMPLETED", "EXPIRED"] }
        };

        // Add optional filters
        if (filters.hospitalId) {
            query.hospitalId = new ObjectId(filters.hospitalId);
        }
        if (filters.ngoId) {
            query.ngoId = new ObjectId(filters.ngoId);
        }

        const total = await collection.countDocuments(query);
        const drives = await collection
            .find(query)
            .sort({ driveDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        return {
            drives,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * READ - Get drives with hospital and NGO details (aggregated)
     */
    async getDrivesWithDetails(filters = {}, pagination = {}) {
        const collection = this.getCollection();
        const { page = 1, limit = 20 } = pagination;

        const matchStage = {};
        if (filters.hospitalId) {
            matchStage.hospitalId = new ObjectId(filters.hospitalId);
        }
        if (filters.ngoId) {
            matchStage.ngoId = new ObjectId(filters.ngoId);
        }
        if (filters.status) {
            matchStage.status = filters.status;
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
                    localField: "ngoId",
                    foreignField: "_id",
                    as: "ngo"
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
                    path: "$ngo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    driveTitle: 1,
                    driveType: 1,
                    location: 1,
                    driveDate: 1,
                    startTime: 1,
                    endTime: 1,
                    expectedDonors: 1,
                    expectedUnits: 1,
                    actualDonors: 1,
                    actualUnits: 1,
                    status: 1,
                    isEmergency: 1,
                    isPublic: 1,
                    requestedAt: 1,
                    "hospital.name": 1,
                    "hospital.hospitalCode": 1,
                    "hospital.phone": 1,
                    "hospital.address": 1,
                    "ngo.name": 1,
                    "ngo.organizationCode": 1,
                    "ngo.phone": 1,
                    "ngo.email": 1
                }
            },
            { $sort: { driveDate: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ];

        const drives = await collection.aggregate(pipeline).toArray();
        const total = await collection.countDocuments(matchStage);

        return {
            drives,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * UPDATE - Accept drive (NGO action)
     * @param {string} id
     * @param {string} ngoResponse
     * @returns {Promise<boolean>}
     */
    async acceptDrive(id, ngoResponse = "") {
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
                        ngoResponse,
                        updatedAt: new Date()
                    }
                }
            );
            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error accepting drive:", error);
            return false;
        }
    }

    /**
     * UPDATE - Reject drive (NGO action)
     * @param {string} id
     * @param {string} rejectionReason
     * @returns {Promise<boolean>}
     */
    async rejectDrive(id, rejectionReason) {
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
            console.error("Error rejecting drive:", error);
            return false;
        }
    }

    /**
     * UPDATE - Schedule drive (after acceptance)
     * @param {string} id
     * @param {Object} scheduleData
     * @returns {Promise<boolean>}
     */
    async scheduleDrive(id, scheduleData = {}) {
        const collection = this.getCollection();
        try {
            const updateData = {
                status: "SCHEDULED",
                scheduledAt: new Date(),
                updatedAt: new Date()
            };

            // Update volunteers if provided
            if (scheduleData.volunteersAssigned) {
                updateData.volunteersAssigned = scheduleData.volunteersAssigned;
            }

            const result = await collection.updateOne(
                {
                    _id: new ObjectId(id),
                    status: "ACCEPTED"
                },
                { $set: updateData }
            );
            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error scheduling drive:", error);
            return false;
        }
    }

    /**
     * UPDATE - Start drive
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async startDrive(id) {
        const collection = this.getCollection();
        try {
            const result = await collection.updateOne(
                {
                    _id: new ObjectId(id),
                    status: "SCHEDULED"
                },
                {
                    $set: {
                        status: "IN_PROGRESS",
                        startedAt: new Date(),
                        updatedAt: new Date()
                    }
                }
            );
            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error starting drive:", error);
            return false;
        }
    }

    /**
     * UPDATE - Complete drive with results
     * @param {string} id
     * @param {Object} results - {actualDonors, actualUnits, donorsByBloodGroup}
     * @returns {Promise<boolean>}
     */
    async completeDrive(id, results) {
        const collection = this.getCollection();
        try {
            const result = await collection.updateOne(
                {
                    _id: new ObjectId(id),
                    status: "IN_PROGRESS"
                },
                {
                    $set: {
                        status: "COMPLETED",
                        completedAt: new Date(),
                        actualDonors: results.actualDonors || 0,
                        actualUnits: results.actualUnits || 0,
                        donorsByBloodGroup: results.donorsByBloodGroup || {},
                        updatedAt: new Date()
                    }
                }
            );
            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error completing drive:", error);
            return false;
        }
    }

    /**
     * UPDATE - Cancel drive
     * @param {string} id
     * @param {string} cancellationReason
     * @param {string} cancelledBy - "HOSPITAL" or "NGO"
     * @returns {Promise<boolean>}
     */
    async cancelDrive(id, cancellationReason, cancelledBy) {
        const collection = this.getCollection();
        try {
            const result = await collection.updateOne(
                {
                    _id: new ObjectId(id),
                    status: { $in: ["PENDING", "ACCEPTED", "SCHEDULED"] }
                },
                {
                    $set: {
                        status: "CANCELLED",
                        cancelledAt: new Date(),
                        cancellationReason,
                        cancellationBy: cancelledBy,
                        updatedAt: new Date()
                    }
                }
            );
            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error cancelling drive:", error);
            return false;
        }
    }

    /**
     * UPDATE - Mark drive as expired (scheduled but not executed)
     */
    async markAsExpired(id) {
        const collection = this.getCollection();
        try {
            const result = await collection.updateOne(
                {
                    _id: new ObjectId(id),
                    status: "SCHEDULED",
                    driveDate: { $lt: new Date() }
                },
                {
                    $set: {
                        status: "EXPIRED",
                        updatedAt: new Date()
                    }
                }
            );
            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error marking drive as expired:", error);
            return false;
        }
    }

    /**
     * UPDATE - Update drive details
     */
    async updateById(id, updateData) {
        const collection = this.getCollection();
        try {
            // Prevent updating critical fields
            delete updateData._id;
            delete updateData.hospitalId;
            delete updateData.ngoId;
            delete updateData.requestedAt;
            delete updateData.status;

            // Convert driveDate if provided
            if (updateData.driveDate) {
                updateData.driveDate = new Date(updateData.driveDate);
            }

            const result = await collection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { ...updateData, updatedAt: new Date() } }
            );
            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error updating drive:", error);
            return false;
        }
    }

    /**
     * DELETE - Delete drive
     */
    async deleteById(id) {
        const collection = this.getCollection();
        try {
            const result = await collection.deleteOne({
                _id: new ObjectId(id)
            });
            return result.deletedCount > 0;
        } catch (error) {
            console.error("Error deleting drive:", error);
            return false;
        }
    }

    /**
     * ANALYTICS - Get drive statistics for hospital
     */
    async getStatsByHospital(hospitalId) {
        const collection = this.getCollection();
        try {
            const total = await collection.countDocuments({
                hospitalId: new ObjectId(hospitalId)
            });

            const completed = await collection.countDocuments({
                hospitalId: new ObjectId(hospitalId),
                status: "COMPLETED"
            });

            const upcoming = await collection.countDocuments({
                hospitalId: new ObjectId(hospitalId),
                status: { $in: ["ACCEPTED", "SCHEDULED"] },
                driveDate: { $gte: new Date() }
            });

            // Get total donors and units collected
            const aggregation = await collection.aggregate([
                {
                    $match: {
                        hospitalId: new ObjectId(hospitalId),
                        status: "COMPLETED"
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalDonors: { $sum: "$actualDonors" },
                        totalUnits: { $sum: "$actualUnits" }
                    }
                }
            ]).toArray();

            const totals = aggregation[0] || {
                totalDonors: 0,
                totalUnits: 0
            };

            return {
                total,
                completed,
                upcoming,
                totalDonorsCollected: totals.totalDonors,
                totalUnitsCollected: totals.totalUnits
            };
        } catch (error) {
            console.error("Error getting hospital drive stats:", error);
            return null;
        }
    }

    /**
     * ANALYTICS - Get drive statistics for NGO
     */
    async getStatsByNgo(ngoId) {
        const collection = this.getCollection();
        try {
            const total = await collection.countDocuments({
                ngoId: new ObjectId(ngoId)
            });

            const completed = await collection.countDocuments({
                ngoId: new ObjectId(ngoId),
                status: "COMPLETED"
            });

            const upcoming = await collection.countDocuments({
                ngoId: new ObjectId(ngoId),
                status: { $in: ["ACCEPTED", "SCHEDULED"] },
                driveDate: { $gte: new Date() }
            });

            // Get total donors and units facilitated
            const aggregation = await collection.aggregate([
                {
                    $match: {
                        ngoId: new ObjectId(ngoId),
                        status: "COMPLETED"
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalDonors: { $sum: "$actualDonors" },
                        totalUnits: { $sum: "$actualUnits" }
                    }
                }
            ]).toArray();

            const totals = aggregation[0] || {
                totalDonors: 0,
                totalUnits: 0
            };

            return {
                total,
                completed,
                upcoming,
                totalDonorsFacilitated: totals.totalDonors,
                totalUnitsFacilitated: totals.totalUnits
            };
        } catch (error) {
            console.error("Error getting NGO drive stats:", error);
            return null;
        }
    }

    /**
     * ANALYTICS - Get drives by type
     */
    async getStatsByType() {
        const collection = this.getCollection();
        try {
            return await collection.aggregate([
                {
                    $group: {
                        _id: "$driveType",
                        totalDrives: { $sum: 1 },
                        completedDrives: {
                            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] }
                        },
                        totalDonors: { $sum: "$actualDonors" },
                        totalUnits: { $sum: "$actualUnits" }
                    }
                },
                { $sort: { totalDrives: -1 } }
            ]).toArray();
        } catch (error) {
            console.error("Error getting drive type stats:", error);
            return [];
        }
    }

    /**
     * UTILITY - Auto-expire old scheduled drives
     * Should be run periodically (e.g., daily cron job)
     */
    async autoExpireOldDrives() {
        const collection = this.getCollection();
        try {
            const result = await collection.updateMany(
                {
                    status: "SCHEDULED",
                    driveDate: { $lt: new Date() }
                },
                {
                    $set: {
                        status: "EXPIRED",
                        updatedAt: new Date()
                    }
                }
            );
            return result.modifiedCount;
        } catch (error) {
            console.error("Error auto-expiring drives:", error);
            return 0;
        }
    }
}

export default new HospitalNgoDrive();
