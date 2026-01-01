import BloodBankNgoDrive from "../../models/admin/BloodBankNgoDrive.js";
import BloodBank from "../../models/admin/BloodBank.js";

// #region NGODriver Controle
export const createDrive = async (req, res) => {
  try {
    const drive = await BloodBankNgoDrive.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Blood donation drive created successfully. Waiting for admin approval.",
      data: drive
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating drive",
      error: error.message
    });
  }
};

export const getAllDrives = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    let result;
    if (status) {
      result = await BloodBankNgoDrive.findByStatus(status.toUpperCase(), pagination);
    } else {
      result = await BloodBankNgoDrive.findByStatus("PLANNED", pagination);
    }

    return res.status(200).json({
      success: true,
      message: "Drives retrieved successfully",
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving drives",
      error: error.message
    });
  }
};

export const getDriveById = async (req, res) => {
  try {
    const { id } = req.params;

    const drive = await BloodBankNgoDrive.findById(id);

    if (!drive) {
      return res.status(404).json({
        success: false,
        message: "Drive not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Drive retrieved successfully",
      data: drive
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving drive",
      error: error.message
    });
  }
};

export const getDriveWithDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const drive = await BloodBankNgoDrive.getDriveWithDetails(id);

    if (!drive) {
      return res.status(404).json({
        success: false,
        message: "Drive not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Drive details retrieved successfully",
      data: drive
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving drive details",
      error: error.message
    });
  }
};

export const getDrivesByBloodBank = async (req, res) => {
  try {
    const { bloodBankId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    const filters = {};
    if (status) filters.status = status;

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await BloodBankNgoDrive.findByBloodBankId(bloodBankId, filters, pagination);

    return res.status(200).json({
      success: true,
      message: "Blood bank drives retrieved successfully",
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving drives",
      error: error.message
    });
  }
};

export const getDrivesByNgo = async (req, res) => {
  try {
    const { ngoId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    const filters = {};
    if (status) filters.status = status;

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await BloodBankNgoDrive.findByNgoId(ngoId, filters, pagination);

    return res.status(200).json({
      success: true,
      message: "NGO drives retrieved successfully",
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving drives",
      error: error.message
    });
  }
};

export const updateDrive = async (req, res) => {
  try {
    const { id } = req.params;

    const success = await BloodBankNgoDrive.updateById(id, req.body);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Drive not found or update failed"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Drive updated successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating drive",
      error: error.message
    });
  }
};

export const approveDrive = async (req, res) => {
  try {
    const { driveId, remarks } = req.body;
    const adminId = req.admin?._id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required"
      });
    }

    if (!driveId) {
      return res.status(400).json({
        success: false,
        message: "Drive ID is required"
      });
    }

    const success = await BloodBankNgoDrive.approveByAdmin(driveId, adminId, remarks);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Approval failed. Drive must be in PLANNED status."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Drive approved successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error approving drive",
      error: error.message
    });
  }
};

export const rejectDrive = async (req, res) => {
  try {
    const { driveId, rejectionReason } = req.body;
    const adminId = req.admin?._id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required"
      });
    }

    if (!driveId || !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Drive ID and rejection reason are required"
      });
    }

    const success = await BloodBankNgoDrive.rejectByAdmin(driveId, adminId, rejectionReason);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Rejection failed. Drive must be in PLANNED status."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Drive rejected successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error rejecting drive",
      error: error.message
    });
  }
};

export const startDrive = async (req, res) => {
  try {
    const { id } = req.params;

    const success = await BloodBankNgoDrive.startDrive(id);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Cannot start drive. Must be in APPROVED status."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Drive started successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error starting drive",
      error: error.message
    });
  }
};

export const recordCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { bloodGroup, units } = req.body;

    if (!bloodGroup || !units) {
      return res.status(400).json({
        success: false,
        message: "Blood group and units are required"
      });
    }

    const validBloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({
        success: false,
        message: `Invalid blood group. Must be one of: ${validBloodGroups.join(", ")}`
      });
    }

    const success = await BloodBankNgoDrive.recordBloodCollection(id, bloodGroup, parseInt(units));

    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Failed to record collection"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Blood collection recorded successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error recording collection",
      error: error.message
    });
  }
};

export const completeDrive = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalDonorsParticipated, notes } = req.body;

    const success = await BloodBankNgoDrive.completeDrive(id, {
      totalDonorsParticipated: parseInt(totalDonorsParticipated) || 0,
      notes
    });

    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Cannot complete drive. Must be in ONGOING status."
      });
    }

    const drive = await BloodBankNgoDrive.findById(id);
    if (drive && drive.bloodBankId) {
      for (const [bloodGroup, units] of Object.entries(drive.collectedUnits)) {
        if (units > 0) {
          await BloodBank.updateBloodStock(drive.bloodBankId, bloodGroup, units);
        }
      }

      await BloodBank.incrementStatistics(drive.bloodBankId, "totalNgoDrivesSupported", 1);
      await BloodBank.incrementStatistics(drive.bloodBankId, "totalDonationsReceived", drive.totalUnitsCollected);
    }

    return res.status(200).json({
      success: true,
      message: "Drive completed successfully and blood stock updated"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error completing drive",
      error: error.message
    });
  }
};

export const cancelDrive = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    if (!cancellationReason) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required"
      });
    }

    const success = await BloodBankNgoDrive.cancelDrive(id, cancellationReason);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Failed to cancel drive"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Drive cancelled successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error cancelling drive",
      error: error.message
    });
  }
};

export const getDriveStatistics = async (req, res) => {
  try {
    const { bloodBankId, ngoId } = req.query;

    const stats = await BloodBankNgoDrive.getDriveStatistics(bloodBankId, ngoId);

    return res.status(200).json({
      success: true,
      message: "Drive statistics retrieved successfully",
      data: stats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving statistics",
      error: error.message
    });
  }
};

export const deleteDrive = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?._id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required"
      });
    }

    const success = await BloodBankNgoDrive.deleteById(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Drive not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Drive deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting drive",
      error: error.message
    });
  }
};

export default {
  createDrive,
  getAllDrives,
  getDriveById,
  getDriveWithDetails,
  getDrivesByBloodBank,
  getDrivesByNgo,
  updateDrive,
  approveDrive,
  rejectDrive,
  startDrive,
  recordCollection,
  completeDrive,
  cancelDrive,
  getDriveStatistics,
  deleteDrive
};
