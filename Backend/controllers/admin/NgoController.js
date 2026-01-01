import NGO from "../../models/admin/NGO.js";

// #region GetAllNgos
/**
 * GET /admin/ngos
 * Query: ?status=APPROVED&page=1&limit=20
 */
export const getAllNGOs = async (req, res) => {
  try {
    const { status, city, state, isActive, page = 1, limit = 20 } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (city) filters.city = city;
    if (state) filters.state = state;
    if (isActive !== undefined) filters.isActive = isActive === "true";

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await NGO.findAll(filters, pagination);

    return res.status(200).json({
      success: true,
      message: "NGOs retrieved successfully",
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving NGOs",
      error: error.message
    });
  }
};

// #region GetNgoById
/**
 * GET /admin/ngos/id/:ngoId
 * Params: ngoId (MongoDB ObjectId)
 */
export const getNGOById = async (req, res) => {
  try {
    const { ngoId } = req.params;

    if (!ngoId) {
      return res.status(400).json({
        success: false,
        message: "NGO ID is required"
      });
    }

    const ngo = await NGO.findById(ngoId);

    if (!ngo) {
      return res.status(404).json({
        success: false,
        message: "NGO not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "NGO retrieved successfully",
      data: ngo
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving NGO",
      error: error.message
    });
  }
};

// #region GetNgoByCode
/**
 * GET /admin/ngos/code/:organizationCode
 * Params: organizationCode (string like NGO-DEL-001)
 */
export const getNGOByCode = async (req, res) => {
  try {
    const { organizationCode } = req.params;

    if (!organizationCode) {
      return res.status(400).json({
        success: false,
        message: "Organization code is required"
      });
    }

    const ngo = await NGO.findByCode(organizationCode);

    if (!ngo) {
      return res.status(404).json({
        success: false,
        message: "NGO not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "NGO retrieved successfully",
      data: ngo
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving NGO",
      error: error.message
    });
  }
};

// #region GetNgosByStatus
/**
 * GET /admin/ngos/status/:status
 * Get NGOs filtered by status (APPROVED, PENDING, REJECTED, SUSPENDED)
 * Query: ?page=1&limit=20
 */
export const getNGOsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    // Validate status
    const validStatuses = ["APPROVED", "PENDING", "REJECTED", "SUSPENDED"];
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

    const result = await NGO.findByStatus(status.toUpperCase(), pagination);

    return res.status(200).json({
      success: true,
      message: `NGOs with status ${status} retrieved successfully`,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving NGOs",
      error: error.message
    });
  }
};

// #region GetNgoDonorCoverage
/**
 * GET /admin/ngos/:ngoId/donor-coverage
 * Get AGGREGATED donor coverage (NO individual donor data exposed)
 */
export const getNGODonorCoverage = async (req, res) => {
  try {
    const { ngoId } = req.params;

    if (!ngoId) {
      return res.status(400).json({
        success: false,
        message: "NGO ID is required"
      });
    }

    const coverage = await NGO.getDonorCoverage(ngoId);

    if (!coverage) {
      return res.status(404).json({
        success: false,
        message: "NGO not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Donor coverage retrieved successfully",
      data: coverage
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving donor coverage",
      error: error.message
    });
  }
};

// #region EnableNgo
/**
 * POST /admin/ngos/:id/enable
 * Enable NGO to participate in blood donation system
 */
export const enableNGO = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "NGO ID is required"
      });
    }

    const success = await NGO.updateActiveStatus(id, true);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "NGO not found or already enabled"
      });
    }

    return res.status(200).json({
      success: true,
      message: "NGO enabled successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error enabling NGO",
      error: error.message
    });
  }
};

// #region DisableNgo
/**
 * POST /admin/ngos/:id/disable
 * Disable NGO from participating in blood donation system
 */
export const disableNGO = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "NGO ID is required"
      });
    }

    const updateData = { isActive: false };
    if (reason) updateData.disabledReason = reason;

    const success = await NGO.updateById(id, updateData);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "NGO not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "NGO disabled successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error disabling NGO",
      error: error.message
    });
  }
};

export default {
  getAllNGOs,
  getNGOById,
  getNGOByCode,
  getNGOsByStatus,
  getNGODonorCoverage,
  enableNGO,
  disableNGO
};
