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
import superAdminAuthMiddleware from "../../middleware/superAdminAuth.middleware.js";

const router = express.Router();

// #region ViewRoutes

// Get ALL pending approvals (all types combined)
router.get("/pending/all", authMiddleware, superAdminAuthMiddleware, getAllPendingApprovals);

// Get pending approvals by type (hospital, bloodbank, ngo)
router.get("/pending", authMiddleware, superAdminAuthMiddleware, getPendingApprovals);

// Get pending hospitals only
router.get("/pending/hospitals", authMiddleware, superAdminAuthMiddleware, getPendingHospitals);

// Get pending blood banks only
router.get("/pending/bloodbanks", authMiddleware, superAdminAuthMiddleware, getPendingBloodBanks);

// Get pending NGOs only
router.get("/pending/ngos", authMiddleware, superAdminAuthMiddleware, getPendingNgos);

// Get approval statistics summary
router.get("/stats", authMiddleware, superAdminAuthMiddleware, getApprovalStats);

// Get organization details by code (for verification before approval)
router.get("/:id", authMiddleware, superAdminAuthMiddleware, getOrganizationDetails);

// #region ActionRoutes

/**
 * POST /api/admin/approvals/approve
 * Approve a pending organization
 * Body: { organizationCode, approvalRemarks }
 */
router.post("/approve", authMiddleware, superAdminAuthMiddleware, approveOrganization);

/**
 * POST /api/admin/approvals/reject
 * Reject a pending organization
 * Body: { organizationCode, rejectionReason }
 */
router.post("/reject", authMiddleware, superAdminAuthMiddleware, rejectOrganization);

/**
 * POST /api/admin/approvals/suspend
 * Suspend an organization
 * Body: { organizationCode, suspensionReason }
 */
router.post("/suspend", authMiddleware, superAdminAuthMiddleware, suspendOrganization);

export default router;
