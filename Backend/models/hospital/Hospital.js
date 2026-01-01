import { getDB } from "../../config/db.js";
import { ObjectId } from "mongodb";

// #region HospitalModel

/**
 * Hospital Model - ADMIN DEPENDENT
 * Production-ready MongoDB schema for Hospital management
 * 
 * FEATURES:
 * - Admin-controlled verification, rejection, suspension
 * - Integration with Blood Banks for emergency blood requests
 * - Integration with NGOs for blood donation drives
 * - Complete audit trail via HospitalAdminAction collection
 * - Geospatial queries for nearby hospitals
 * 
 * STATUS LIFECYCLE:
 * PENDING → VERIFIED (by Admin)
 * PENDING → REJECTED (by Admin)
 * VERIFIED → SUSPENDED (by Admin)
 * SUSPENDED → VERIFIED (by Admin - reactivation)
 */
class Hospital {
    constructor() {
        this.collectionName = "hospitals";
    }

    getCollection() {
        const db = getDB();
        return db.collection(this.collectionName);
    }

    /**
     * CREATE - Register new hospital
     * Initial status: PENDING (requires admin verification)
     */
    async create(hospitalData) {
        const collection = this.getCollection();

        const newHospital = {
            type: "hospital",

            // Basic Information
            hospitalCode: hospitalData.hospitalCode, // Unique identifier
            name: hospitalData.name,
            email: hospitalData.email.toLowerCase(),
            phone: hospitalData.phone,

            // Location Details
            address: {
                street: hospitalData.address?.street || hospitalData.address,
                city: hospitalData.city,
                state: hospitalData.state,
                pinCode: hospitalData.pinCode,
                country: hospitalData.address?.country || "India"
            },

            // Geospatial location for nearby queries
            location: hospitalData.location || {
                type: "Point",
                coordinates: [0, 0] // [longitude, latitude] - should be updated with actual coordinates
            },

            // Contact Person
            contactPerson: {
                name: hospitalData.contactPerson?.name || hospitalData.contactPerson,
                designation: hospitalData.contactPerson?.designation || "Administrator",
                phone: hospitalData.contactPerson?.phone || hospitalData.phone,
                email: hospitalData.contactPerson?.email || hospitalData.email
            },

            // Registration & License
            registrationNumber: hospitalData.registrationNumber,
            licenseNumber: hospitalData.licenseNumber,
            licenseIssuedDate: hospitalData.licenseIssuedDate || null,
            licenseExpiryDate: hospitalData.licenseExpiryDate || null,
            accreditations: hospitalData.accreditations || [], // NABH, JCI, etc.

            // Hospital Type & Facilities
            hospitalType: hospitalData.hospitalType || "GENERAL", // GENERAL, SPECIALTY, MULTI_SPECIALTY, TRAUMA_CENTER
            bedCapacity: hospitalData.bedCapacity || 0,
            icuBeds: hospitalData.icuBeds || 0,
            emergencyServices: hospitalData.emergencyServices !== false, // Default true
            bloodBankOnSite: hospitalData.bloodBankOnSite || false,

            // Operational Details
            operatingHours: hospitalData.operatingHours || {
                weekdays: "24x7",
                weekends: "24x7",
                emergency24x7: true
            },
            departments: hospitalData.departments || [], // Cardiology, Neurology, etc.

            // Admin Control Fields
            status: "PENDING", // PENDING | VERIFIED | REJECTED | SUSPENDED
            verificationStatus: {
                isVerified: false,
                verifiedBy: null, // Admin ObjectId
                verifiedAt: null,
                rejectedBy: null,
                rejectedAt: null,
                rejectionReason: null,
                suspendedBy: null,
                suspendedAt: null,
                suspensionReason: null
            },

            // Statistics & Metrics
            statistics: {
                totalBloodRequestsMade: 0,
                totalBloodUnitsReceived: 0,
                totalNgoDrivesInitiated: 0,
                totalDonationsCollected: 0,
                lastBloodRequestDate: null,
                lastDriveDate: null
            },

            // Relationships (stored as references, actual data in separate collections)
            bloodRequests: [], // Array of HospitalBloodRequest ObjectIds
            ngoDrives: [], // Array of HospitalNgoDrive ObjectIds

            // Metadata
            isActive: false, // Activated only after VERIFIED
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await collection.insertOne(newHospital);
        return { _id: result.insertedId, ...newHospital };
    }

    /**
     * READ - Find by MongoDB ID
     */
    async findById(id) {
        const collection = this.getCollection();
        try {
            return await collection.findOne({
                _id: new ObjectId(id)
            });
        } catch (error) {
            console.error("Error finding hospital by ID:", error);
            return null;
        }
    }

    /**
     * READ - Find by Hospital Code
     */
    async findByCode(hospitalCode) {
        const collection = this.getCollection();
        return await collection.findOne({
            hospitalCode
        });
    }

    /**
     * READ - Find by Registration Number
     */
    async findByRegistrationNumber(registrationNumber) {
        const collection = this.getCollection();
        return await collection.findOne({
            registrationNumber
        });
    }

    /**
     * READ - Find by email
     */
    async findByEmail(email) {
        const collection = this.getCollection();
        return await collection.findOne({
            email: email.toLowerCase()
        });
    }

    /**
     * READ - Find all with pagination & filters
     */
    async findAll(filters = {}, pagination = {}) {
        const collection = this.getCollection();
        const { page = 1, limit = 20 } = pagination;

        // Build query
        const query = {};

        // Add filters
        if (filters.status) query.status = filters.status;
        if (filters.city) query["address.city"] = new RegExp(filters.city, "i");
        if (filters.state) query["address.state"] = new RegExp(filters.state, "i");
        if (filters.isActive !== undefined) query.isActive = filters.isActive;
        if (filters.hospitalType) query.hospitalType = filters.hospitalType;
        if (filters.emergencyServices !== undefined) query.emergencyServices = filters.emergencyServices;

        const total = await collection.countDocuments(query);
        const hospitals = await collection
            .find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 })
            .toArray();

        return {
            hospitals,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * READ - Find all by status (for Admin dashboard)
     */
    async findByStatus(status, pagination = {}) {
        const collection = this.getCollection();
        const { page = 1, limit = 20 } = pagination;

        const query = { status };

        const total = await collection.countDocuments(query);
        const hospitals = await collection
            .find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 })
            .toArray();

        return {
            hospitals,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * READ - Find nearby hospitals using geospatial query
     * @param {number} longitude
     * @param {number} latitude
     * @param {number} maxDistance - in meters (default 10000m = 10km)
     * @param {Object} filters - Additional filters
     */
    async findNearby(longitude, latitude, maxDistance = 10000, filters = {}) {
        const collection = this.getCollection();
        try {
            const query = {
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [longitude, latitude]
                        },
                        $maxDistance: maxDistance
                    }
                },
                ...filters
            };

            return await collection.find(query).toArray();
        } catch (error) {
            console.error("Error finding nearby hospitals:", error);
            return [];
        }
    }

    /**
     * READ - Find hospitals by city
     */
    async findByCity(city, pagination = {}) {
        return await this.findAll({ city }, pagination);
    }

    /**
     * UPDATE - General update by ID
     */
    async updateById(id, updateData) {
        const collection = this.getCollection();
        try {
            // Prevent direct status updates (must use admin action methods)
            delete updateData.status;
            delete updateData.verificationStatus;

            const result = await collection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { ...updateData, updatedAt: new Date() } }
            );
            // Return true if document was found (matched), even if not modified
            return result.matchedCount > 0;
        } catch (error) {
            console.error("Error updating hospital:", error);
            return false;
        }
    }

    /**
     * UPDATE - Update location coordinates
     */
    async updateLocation(id, longitude, latitude) {
        const collection = this.getCollection();
        try {
            const result = await collection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        location: {
                            type: "Point",
                            coordinates: [longitude, latitude]
                        },
                        updatedAt: new Date()
                    }
                }
            );
            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error updating hospital location:", error);
            return false;
        }
    }

    /**
     * ADMIN ACTION - Verify Hospital
     * Called by Admin only
     * Creates audit entry in HospitalAdminAction collection
     */
    async verifyByAdmin(id, adminId, remarks = null) {
        const collection = this.getCollection();
        try {
            const result = await collection.updateOne(
                {
                    _id: new ObjectId(id),
                    status: "PENDING" // Can only verify PENDING hospitals
                },
                {
                    $set: {
                        status: "VERIFIED",
                        isActive: true,
                        "verificationStatus.isVerified": true,
                        "verificationStatus.verifiedBy": new ObjectId(adminId),
                        "verificationStatus.verifiedAt": new Date(),
                        updatedAt: new Date()
                    }
                }
            );

            // Note: HospitalAdminAction entry should be created by the controller
            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error verifying hospital:", error);
            return false;
        }
    }

    /**
     * ADMIN ACTION - Reject Hospital
     * Called by Admin only
     */
    async rejectByAdmin(id, adminId, rejectionReason) {
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
                        isActive: false,
                        "verificationStatus.rejectedBy": new ObjectId(adminId),
                        "verificationStatus.rejectedAt": new Date(),
                        "verificationStatus.rejectionReason": rejectionReason,
                        updatedAt: new Date()
                    }
                }
            );

            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error rejecting hospital:", error);
            return false;
        }
    }

    /**
     * ADMIN ACTION - Suspend Hospital
     * Called by Admin only
     */
    async suspendByAdmin(id, adminId, suspensionReason) {
        const collection = this.getCollection();
        try {
            const result = await collection.updateOne(
                {
                    _id: new ObjectId(id),
                    status: "VERIFIED" // Can only suspend VERIFIED hospitals
                },
                {
                    $set: {
                        status: "SUSPENDED",
                        isActive: false,
                        "verificationStatus.suspendedBy": new ObjectId(adminId),
                        "verificationStatus.suspendedAt": new Date(),
                        "verificationStatus.suspensionReason": suspensionReason,
                        updatedAt: new Date()
                    }
                }
            );

            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error suspending hospital:", error);
            return false;
        }
    }

    /**
     * ADMIN ACTION - Reactivate Suspended Hospital
     * Called by Admin only
     */
    async reactivateByAdmin(id, adminId, remarks = null) {
        const collection = this.getCollection();
        try {
            const result = await collection.updateOne(
                {
                    _id: new ObjectId(id),
                    status: "SUSPENDED"
                },
                {
                    $set: {
                        status: "VERIFIED",
                        isActive: true,
                        "verificationStatus.suspendedBy": null,
                        "verificationStatus.suspendedAt": null,
                        "verificationStatus.suspensionReason": null,
                        updatedAt: new Date()
                    }
                }
            );

            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error reactivating hospital:", error);
            return false;
        }
    }

    /**
     * UPDATE - Increment statistics
     */
    async incrementStatistics(id, field, value = 1) {
        const collection = this.getCollection();
        try {
            const result = await collection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $inc: { [`statistics.${field}`]: value },
                    $set: { updatedAt: new Date() }
                }
            );
            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error incrementing statistics:", error);
            return false;
        }
    }

    /**
     * DELETE - Hard delete (Admin only)
     */
    async deleteById(id) {
        const collection = this.getCollection();
        try {
            const result = await collection.deleteOne({
                _id: new ObjectId(id)
            });
            return result.deletedCount > 0;
        } catch (error) {
            console.error("Error deleting hospital:", error);
            return false;
        }
    }

    /**
     * ANALYTICS - Get hospitals statistics
     */
    async getStats() {
        const collection = this.getCollection();
        try {
            const total = await collection.countDocuments();
            const verified = await collection.countDocuments({ status: "VERIFIED" });
            const pending = await collection.countDocuments({ status: "PENDING" });
            const rejected = await collection.countDocuments({ status: "REJECTED" });
            const suspended = await collection.countDocuments({ status: "SUSPENDED" });
            const active = await collection.countDocuments({ isActive: true });

            return {
                total,
                byStatus: {
                    VERIFIED: verified,
                    PENDING: pending,
                    REJECTED: rejected,
                    SUSPENDED: suspended
                },
                active,
                inactive: total - active
            };
        } catch (error) {
            console.error("Error getting hospital stats:", error);
            return null;
        }
    }

    /**
     * ANALYTICS - Get hospitals by location
     */
    async getStatsByLocation() {
        const collection = this.getCollection();
        try {
            return await collection.aggregate([
                {
                    $group: {
                        _id: {
                            state: "$address.state",
                            city: "$address.city"
                        },
                        count: { $sum: 1 },
                        verified: {
                            $sum: { $cond: [{ $eq: ["$status", "VERIFIED"] }, 1, 0] }
                        },
                        totalBeds: { $sum: "$bedCapacity" },
                        totalICUBeds: { $sum: "$icuBeds" }
                    }
                },
                { $sort: { count: -1 } }
            ]).toArray();
        } catch (error) {
            console.error("Error getting location stats:", error);
            return [];
        }
    }

    /**
     * ANALYTICS - Get hospitals by type
     */
    async getStatsByType() {
        const collection = this.getCollection();
        try {
            return await collection.aggregate([
                {
                    $group: {
                        _id: "$hospitalType",
                        count: { $sum: 1 },
                        verified: {
                            $sum: { $cond: [{ $eq: ["$status", "VERIFIED"] }, 1, 0] }
                        }
                    }
                },
                { $sort: { count: -1 } }
            ]).toArray();
        } catch (error) {
            console.error("Error getting type stats:", error);
            return [];
        }
    }
}

export default new Hospital();
