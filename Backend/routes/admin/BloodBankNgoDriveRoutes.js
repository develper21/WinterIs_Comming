import express from "express";
import {
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
} from "../../controllers/admin/BloodBankNgoDriveController.js";

const router = express.Router();

// #region PublicNgoRoutes
// These routes can be accessed by NGOs and Blood Banks

// Create new drive
router.post("/create", createDrive);

// Get all drives (with filters)
router.get("/all", getAllDrives);

// Get drive by ID
router.get("/id/:id", getDriveById);

// Get drive with full details (includes blood bank and NGO info)
router.get("/details/:id", getDriveWithDetails);

// Get drives by blood bank
router.get("/bloodbank/:bloodBankId", getDrivesByBloodBank);

// Get drives by NGO
router.get("/ngo/:ngoId", getDrivesByNgo);

// Get drive statistics
router.get("/stats", getDriveStatistics);

// #region BloodBankRoutes
// These routes are for blood bank operations during the drive

// Update drive details
router.put("/:id", updateDrive);

// Start drive (change status from APPROVED to ONGOING)
router.post("/:id/start", startDrive);

// Record blood collection during drive
router.post("/:id/collect", recordCollection);

// Complete drive (finalizes the drive and updates blood stock)
router.post("/:id/complete", completeDrive);

// Cancel drive
router.post("/:id/cancel", cancelDrive);

// #region AdminRoutes
// These routes require admin authentication
// Note: Add your admin authentication middleware here
// Example: router.use(authenticateAdmin);

// Admin approves drive
router.post("/approve", approveDrive);

// Admin rejects drive
router.post("/reject", rejectDrive);

// Delete drive (admin only)
router.delete("/:id", deleteDrive);

export default router;
