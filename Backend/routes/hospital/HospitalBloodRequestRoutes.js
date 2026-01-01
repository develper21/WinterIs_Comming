import express from "express";
import { HospitalBloodRequestController } from "../../controllers/hospital/HospitalBloodRequestController.js";

const router = express.Router();

// #region RequestCrud

/**
 * @route   POST /api/hospital-blood-requests
 * @desc    Create a new blood request
 * @access  Hospital
 */
router.post("/", HospitalBloodRequestController.createRequest);

/**
 * @route   GET /api/hospital-blood-requests/critical
 * @desc    Get critical/urgent requests
 * @access  Hospital/Blood Bank
 */
router.get("/critical", HospitalBloodRequestController.getCriticalRequests);

/**
 * @route   GET /api/hospital-blood-requests/:id
 * @desc    Get request by ID
 * @access  Hospital/Blood Bank
 */
router.get("/:id", HospitalBloodRequestController.getRequestById);

/**
 * @route   PUT /api/hospital-blood-requests/:id
 * @desc    Update request
 * @access  Hospital
 */
router.put("/:id", HospitalBloodRequestController.updateRequest);

/**
 * @route   DELETE /api/hospital-blood-requests/:id
 * @desc    Delete request
 * @access  Hospital
 */
router.delete("/:id", HospitalBloodRequestController.deleteRequest);

// #region HospitalEndpoints

/**
 * @route   GET /api/hospital-blood-requests/hospital/:hospitalId
 * @desc    Get all requests by hospital
 * @access  Hospital
 */
router.get("/hospital/:hospitalId", HospitalBloodRequestController.getRequestsByHospital);

/**
 * @route   GET /api/hospital-blood-requests/hospital/:hospitalId/stats
 * @desc    Get request statistics for a hospital
 * @access  Hospital
 */
router.get("/hospital/:hospitalId/stats", HospitalBloodRequestController.getHospitalRequestStats);

// #region BloodBankEndpoints

/**
 * @route   GET /api/hospital-blood-requests/bloodbank/:bloodBankId
 * @desc    Get all requests by blood bank
 * @access  Blood Bank
 */
router.get("/bloodbank/:bloodBankId", HospitalBloodRequestController.getRequestsByBloodBank);

/**
 * @route   GET /api/hospital-blood-requests/bloodbank/:bloodBankId/stats
 * @desc    Get request statistics for a blood bank
 * @access  Blood Bank
 */
router.get("/bloodbank/:bloodBankId/stats", HospitalBloodRequestController.getBloodBankRequestStats);

/**
 * @route   POST /api/hospital-blood-requests/:id/accept
 * @desc    Accept request (Blood Bank action)
 * @access  Blood Bank
 */
router.post("/:id/accept", HospitalBloodRequestController.acceptRequest);

/**
 * @route   POST /api/hospital-blood-requests/:id/reject
 * @desc    Reject request (Blood Bank action)
 * @access  Blood Bank
 */
router.post("/:id/reject", HospitalBloodRequestController.rejectRequest);

/**
 * @route   POST /api/hospital-blood-requests/:id/complete
 * @desc    Complete request
 * @access  Hospital/Blood Bank
 */
router.post("/:id/complete", HospitalBloodRequestController.completeRequest);

export default router;
