import express from "express";
import {
  getAllPendingApprovals,
  getPendingApprovals,
  getPendingHospitals,
  getPendingBloodBanks,
  getPendingNgos,
  getApprovalStats,
  getOrganizationDetails,
  approveOrganization,
  rejectOrganization,
  suspendOrganization
} from "../../controllers/admin/ApprovalController.js";

import authMiddleware from "../../middleware/auth.middleware.js";
import adminAuthMiddleware from "../../middleware/adminAuth.middleware.js";

const router = express.Router();

// #region ViewRoutes

// Get ALL pending approvals (all types combined)
router.get("/pending/all", authMiddleware, adminAuthMiddleware, getAllPendingApprovals);

// Get pending approvals by type (hospital, bloodbank, ngo)
router.get("/pending", authMiddleware, adminAuthMiddleware, getPendingApprovals);

// Get pending hospitals only
router.get("/pending/hospitals", authMiddleware, adminAuthMiddleware, getPendingHospitals);

// Get pending blood banks only
router.get("/pending/bloodbanks", authMiddleware, adminAuthMiddleware, getPendingBloodBanks);

// Get pending NGOs only
router.get("/pending/ngos", authMiddleware, adminAuthMiddleware, getPendingNgos);

// Get approval statistics summary
router.get("/stats", authMiddleware, adminAuthMiddleware, getApprovalStats);

// Get organization details by code (for verification before approval)
router.get("/:id", authMiddleware, adminAuthMiddleware, getOrganizationDetails);

// #region ActionRoutes

/**
 * POST /api/admin/approvals/approve
 * Approve a pending organization
 * Body: { organizationCode, approvalRemarks }
 */
router.post("/approve", authMiddleware, adminAuthMiddleware, approveOrganization);

/**
 * POST /api/admin/approvals/reject
 * Reject a pending organization
 * Body: { organizationCode, rejectionReason }
 */
router.post("/reject", authMiddleware, adminAuthMiddleware, rejectOrganization);

/**
 * POST /api/admin/approvals/suspend
 * Suspend an organization
 * Body: { organizationCode, suspensionReason }
 */
router.post("/suspend", authMiddleware, adminAuthMiddleware, suspendOrganization);

export default router;
