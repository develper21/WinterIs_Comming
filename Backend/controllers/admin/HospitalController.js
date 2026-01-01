import Hospital from "../../models/admin/Hospital.js";

// #region Validators

const validateHospitalInput = (data) => {
  const errors = [];
  if (!data.name) errors.push("Hospital name is required");
  if (!data.city) errors.push("City is required");
  if (!data.state) errors.push("State is required");
  if (!data.email) errors.push("Email is required");
  if (!data.phone) errors.push("Phone is required");
  if (!data.totalBedCapacity) errors.push("Total bed capacity is required");

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    errors.push("Invalid email format");
  }

  return errors;
};

// #region GetAllHospitals
/**
 * GET /admin/hospitals
 * Query: ?status=APPROVED&city=Delhi&page=1&limit=20
 */
export const getAllHospitals = async (req, res) => {
  try {
    const { status, city, state, page = 1, limit = 20 } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (city) filters.city = city;
    if (state) filters.state = state;

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await Hospital.findAll(filters, pagination);

    return res.status(200).json({
      success: true,
      message: "Hospitals retrieved successfully",
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving hospitals",
      error: error.message
    });
  }
};

// #region GetHospitalById
/**
 * GET /admin/hospitals/id/:hospitalId
 * Params: hospitalId (MongoDB ObjectId)
 */
export const getHospitalById = async (req, res) => {
  try {
    const { hospitalId } = req.params;

    if (!hospitalId) {
      return res.status(400).json({
        success: false,
        message: "Hospital ID is required"
      });
    }

    const hospital = await Hospital.findById(hospitalId);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hospital retrieved successfully",
      data: hospital
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving hospital",
      error: error.message
    });
  }
};

// #region GetHospitalByCode
/**
 * GET /admin/hospitals/code/:organizationCode
 * Params: organizationCode (string like HOSP-DEL-001)
 */
export const getHospitalByCode = async (req, res) => {
  try {
    const { organizationCode } = req.params;
     console.log("Organization Code:", organizationCode);
    if (!organizationCode) {
      return res.status(400).json({
        success: false,
        message: "Organization code is required"
      });
    }

    const hospital = await Hospital.findByCode(organizationCode);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hospital retrieved successfully",
      data: hospital
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving hospital",
      error: error.message
    });
  }
};

// #region GetHospitalsByStatus
/**
 * GET /admin/hospitals/status/:status
 * Get hospitals filtered by status (APPROVED, PENDING, REJECTED)
 * Query: ?page=1&limit=20
 */
export const getHospitalsByStatus = async (req, res) => {
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

    const result = await Hospital.findByStatus(status.toUpperCase(), pagination);

    return res.status(200).json({
      success: true,
      message: `Hospitals with status ${status} retrieved successfully`,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving hospitals",
      error: error.message
    });
  }
};

// #region ActivateHospital
/**
 * POST /admin/hospitals/:id/activate
 */
export const activateHospital = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Hospital ID is required"
      });
    }

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found"
      });
    }

    const updated = await Hospital.updateStatus(id, "APPROVED");

    if (!updated) {
      return res.status(500).json({
        success: false,
        message: "Failed to activate hospital"
      });
    }

    const updatedHospital = await Hospital.findById(id);

    return res.status(200).json({
      success: true,
      message: "Hospital activated successfully",
      data: {
        hospitalCode: updatedHospital.hospitalCode,
        name: updatedHospital.name,
        status: updatedHospital.status,
        activatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error activating hospital",
      error: error.message
    });
  }
};

// #region SuspendHospital
/**
 * POST /admin/hospitals/:id/suspend
 * Body: { reason: "Maintenance period" }
 */
export const suspendHospital = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Hospital ID is required"
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Suspension reason is required"
      });
    }

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found"
      });
    }

    const updated = await Hospital.updateById(id, {
      status: "SUSPENDED",
      suspensionReason: reason,
      suspendedAt: new Date()
    });

    if (!updated) {
      return res.status(500).json({
        success: false,
        message: "Failed to suspend hospital"
      });
    }

    const updatedHospital = await Hospital.findById(id);

    return res.status(200).json({
      success: true,
      message: "Hospital suspended successfully",
      data: {
        hospitalCode: updatedHospital.hospitalCode,
        name: updatedHospital.name,
        status: updatedHospital.status,
        suspendedAt: new Date().toISOString(),
        reason: reason
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error suspending hospital",
      error: error.message
    });
  }
};

export default {
  getAllHospitals,
  getHospitalById,
  getHospitalByCode,
  getHospitalsByStatus,
  activateHospital,
  suspendHospital
};
