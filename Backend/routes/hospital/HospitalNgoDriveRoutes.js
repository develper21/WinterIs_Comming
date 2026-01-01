import express from "express";
import { HospitalNgoDriveController } from "../../controllers/hospital/HospitalNgoDriveController.js";

const router = express.Router();

// #region DriveCrud

/**
 * @route   POST /api/hospital-ngo-drives
 * @desc    Create a new donation drive request
 * @access  Hospital
 */
router.post("/", HospitalNgoDriveController.createDrive);

/**
 * @route   GET /api/hospital-ngo-drives/:id
 * @desc    Get drive by ID
 * @access  Hospital/NGO
 */
router.get("/:id", HospitalNgoDriveController.getDriveById);

/**
 * @route   PUT /api/hospital-ngo-drives/:id
 * @desc    Update drive
 * @access  Hospital
 */
router.put("/:id", HospitalNgoDriveController.updateDrive);

/**
 * @route   DELETE /api/hospital-ngo-drives/:id
 * @desc    Delete drive
 * @access  Hospital
 */
router.delete("/:id", HospitalNgoDriveController.deleteDrive);

// #region HospitalEndpoints

/**
 * @route   GET /api/hospital-ngo-drives/hospital/:hospitalId
 * @desc    Get all drives by hospital
 * @access  Hospital
 */
router.get("/hospital/:hospitalId", HospitalNgoDriveController.getDrivesByHospital);

/**
 * @route   GET /api/hospital-ngo-drives/hospital/:hospitalId/upcoming
 * @desc    Get upcoming drives for a hospital
 * @access  Hospital
 */
router.get("/hospital/:hospitalId/upcoming", HospitalNgoDriveController.getUpcomingDrives);

/**
 * @route   GET /api/hospital-ngo-drives/hospital/:hospitalId/stats
 * @desc    Get drive statistics for a hospital
 * @access  Hospital
 */
router.get("/hospital/:hospitalId/stats", HospitalNgoDriveController.getHospitalDriveStats);

// #region NgoEndpoints

/**
 * @route   GET /api/hospital-ngo-drives/ngo/:ngoId
 * @desc    Get all drives by NGO
 * @access  NGO
 */
router.get("/ngo/:ngoId", HospitalNgoDriveController.getDrivesByNgo);

/**
 * @route   GET /api/hospital-ngo-drives/ngo/:ngoId/stats
 * @desc    Get drive statistics for an NGO
 * @access  NGO
 */
router.get("/ngo/:ngoId/stats", HospitalNgoDriveController.getNgoDriveStats);

/**
 * @route   POST /api/hospital-ngo-drives/:id/accept
 * @desc    Accept drive (NGO action)
 * @access  NGO
 */
router.post("/:id/accept", HospitalNgoDriveController.acceptDrive);

/**
 * @route   POST /api/hospital-ngo-drives/:id/reject
 * @desc    Reject drive (NGO action)
 * @access  NGO
 */
router.post("/:id/reject", HospitalNgoDriveController.rejectDrive);

/**
 * @route   POST /api/hospital-ngo-drives/:id/complete
 * @desc    Complete drive
 * @access  Hospital/NGO
 */
router.post("/:id/complete", HospitalNgoDriveController.completeDrive);

export default router;
