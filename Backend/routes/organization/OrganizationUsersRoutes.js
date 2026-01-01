import express from "express";
import authMiddleware from "../../middleware/auth.middleware.js";
import organizationAuthMiddleware from "../../middleware/organizationAuth.middleware.js";
import roleMiddleware from "../../middleware/role.middleware.js";
import {
  createOrganizationUser,
  getOrganizationUsers,
  getOrganizationUserByCode,
  updateOrganizationUser,
  deleteOrganizationUser,
  changeUserPassword,
  getUsersByRole,
  getOrganizationUsersStats
} from "../../controllers/organization/OrganizationUsersController.js";

const router = express.Router();

// #region Create

/**
 * Create a new user for an organization
 * POST /api/organization-users/create
 * Protected: Admin role required
 */
router.post(
  "/create",
  authMiddleware,
  organizationAuthMiddleware,
  roleMiddleware(["ADMIN"]),
  createOrganizationUser
);

// #region Read

/**
 * Get all users for an organization
 * GET /api/organization-users/:organizationCode
 * Protected: Organization scoped
 */
router.get(
  "/:organizationCode",
  authMiddleware,
  organizationAuthMiddleware,
  getOrganizationUsers
);

/**
 * Get user by user code
 * GET /api/organization-users/:organizationCode/user/:userCode
 * Protected: Organization scoped
 */
router.get(
  "/:organizationCode/user/:userCode",
  authMiddleware,
  organizationAuthMiddleware,
  getOrganizationUserByCode
);

/**
 * Get users by role
 * GET /api/organization-users/:organizationCode/role/:role
 * Protected: Organization scoped
 */
router.get(
  "/:organizationCode/role/:role",
  authMiddleware,
  organizationAuthMiddleware,
  getUsersByRole
);

/**
 * Get organization users statistics
 * GET /api/organization-users/:organizationCode/stats
 * Protected: Admin role required
 */
router.get(
  "/:organizationCode/stats",
  authMiddleware,
  organizationAuthMiddleware,
  roleMiddleware(["Admin"]),
  getOrganizationUsersStats
);

// #region Update

/**
 * Update user details (except password)
 * PUT /api/organization-users/:organizationCode/:userCode
 * Protected: Admin role required
 */
router.put(
  "/:organizationCode/:userCode",
  authMiddleware,
  organizationAuthMiddleware,
  roleMiddleware(["Admin"]),
  updateOrganizationUser
);

/**
 * Change user password
 * PUT /api/organization-users/:organizationCode/:userCode/password
 * Protected: Own user or Admin
 */
router.put(
  "/:organizationCode/:userCode/password",
  authMiddleware,
  organizationAuthMiddleware,
  changeUserPassword
);

// #region Delete

/**
 * Delete user
 * DELETE /api/organization-users/:organizationCode/:userCode
 * Protected: Admin role required
 */
router.delete(
  "/:organizationCode/:userCode",
  authMiddleware,
  organizationAuthMiddleware,
  roleMiddleware(["Admin"]),
  deleteOrganizationUser
);

export default router;
