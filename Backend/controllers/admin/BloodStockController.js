import BloodStock from "../../models/admin/BloodStock.js";
import BloodBank from "../../models/admin/BloodBank.js";

// #region InitializeBloodStock
/**
 * POST /api/admin/blood-stock/initialize
 * Initialize/Create blood stock for a new blood bank
 * Only admin can initialize, blood bank updates their own stock
 */
export const initializeBloodStock = async (req, res) => {
  try {
    const { bloodBankId } = req.body;

    if (!bloodBankId) {
      return res.status(400).json({
        success: false,
        message: "Blood bank ID is required"
      });
    }

    // Verify blood bank exists
    const bloodBank = await BloodBank.findById(bloodBankId);
    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: "Blood bank not found"
      });
    }

    // Check if blood stock already exists
    const existingStock = await BloodStock.findByBloodBankId(bloodBankId);
    if (existingStock) {
      return res.status(409).json({
        success: false,
        message: "Blood stock already initialized for this blood bank"
      });
    }

    // Create new blood stock
    const newStock = await BloodStock.create(bloodBankId, bloodBank.organizationCode);

    return res.status(201).json({
      success: true,
      message: "Blood stock initialized successfully",
      data: {
        bloodBankCode: newStock.bloodBankCode,
        bloodBankId: newStock.bloodBankId,
        bloodStock: newStock.bloodStock,
        totalUnitsAvailable: newStock.totalUnitsAvailable,
        createdAt: newStock.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error initializing blood stock",
      error: error.message
    });
  }
};

// #region UpdateBloodStock
/**
 * POST /api/bloodbanks/:bloodBankId/stock
 * Update blood stock for a blood bank
 * Only blood bank users can update their own stock
 */
export const updateBloodStock = async (req, res) => {
  try {
    const { bloodBankId } = req.params;
    const { bloodGroup, units, action } = req.body;
    const userCode = req.user?.userCode;

    // Validate input
    if (!bloodBankId || !bloodGroup || units === undefined) {
      return res.status(400).json({
        success: false,
        message: "Blood bank ID, blood group, and units are required"
      });
    }

    const validBloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({
        success: false,
        message: `Invalid blood group. Must be one of: ${validBloodGroups.join(", ")}`
      });
    }

    if (typeof units !== "number" || units < 0) {
      return res.status(400).json({
        success: false,
        message: "Units must be a positive number"
      });
    }

    // Verify blood bank exists
    const bloodBank = await BloodBank.findById(bloodBankId);
    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: "Blood bank not found"
      });
    }

    // Get or create blood stock
    let bloodStock = await BloodStock.findByBloodBankId(bloodBankId);
    
    if (!bloodStock) {
      // Create new blood stock if doesn't exist
      bloodStock = await BloodStock.create(bloodBankId, bloodBank.organizationCode);
    }

    // Update the blood group units
    const success = await BloodStock.updateBloodGroupUnits(
      bloodBankId,
      bloodGroup,
      units,
      userCode
    );

    if (!success) {
      return res.status(500).json({
        success: false,
        message: "Error updating blood stock"
      });
    }

    // Get updated stock
    const updatedStock = await BloodStock.findByBloodBankId(bloodBankId);
    const updatedGroup = updatedStock.bloodStock[bloodGroup];

    return res.status(200).json({
      success: true,
      message: "Blood stock updated successfully",
      data: {
        bloodGroup,
        unitsNow: updatedGroup.units,
        status: getStockStatus(updatedGroup.units),
        totalUnitsAvailable: updatedStock.totalUnitsAvailable,
        lastUpdated: updatedGroup.lastUpdated
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

// #region HelperFunction
const getStockStatus = (units) => {
  if (units < 5) return "CRITICAL";
  if (units < 10) return "LOW";
  if (units < 20) return "MEDIUM";
  return "HEALTHY";
};

// #region GetBloodStockSummary
/**
 * GET /api/admin/blood-stock/summary
 * Get overall blood stock summary across all blood banks
 */
export const getBloodStockSummary = async (req, res) => {
  try {
    const summary = await BloodStock.getSummary();

    return res.status(200).json({
      success: true,
      message: "Blood stock summary retrieved successfully",
      data: summary
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving blood stock summary",
      error: error.message
    });
  }
};

// #region GetStockByBloodGroup
/**
 * GET /api/admin/blood-stock/by-blood-group/:bloodGroup
 * Get blood stock breakdown by specific blood group
 */
export const getStockByBloodGroup = async (req, res) => {
  try {
    const { bloodGroup } = req.params;

    if (!bloodGroup) {
      return res.status(400).json({
        success: false,
        message: "Blood group is required"
      });
    }

    const validBloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({
        success: false,
        message: `Invalid blood group. Must be one of: ${validBloodGroups.join(", ")}`
      });
    }

    const result = await BloodStock.getByBloodGroup(bloodGroup);

    // Fetch blood bank details
    const enrichedBloodBanks = [];
    for (const bb of result.bloodBanks) {
      const bloodBankDetails = await BloodBank.findById(bb.bloodBankId);
      if (bloodBankDetails) {
        enrichedBloodBanks.push({
          bloodBankCode: bb.bloodBankCode,
          name: bloodBankDetails.name,
          city: bloodBankDetails.city,
          units: bb.units,
          status: getStockStatus(bb.units),
          lastUpdated: bb.lastUpdated
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Blood stock for ${bloodGroup} retrieved successfully`,
      data: {
        bloodGroup,
        totalUnits: result.totalUnits,
        bloodBanks: enrichedBloodBanks
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving blood stock by blood group",
      error: error.message
    });
  }
};

// #region GetStockByBloodBank
/**
 * GET /api/admin/blood-stock/by-bloodbank/:bloodBankId
 * Get complete stock breakdown for a specific blood bank
 */
export const getStockByBloodBank = async (req, res) => {
  try {
    const { bloodBankId } = req.params;

    if (!bloodBankId) {
      return res.status(400).json({
        success: false,
        message: "Blood bank ID is required"
      });
    }

    const bloodStock = await BloodStock.findByBloodBankId(bloodBankId);
    if (!bloodStock) {
      return res.status(404).json({
        success: false,
        message: "Blood stock not found for this blood bank"
      });
    }

    const bloodBankDetails = await BloodBank.findById(bloodBankId);

    // Format stock data
    const formattedStock = {};
    Object.entries(bloodStock.bloodStock).forEach(([bg, data]) => {
      formattedStock[bg] = {
        units: data.units,
        status: getStockStatus(data.units),
        lastUpdated: data.lastUpdated
      };
    });

    return res.status(200).json({
      success: true,
      message: "Blood stock retrieved successfully",
      data: {
        bloodBankCode: bloodStock.bloodBankCode,
        bloodBankName: bloodBankDetails?.name || "Unknown",
        city: bloodBankDetails?.city || "Unknown",
        totalUnitsAvailable: bloodStock.totalUnitsAvailable,
        stock: formattedStock,
        lastUpdatedAt: bloodStock.lastStockUpdateAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving blood stock by blood bank",
      error: error.message
    });
  }
};

// #region GetShortageAlerts
/**
 * GET /api/admin/blood-stock/shortages
 * Get critical shortage alerts and low stock warnings
 */
export const getShortageAlerts = async (req, res) => {
  try {
    const shortages = await BloodStock.getShortages();

    return res.status(200).json({
      success: true,
      message: "Shortage alerts retrieved successfully",
      data: shortages
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving shortage alerts",
      error: error.message
    });
  }
};

// #region GetAllBloodStocks
/**
 * GET /api/admin/blood-stock
 * Get all blood stocks with pagination
 */
export const getAllBloodStocks = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await BloodStock.findAll(pagination);

    return res.status(200).json({
      success: true,
      message: "Blood stocks retrieved successfully",
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving blood stocks",
      error: error.message
    });
  }
};

export default {
  initializeBloodStock,
  updateBloodStock,
  getBloodStockSummary,
  getStockByBloodGroup,
  getStockByBloodBank,
  getShortageAlerts,
  getAllBloodStocks
};
