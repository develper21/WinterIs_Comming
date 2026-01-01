import Hospital from "../../models/hospital/Hospital.js";
import HospitalNgoDrive from "../../models/hospital/HospitalNgoDrive.js";
import HospitalAdminAction from "../../models/hospital/HospitalAdminAction.js";
import HospitalBloodRequest from "../../models/hospital/HospitalBloodRequest.js";

export class HospitalController {
    // #region HospitalCrud

    /**
     * Create a new hospital
     * POST /api/hospitals
     */
    static async createHospital(req, res) {
        try {
            const {
                name,
                registrationNumber,
                email,
                phone,
                address,
                city,
                coordinates // [longitude, latitude]
            } = req.body;

            // Validate required fields
            if (!name || !registrationNumber || !email || !phone || !address || !city || !coordinates) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required"
                });
            }

            // Check if hospital already exists
            const existingHospital = await Hospital.findByRegistrationNumber(registrationNumber);
            if (existingHospital) {
                return res.status(400).json({
                    success: false,
                    message: "Hospital with this registration number already exists"
                });
            }

            const existingEmail = await Hospital.findByEmail(email);
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: "Hospital with this email already exists"
                });
            }

            // Create hospital data
            const hospitalData = {
                name,
                registrationNumber,
                email: email.toLowerCase(),
                phone,
                address,
                city,
                location: {
                    type: "Point",
                    coordinates: coordinates // [longitude, latitude]
                }
            };

            const hospital = await Hospital.create(hospitalData);

            res.status(201).json({
                success: true,
                message: "Hospital registered successfully. Awaiting admin verification.",
                data: hospital
            });
        } catch (error) {
            console.error("Error creating hospital:", error);
            res.status(500).json({
                success: false,
                message: "Failed to create hospital",
                error: error.message
            });
        }
    }

    /**
     * Get hospital by ID
     * GET /api/hospitals/:id
     * Fetches from organizations collection (single source of truth)
     */
    static async getHospitalById(req, res) {
        try {
            const { id } = req.params;

            console.log('\n[GET_HOSPITAL_BY_ID] Received ID:', id);
            console.log('[GET_HOSPITAL_BY_ID] ID Type:', typeof id);
            console.log('[GET_HOSPITAL_BY_ID] ID Length:', id?.length);

            // Validate ID parameter
            if (!id || id === 'null' || id === 'undefined') {
                console.warn('[GET_HOSPITAL_BY_ID] Invalid ID received:', id);
                return res.status(400).json({
                    success: false,
                    message: "Invalid hospital ID. Please login again to refresh your session."
                });
            }

            // Import getDB to access organizations collection
            const { getDB } = await import("../../config/db.js");
            const { ObjectId } = await import("mongodb");
            const db = getDB();

            // Validate ObjectId format
            if (!ObjectId.isValid(id)) {
                console.warn('[GET_HOSPITAL_BY_ID] Invalid ObjectId format:', id);
                return res.status(400).json({
                    success: false,
                    message: "Invalid hospital ID format"
                });
            }

            // Fetch from organizations collection instead of hospitals
            const organization = await db.collection("organizations").findOne({
                _id: new ObjectId(id)
            });

            console.log('[GET_HOSPITAL_BY_ID] Organization found:', organization ? 'YES' : 'NO');

            if (!organization) {
                console.warn('[GET_HOSPITAL_BY_ID] Organization not found for ID:', id);
                return res.status(404).json({
                    success: false,
                    message: "Hospital not found"
                });
            }

            // Verify it's a hospital type organization
            if (organization.type !== 'hospital') {
                console.warn('[GET_HOSPITAL_BY_ID] Organization is not a hospital, type:', organization.type);
                return res.status(400).json({
                    success: false,
                    message: `Organization is of type '${organization.type}', not 'hospital'`
                });
            }

            console.log('[GET_HOSPITAL_BY_ID] Hospital Name:', organization.name);

            // Map organization fields to hospital format for frontend compatibility
            const hospitalData = {
                _id: organization._id,
                hospitalCode: organization.organizationCode,
                name: organization.name,
                registrationNumber: organization.registrationNumber || `REG-${organization.organizationCode}`,
                email: organization.email,
                phone: organization.phone,
                address: organization.address,
                city: organization.city,
                verificationStatus: organization.verificationStatus || "PENDING",
                isActive: organization.isActive !== false,
                location: organization.location,
                specialties: organization.specialties || [],
                createdAt: organization.createdAt,
                updatedAt: organization.updatedAt,
                verifiedAt: organization.verifiedAt
            };

            res.status(200).json({
                success: true,
                data: hospitalData
            });
        } catch (error) {
            console.error("[GET_HOSPITAL_BY_ID] Error fetching hospital:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch hospital",
                error: error.message
            });
        }
    }

    /**
     * Get all hospitals with filters
     * GET /api/hospitals?verificationStatus=VERIFIED&city=Delhi&page=1&limit=10
     */
    static async getAllHospitals(req, res) {
        try {
            const { verificationStatus, city, isActive, page, limit } = req.query;

            const filters = {};
            if (verificationStatus) filters.verificationStatus = verificationStatus;
            if (city) filters.city = city;
            if (isActive !== undefined) filters.isActive = isActive === "true";

            const pagination = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10
            };

            const result = await Hospital.findAll(filters, pagination);

            res.status(200).json({
                success: true,
                data: result.hospitals,
                pagination: result.pagination
            });
        } catch (error) {
            console.error("Error fetching hospitals:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch hospitals",
                error: error.message
            });
        }
    }

    /**
     * Get nearby hospitals
     * GET /api/hospitals/nearby?longitude=77.2090&latitude=28.6139&maxDistance=5000
     */
    static async getNearbyHospitals(req, res) {
        try {
            const { longitude, latitude, maxDistance } = req.query;

            if (!longitude || !latitude) {
                return res.status(400).json({
                    success: false,
                    message: "Longitude and latitude are required"
                });
            }

            const hospitals = await Hospital.findNearby(
                parseFloat(longitude),
                parseFloat(latitude),
                parseInt(maxDistance) || 5000,
                { verificationStatus: "VERIFIED", isActive: true }
            );

            res.status(200).json({
                success: true,
                data: hospitals
            });
        } catch (error) {
            console.error("Error fetching nearby hospitals:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch nearby hospitals",
                error: error.message
            });
        }
    }

    /**
     * Update hospital
     * PUT /api/hospitals/:id
     */
    /**
     * Update hospital
     * PUT /api/hospitals/:id
     */
    static async updateHospital(req, res) {
        try {
            const { id } = req.params;
            const { name, phone, address, city, state, pincode, ...otherData } = req.body;

            console.log('\n[UPDATE_HOSPITAL] Received ID:', id);
            console.log('[UPDATE_HOSPITAL] Update Data:', req.body);

            // Import getDB to access organizations collection
            const { getDB } = await import("../../config/db.js");
            const { ObjectId } = await import("mongodb");
            const db = getDB();

            // Prepare update object with proper structure
            const updateData = {};

            // Update basic fields
            if (name) updateData.name = name;
            if (phone) updateData.phone = phone;

            // Update location object fields
            if (address) updateData['location.address'] = address;
            if (city) {
                updateData['location.city'] = city;
                updateData.city = city; // Keep top-level city for compatibility
            }
            if (state) updateData['location.state'] = state;
            if (pincode) updateData['location.pincode'] = pincode;

            // Add any other fields (excluding immutable ones)
            Object.keys(otherData).forEach(key => {
                if (!['_id', 'verificationStatus', 'createdAt', 'type', 'organizationCode'].includes(key)) {
                    updateData[key] = otherData[key];
                }
            });

            // Add updatedAt timestamp
            updateData.updatedAt = new Date();

            console.log('[UPDATE_HOSPITAL] Sanitized Update Data:', updateData);

            // Update in organizations collection
            const result = await db.collection("organizations").updateOne(
                { _id: new ObjectId(id), type: 'hospital' },
                { $set: updateData }
            );

            console.log('[UPDATE_HOSPITAL] Update Result - Matched:', result.matchedCount, 'Modified:', result.modifiedCount);

            if (result.matchedCount === 0) {
                console.warn('[UPDATE_HOSPITAL] Hospital not found for ID:', id);
                return res.status(404).json({
                    success: false,
                    message: "Hospital not found"
                });
            }

            // Fetch updated hospital
            const updatedOrganization = await db.collection("organizations").findOne({
                _id: new ObjectId(id)
            });

            console.log('[UPDATE_HOSPITAL] Updated Hospital:', {
                name: updatedOrganization?.name,
                city: updatedOrganization?.location?.city,
                address: updatedOrganization?.location?.address
            });

            // Map organization fields to hospital format for frontend compatibility
            const hospitalData = {
                _id: updatedOrganization._id,
                hospitalCode: updatedOrganization.organizationCode,
                name: updatedOrganization.name,
                registrationNumber: updatedOrganization.registrationNumber || `REG-${updatedOrganization.organizationCode}`,
                email: updatedOrganization.email,
                phone: updatedOrganization.phone,
                address: updatedOrganization.location?.address || updatedOrganization.address,
                city: updatedOrganization.location?.city || updatedOrganization.city,
                verificationStatus: updatedOrganization.verificationStatus || "PENDING",
                isActive: updatedOrganization.isActive !== false,
                location: updatedOrganization.location,
                specialties: updatedOrganization.specialties || [],
                createdAt: updatedOrganization.createdAt,
                updatedAt: updatedOrganization.updatedAt,
                verifiedAt: updatedOrganization.verifiedAt
            };

            res.status(200).json({
                success: true,
                message: "Hospital updated successfully",
                data: hospitalData
            });
        } catch (error) {
            console.error("[UPDATE_HOSPITAL] Error updating hospital:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update hospital",
                error: error.message
            });
        }
    }

    /**
     * Delete hospital
     * DELETE /api/hospitals/:id
     */
    static async deleteHospital(req, res) {
        try {
            const { id } = req.params;

            const success = await Hospital.deleteById(id);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: "Hospital not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Hospital deleted successfully"
            });
        } catch (error) {
            console.error("Error deleting hospital:", error);
            res.status(500).json({
                success: false,
                message: "Failed to delete hospital",
                error: error.message
            });
        }
    }

    // #region AdminActions

    /**
     * Verify hospital (Admin only)
     * POST /api/hospitals/:id/verify
     */
    static async verifyHospital(req, res) {
        try {
            const { id } = req.params;
            const { adminId, reason } = req.body;

            if (!adminId) {
                return res.status(400).json({
                    success: false,
                    message: "Admin ID is required"
                });
            }

            // Verify hospital
            const success = await Hospital.verifyByAdmin(id, adminId, reason);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: "Hospital not found or already verified"
                });
            }

            // Log admin action
            await HospitalAdminAction.create({
                hospitalId: id,
                adminId: adminId,
                action: "VERIFY",
                reason: reason || "Hospital verified by admin",
                previousStatus: "PENDING",
                newStatus: "VERIFIED"
            });

            const hospital = await Hospital.findById(id);

            res.status(200).json({
                success: true,
                message: "Hospital verified successfully",
                data: hospital
            });
        } catch (error) {
            console.error("Error verifying hospital:", error);
            res.status(500).json({
                success: false,
                message: "Failed to verify hospital",
                error: error.message
            });
        }
    }

    /**
     * Reject hospital (Admin only)
     * POST /api/hospitals/:id/reject
     */
    static async rejectHospital(req, res) {
        try {
            const { id } = req.params;
            const { adminId, reason } = req.body;

            if (!adminId || !reason) {
                return res.status(400).json({
                    success: false,
                    message: "Admin ID and reason are required"
                });
            }

            // Reject hospital
            const success = await Hospital.rejectByAdmin(id, adminId, reason);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: "Hospital not found or not pending"
                });
            }

            // Log admin action
            await HospitalAdminAction.create({
                hospitalId: id,
                adminId: adminId,
                action: "REJECT",
                reason: reason,
                previousStatus: "PENDING",
                newStatus: "REJECTED"
            });

            const hospital = await Hospital.findById(id);

            res.status(200).json({
                success: true,
                message: "Hospital rejected",
                data: hospital
            });
        } catch (error) {
            console.error("Error rejecting hospital:", error);
            res.status(500).json({
                success: false,
                message: "Failed to reject hospital",
                error: error.message
            });
        }
    }

    /**
     * Suspend hospital (Admin only)
     * POST /api/hospitals/:id/suspend
     */
    static async suspendHospital(req, res) {
        try {
            const { id } = req.params;
            const { adminId, reason } = req.body;

            if (!adminId || !reason) {
                return res.status(400).json({
                    success: false,
                    message: "Admin ID and reason are required"
                });
            }

            // Suspend hospital
            const success = await Hospital.suspendByAdmin(id, adminId, reason);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: "Hospital not found or not verified"
                });
            }

            // Log admin action
            await HospitalAdminAction.create({
                hospitalId: id,
                adminId: adminId,
                action: "SUSPEND",
                reason: reason,
                previousStatus: "VERIFIED",
                newStatus: "SUSPENDED"
            });

            const hospital = await Hospital.findById(id);

            res.status(200).json({
                success: true,
                message: "Hospital suspended",
                data: hospital
            });
        } catch (error) {
            console.error("Error suspending hospital:", error);
            res.status(500).json({
                success: false,
                message: "Failed to suspend hospital",
                error: error.message
            });
        }
    }

    /**
     * Get hospital admin actions
     * GET /api/hospitals/:id/actions
     */
    static async getHospitalActions(req, res) {
        try {
            const { id } = req.params;
            const { page, limit } = req.query;

            const pagination = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10
            };

            const result = await HospitalAdminAction.findByHospitalId(id, pagination);

            res.status(200).json({
                success: true,
                data: result.actions,
                pagination: result.pagination
            });
        } catch (error) {
            console.error("Error fetching hospital actions:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch hospital actions",
                error: error.message
            });
        }
    }

    // #region Statistics

    /**
     * Get hospital statistics
     * GET /api/hospitals/stats
     */
    static async getHospitalStats(req, res) {
        try {
            const stats = await Hospital.getStats();

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error("Error fetching hospital stats:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch hospital statistics",
                error: error.message
            });
        }
    }

    /**
     * Get hospitals count by city
     * GET /api/hospitals/stats/by-city
     */
    static async getHospitalsByCity(req, res) {
        try {
            const stats = await Hospital.getStatsByLocation();

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error("Error fetching hospitals by city:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch hospitals by city",
                error: error.message
            });
        }
    }

    /**
     * Get all blood requests for a hospital
     * GET /api/hospitals/:id/blood-requests
     */
    static async getHospitalBloodRequests(req, res) {
        try {
            const { id } = req.params;
            const { status, urgency, bloodGroup, page, limit } = req.query;

            const filters = {};
            if (status) filters.status = status;
            if (urgency) filters.urgency = urgency;
            if (bloodGroup) filters.bloodGroup = bloodGroup;

            const pagination = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20
            };

            const result = await HospitalBloodRequest.findByHospitalId(id, filters, pagination);

            res.status(200).json({
                success: true,
                data: result.requests,
                pagination: result.pagination
            });
        } catch (error) {
            console.error("Error fetching hospital blood requests:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch hospital blood requests",
                error: error.message
            });
        }
    }

    /**
     * Get all NGO drives for a hospital
     * GET /api/hospitals/:id/ngo-drives
     */
    static async getHospitalNgoDrives(req, res) {
        try {
            const { id } = req.params;
            const { status, page, limit } = req.query;

            const filters = {};
            if (status) filters.status = status;

            const pagination = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20
            };

            const result = await HospitalNgoDrive.findByHospitalId(id, filters, pagination);

            res.status(200).json({
                success: true,
                data: result.drives || [],
                pagination: result.pagination
            });
        } catch (error) {
            console.error("Error fetching hospital NGO drives:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch hospital NGO drives",
                error: error.message
            });
        }
    }
}
