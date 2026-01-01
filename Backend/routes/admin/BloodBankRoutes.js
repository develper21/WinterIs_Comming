import express from "express";
import {
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
} from "../../controllers/admin/BloodBankController.js";

const router = express.Router();

// #region PublicRoutes
// These routes don't require authentication

// Register new blood bank
router.post("/register", registerBloodBank);

// Get all blood banks (with filters)
router.get("/all", getAllBloodBanks);

// Get blood bank by ID
router.get("/id/:id", getBloodBankById);

// Get blood bank by organization code
router.get("/code/:organizationCode", getBloodBankByCode);

// Get blood banks by status
router.get("/status/:status", getBloodBanksByStatus);

// Get blood stock for a blood bank
router.get("/:id/stock", getBloodStock);

// Get location statistics
router.get("/stats/location", getLocationStats);

// #region ProtectedRoutes
// These routes require admin authentication
// Note: Add your admin authentication middleware here
// Example: router.use(authenticateAdmin);

// Update blood bank details
router.put("/:id", updateBloodBank);

// Update blood stock
router.put("/:id/stock", updateBloodStock);

// Admin actions
router.post("/verify", verifyBloodBank);
router.post("/reject", rejectBloodBank);
router.post("/suspend", suspendBloodBank);
router.post("/reactivate", reactivateBloodBank);

// Delete blood bank (admin only)
router.delete("/:id", deleteBloodBank);

export default router;
