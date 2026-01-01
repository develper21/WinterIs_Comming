import BloodBank from "../../models/admin/BloodBank.js";
import BloodBankAdminAction from "../../models/admin/BloodBankAdminAction.js";
import BloodStock from "../../models/admin/BloodStock.js";

// #region BloodBank Manage
export const registerBloodBank = async (req, res) => {
  try {
    const bloodBank = await BloodBank.create(req.body);
    
    return res.status(201).json({
      success: true,
      message: "Blood bank registered successfully. Waiting for admin verification.",
      data: bloodBank
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error registering blood bank",
      error: error.message
    });
  }
};

export const getAllBloodBanks = async (req, res) => {
  try {
    const { status, city, state, isActive, emergency24x7, page = 1, limit = 20 } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (city) filters.city = city;
    if (state) filters.state = state;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (emergency24x7 !== undefined) filters.emergency24x7 = emergency24x7 === 'true';

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await BloodBank.findAll(filters, pagination);

    return res.status(200).json({
      success: true,
      message: "Blood banks retrieved successfully",
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving blood banks",
      error: error.message
    });
  }
};

export const getBloodBankById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Blood bank ID is required"
      });
    }

    const bloodBank = await BloodBank.findById(id);

    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: "Blood bank not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Blood bank retrieved successfully",
      data: bloodBank
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving blood bank",
      error: error.message
    });
  }
};

export const getBloodBankByCode = async (req, res) => {
  try {
    const { organizationCode } = req.params;

    if (!organizationCode) {
      return res.status(400).json({
        success: false,
        message: "Organization code is required"
      });
    }

    const bloodBank = await BloodBank.findByCode(organizationCode);

    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: "Blood bank not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Blood bank retrieved successfully",
      data: bloodBank
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving blood bank",
      error: error.message
    });
  }
};

export const getBloodBanksByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    const validStatuses = ["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      });
    }

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await BloodBank.findByStatus(status.toUpperCase(), pagination);

    return res.status(200).json({
      success: true,
      message: `Blood banks with status ${status} retrieved successfully`,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving blood banks",
      error: error.message
    });
  }
};

export const getBloodStock = async (req, res) => {
  try {
    const { id } = req.params;

    const bloodBank = await BloodBank.findById(id);
    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: "Blood bank not found"
      });
    }

    let bloodStockDocument = await BloodStock.findByBloodBankId(id);
    if (!bloodStockDocument) {
      bloodStockDocument = await BloodStock.create(id, bloodBank.organizationCode);
    }

    const formattedStock = {};
    Object.entries(bloodStockDocument.bloodStock || {}).forEach(([group, info]) => {
      formattedStock[group] = {
        units: info?.units ?? 0,
        lastUpdated: info?.lastUpdated || bloodStockDocument.lastStockUpdateAt,
        updatedBy: info?.updatedBy || "system",
        status: getStockStatus(info?.units ?? 0)
      };
    });

    return res.status(200).json({
      success: true,
      message: "Blood stock retrieved successfully",
      data: {
        bloodBankId: bloodBank._id,
        organizationCode: bloodBank.organizationCode,
        name: bloodBank.name,
        bloodStock: formattedStock,
        totalUnitsAvailable:
          bloodStockDocument.totalUnitsAvailable ??
          Object.values(formattedStock).reduce((sum, entry) => sum + entry.units, 0),
        lastUpdatedAt: bloodStockDocument.lastStockUpdateAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving blood stock",
      error: error.message
    });
  }
};

export const updateBloodStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { bloodGroup, units } = req.body;
    const updatedBy = req.user?.userCode || "admin-panel";

    if (!bloodGroup || units === undefined) {
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

    const parsedUnits = Number(units);
    if (Number.isNaN(parsedUnits) || parsedUnits < 0) {
      return res.status(400).json({
        success: false,
        message: "Units must be a non-negative number"
      });
    }

    const bloodBank = await BloodBank.findById(id);
    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: "Blood bank not found"
      });
    }

    let bloodStockDocument = await BloodStock.findByBloodBankId(id);
    if (!bloodStockDocument) {
      bloodStockDocument = await BloodStock.create(id, bloodBank.organizationCode);
    }

    const success = await BloodStock.updateBloodGroupUnits(
      id,
      bloodGroup,
      parsedUnits,
      updatedBy
    );

    if (!success) {
      return res.status(500).json({
        success: false,
        message: "Error updating blood stock"
      });
    }

    await BloodBank.touchStockTimestamp(id);

    const updatedStock = await BloodStock.findByBloodBankId(id);
    const updatedGroup = updatedStock?.bloodStock?.[bloodGroup];

    return res.status(200).json({
      success: true,
      message: "Blood stock updated successfully",
      data: {
        bloodGroup,
        unitsNow: updatedGroup?.units ?? parsedUnits,
        status: getStockStatus(updatedGroup?.units ?? parsedUnits),
        totalUnitsAvailable: updatedStock?.totalUnitsAvailable ?? parsedUnits,
        lastUpdated: updatedGroup?.lastUpdated ?? new Date()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating blood stock",
      error: error.message
    });
  }
};

const getStockStatus = (units) => {
  if (units < 5) return "CRITICAL";
  if (units < 10) return "LOW";
  if (units < 20) return "MEDIUM";
  return "HEALTHY";
};

export const updateBloodBank = async (req, res) => {
  try {
    const { id } = req.params;

    const success = await BloodBank.updateById(id, req.body);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Blood bank not found or update failed"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Blood bank updated successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating blood bank",
      error: error.message
    });
  }
};

export const verifyBloodBank = async (req, res) => {
  try {
    const { bloodBankId, remarks } = req.body;
    const adminId = req.admin?._id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required"
      });
    }

    if (!bloodBankId) {
      return res.status(400).json({
        success: false,
        message: "Blood bank ID is required"
      });
    }

    const success = await BloodBank.verifyByAdmin(bloodBankId, adminId, remarks);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Verification failed. Blood bank must be in PENDING status."
      });
    }

    await BloodBankAdminAction.create({
      bloodBankId,
      adminId,
      actionType: "VERIFY",
      reason: remarks,
      previousStatus: "PENDING",
      newStatus: "VERIFIED",
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    return res.status(200).json({
      success: true,
      message: "Blood bank verified successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error verifying blood bank",
      error: error.message
    });
  }
};

export const rejectBloodBank = async (req, res) => {
  try {
    const { bloodBankId, rejectionReason } = req.body;
    const adminId = req.admin?._id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required"
      });
    }

    if (!bloodBankId || !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Blood bank ID and rejection reason are required"
      });
    }

    const success = await BloodBank.rejectByAdmin(bloodBankId, adminId, rejectionReason);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Rejection failed. Blood bank must be in PENDING status."
      });
    }

    await BloodBankAdminAction.create({
      bloodBankId,
      adminId,
      actionType: "REJECT",
      reason: rejectionReason,
      previousStatus: "PENDING",
      newStatus: "REJECTED",
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    return res.status(200).json({
      success: true,
      message: "Blood bank rejected successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error rejecting blood bank",
      error: error.message
    });
  }
};

export const suspendBloodBank = async (req, res) => {
  try {
    const { bloodBankId, suspensionReason } = req.body;
    const adminId = req.admin?._id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required"
      });
    }

    if (!bloodBankId || !suspensionReason) {
      return res.status(400).json({
        success: false,
        message: "Blood bank ID and suspension reason are required"
      });
    }

    const success = await BloodBank.suspendByAdmin(bloodBankId, adminId, suspensionReason);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Suspension failed. Blood bank must be in VERIFIED status."
      });
    }

    await BloodBankAdminAction.create({
      bloodBankId,
      adminId,
      actionType: "SUSPEND",
      reason: suspensionReason,
      previousStatus: "VERIFIED",
      newStatus: "SUSPENDED",
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    return res.status(200).json({
      success: true,
      message: "Blood bank suspended successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error suspending blood bank",
      error: error.message
    });
  }
};

export const reactivateBloodBank = async (req, res) => {
  try {
    const { bloodBankId, remarks } = req.body;
    const adminId = req.admin?._id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required"
      });
    }

    if (!bloodBankId) {
      return res.status(400).json({
        success: false,
        message: "Blood bank ID is required"
      });
    }

    const success = await BloodBank.reactivateByAdmin(bloodBankId, adminId, remarks);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Reactivation failed. Blood bank must be in SUSPENDED status."
      });
    }

    await BloodBankAdminAction.create({
      bloodBankId,
      adminId,
      actionType: "REACTIVATE",
      reason: remarks,
      previousStatus: "SUSPENDED",
      newStatus: "VERIFIED",
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    return res.status(200).json({
      success: true,
      message: "Blood bank reactivated successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error reactivating blood bank",
      error: error.message
    });
  }
};

export const getLocationStats = async (req, res) => {
  try {
    const stats = await BloodBank.getStatsByLocation();

    return res.status(200).json({
      success: true,
      message: "Location statistics retrieved successfully",
      data: stats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving location statistics",
      error: error.message
    });
  }
};

export const deleteBloodBank = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?._id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required"
      });
    }

    const success = await BloodBank.deleteById(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Blood bank not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Blood bank deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting blood bank",
      error: error.message
    });
  }
};

export default {
  registerBloodBank,
  getAllBloodBanks,
  getBloodBankById,
  getBloodBankByCode,
  getBloodBanksByStatus,
  getBloodStock,
  updateBloodStock,
  updateBloodBank,
  verifyBloodBank,
  rejectBloodBank,
  suspendBloodBank,
  reactivateBloodBank,
  getLocationStats,
  deleteBloodBank
};
