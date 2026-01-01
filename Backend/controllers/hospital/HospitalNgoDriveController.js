import HospitalNgoDrive from "../../models/hospital/HospitalNgoDrive.js";

export class HospitalNgoDriveController {
    // #region DriveCrud

    /**
     * Create a new donation drive request
     * POST /api/hospital-ngo-drives
     */
    static async createDrive(req, res) {
        try {
            const {
                hospitalId,
                ngoId,
                driveTitle,
                location,
                driveDate,
                expectedUnits,
                expectedDonors
            } = req.body;

            // Validate required fields
            if (!hospitalId || !ngoId || !driveTitle || !location || !driveDate) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields (hospitalId, ngoId, driveTitle, location, driveDate)"
                });
            }

            const driveData = {
                hospitalId,
                ngoId,
                driveTitle,
                location,
                driveDate,
                expectedUnits: expectedUnits || expectedDonors || 0, // Fallback to donors if units not specified
                expectedDonors: expectedDonors || 0
            };

            const drive = await HospitalNgoDrive.create(driveData);

            res.status(201).json({
                success: true,
                message: "Donation drive request created successfully",
                data: drive
            });
        } catch (error) {
            console.error("Error creating drive:", error);
            res.status(500).json({
                success: false,
                message: "Failed to create donation drive",
                error: error.message
            });
        }
    }

    /**
     * Get drive by ID
     * GET /api/hospital-ngo-drives/:id
     */
    static async getDriveById(req, res) {
        try {
            const { id } = req.params;

            const drive = await HospitalNgoDrive.findById(id);

            if (!drive) {
                return res.status(404).json({
                    success: false,
                    message: "Drive not found"
                });
            }

            res.status(200).json({
                success: true,
                data: drive
            });
        } catch (error) {
            console.error("Error fetching drive:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch drive",
                error: error.message
            });
        }
    }

    /**
     * Get all drives by hospital
     * GET /api/hospital-ngo-drives/hospital/:hospitalId?status=PENDING&page=1&limit=10
     */
    static async getDrivesByHospital(req, res) {
        try {
            const { hospitalId } = req.params;
            const { status, page, limit } = req.query;

            const filters = {};
            if (status) filters.status = status;

            const pagination = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10
            };

            const result = await HospitalNgoDrive.findByHospitalId(hospitalId, filters, pagination);

            res.status(200).json({
                success: true,
                data: result.drives,
                pagination: result.pagination
            });
        } catch (error) {
            console.error("Error fetching hospital drives:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch hospital drives",
                error: error.message
            });
        }
    }

    /**
     * Get all drives by NGO
     * GET /api/hospital-ngo-drives/ngo/:ngoId?status=PENDING&page=1&limit=10
     */
    static async getDrivesByNgo(req, res) {
        try {
            const { ngoId } = req.params;
            const { status, page, limit } = req.query;

            const filters = {};
            if (status) filters.status = status;

            const pagination = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10
            };

            const result = await HospitalNgoDrive.findByNgoId(ngoId, filters, pagination);

            res.status(200).json({
                success: true,
                data: result.drives,
                pagination: result.pagination
            });
        } catch (error) {
            console.error("Error fetching NGO drives:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch NGO drives",
                error: error.message
            });
        }
    }

    /**
     * Get upcoming drives for a hospital
     * GET /api/hospital-ngo-drives/hospital/:hospitalId/upcoming
     */
    static async getUpcomingDrives(req, res) {
        try {
            const { hospitalId } = req.params;
            const { page, limit } = req.query;

            const pagination = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10
            };

            const result = await HospitalNgoDrive.findUpcomingByHospital(hospitalId, pagination);

            res.status(200).json({
                success: true,
                data: result.drives,
                pagination: result.pagination
            });
        } catch (error) {
            console.error("Error fetching upcoming drives:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch upcoming drives",
                error: error.message
            });
        }
    }

    /**
     * Update drive
     * PUT /api/hospital-ngo-drives/:id
     */
    static async updateDrive(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Remove fields that shouldn't be updated directly
            delete updateData._id;
            delete updateData.hospitalId;
            delete updateData.ngoId;
            delete updateData.requestedAt;

            const drive = await HospitalNgoDrive.update(id, updateData);

            if (!drive) {
                return res.status(404).json({
                    success: false,
                    message: "Drive not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Drive updated successfully",
                data: drive
            });
        } catch (error) {
            console.error("Error updating drive:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update drive",
                error: error.message
            });
        }
    }

    /**
     * Accept drive (NGO action)
     * POST /api/hospital-ngo-drives/:id/accept
     */
    static async acceptDrive(req, res) {
        try {
            const { id } = req.params;

            const drive = await HospitalNgoDrive.updateStatus(id, "ACCEPTED");

            if (!drive) {
                return res.status(404).json({
                    success: false,
                    message: "Drive not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Drive accepted successfully",
                data: drive
            });
        } catch (error) {
            console.error("Error accepting drive:", error);
            res.status(500).json({
                success: false,
                message: "Failed to accept drive",
                error: error.message
            });
        }
    }

    /**
     * Reject drive (NGO action)
     * POST /api/hospital-ngo-drives/:id/reject
     */
    static async rejectDrive(req, res) {
        try {
            const { id } = req.params;

            const drive = await HospitalNgoDrive.updateStatus(id, "REJECTED");

            if (!drive) {
                return res.status(404).json({
                    success: false,
                    message: "Drive not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Drive rejected",
                data: drive
            });
        } catch (error) {
            console.error("Error rejecting drive:", error);
            res.status(500).json({
                success: false,
                message: "Failed to reject drive",
                error: error.message
            });
        }
    }

    /**
     * Complete drive
     * POST /api/hospital-ngo-drives/:id/complete
     */
    static async completeDrive(req, res) {
        try {
            const { id } = req.params;

            const drive = await HospitalNgoDrive.updateStatus(id, "COMPLETED");

            if (!drive) {
                return res.status(404).json({
                    success: false,
                    message: "Drive not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Drive marked as completed",
                data: drive
            });
        } catch (error) {
            console.error("Error completing drive:", error);
            res.status(500).json({
                success: false,
                message: "Failed to complete drive",
                error: error.message
            });
        }
    }

    /**
     * Delete drive
     * DELETE /api/hospital-ngo-drives/:id
     */
    static async deleteDrive(req, res) {
        try {
            const { id } = req.params;

            const result = await HospitalNgoDrive.delete(id);

            if (result.deletedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Drive not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Drive deleted successfully"
            });
        } catch (error) {
            console.error("Error deleting drive:", error);
            res.status(500).json({
                success: false,
                message: "Failed to delete drive",
                error: error.message
            });
        }
    }

    // #region Statistics

    /**
     * Get drive statistics for a hospital
     * GET /api/hospital-ngo-drives/hospital/:hospitalId/stats
     */
    static async getHospitalDriveStats(req, res) {
        try {
            const { hospitalId } = req.params;

            const stats = await HospitalNgoDrive.getStatsByHospital(hospitalId);

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error("Error fetching hospital drive stats:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch drive statistics",
                error: error.message
            });
        }
    }

    /**
     * Get drive statistics for an NGO
     * GET /api/hospital-ngo-drives/ngo/:ngoId/stats
     */
    static async getNgoDriveStats(req, res) {
        try {
            const { ngoId } = req.params;

            const stats = await HospitalNgoDrive.getStatsByNgo(ngoId);

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error("Error fetching NGO drive stats:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch drive statistics",
                error: error.message
            });
        }
    }
}
