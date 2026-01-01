import express from "express";
import { HospitalController } from "../../controllers/hospital/HospitalController.js";

const router = express.Router();

// #region HospitalCrud

/**
 * @route   POST /api/hospitals
 * @desc    Create a new hospital
 * @access  Public (or can be protected based on requirements)
 */
router.post("/", HospitalController.createHospital);

/**
 * @route   GET /api/hospitals/stats
 * @desc    Get hospital statistics
 * @access  Admin
 */
router.get("/stats", HospitalController.getHospitalStats);

/**
 * @route   GET /api/hospitals/stats/by-city
 * @desc    Get hospitals count by city
 * @access  Admin
 */
router.get("/stats/by-city", HospitalController.getHospitalsByCity);

/**
 * @route   GET /api/hospitals
 * @desc    Get all hospitals with filters
 * @access  Public
 */
router.get("/", HospitalController.getAllHospitals);

/**
 * @route   GET /api/hospitals/nearby
 * @desc    Get nearby hospitals (geospatial query)
 * @access  Public
 */
router.get("/nearby", HospitalController.getNearbyHospitals);

/**
 * @route   GET /api/hospitals/:id
 * @desc    Get hospital by ID
 * @access  Public
 */
router.get("/:id", HospitalController.getHospitalById);

/**
 * @route   PUT /api/hospitals/:id
 * @desc    Update hospital
 * @access  Hospital Admin
 */
router.put("/:id", HospitalController.updateHospital);

/**
 * @route   DELETE /api/hospitals/:id
 * @desc    Delete hospital
 * @access  Admin
 */
router.delete("/:id", HospitalController.deleteHospital);

// #region AdminActions

/**
 * @route   POST /api/hospitals/:id/verify
 * @desc    Verify hospital (Admin only)
 * @access  Admin
 */
router.post("/:id/verify", HospitalController.verifyHospital);

/**
 * @route   POST /api/hospitals/:id/reject
 * @desc    Reject hospital (Admin only)
 * @access  Admin
 */
router.post("/:id/reject", HospitalController.rejectHospital);

/**
 * @route   POST /api/hospitals/:id/suspend
 * @desc    Suspend hospital (Admin only)
 * @access  Admin
 */
router.post("/:id/suspend", HospitalController.suspendHospital);

/**
 * @route   GET /api/hospitals/:id/actions
 * @desc    Get hospital admin actions
 * @access  Admin
 */
router.get("/:id/actions", HospitalController.getHospitalActions);

/**
 * @route   GET /api/hospitals government/:id/blood-requests
 * @desc    Get all blood requests for a hospital
 * @access  Hospital Admin
 */
router.get("/:id/blood-requests", HospitalController.getHospitalBloodRequests);

/**
 * @route   GET /api/hospitals/:id/ngo-drives
 * @desc    Get all NGO drives for a hospital
 * @access  Hospital Admin
 */
router.get("/:id/ngo-drives", HospitalController.getHospitalNgoDrives);

export default router;
