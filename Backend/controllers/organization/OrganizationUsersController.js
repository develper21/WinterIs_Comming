import OrganizationUser from "../../models/organization/OrganizationUser.js";

// #region Validators

const validateUserCreationInput = (data) => {
  const errors = [];

  if (!data.organizationCode) errors.push("Organization code is required");
  if (!data.name) errors.push("User name is required");
  if (!data.email) errors.push("User email is required");
  if (!data.password) errors.push("User password is required");
  if (!data.role) errors.push("User role is required");

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    errors.push("Invalid email format");
  }

  // Password strength
  if (data.password && data.password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  return errors;
};

// #region ResponseHandlers

const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const sendError = (res, message = "An error occurred", statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    message,
    data: null
  });
};

// #region UserOperations

/**
 * Create a new user for an organization
 * POST /api/organization-users/create
 */
export const createOrganizationUser = async (req, res) => {
  try {
    const { organizationCode, name, email, password, role, status = "ACTIVE" } = req.body;

    console.log(`\n[USER_CREATE_REQUEST] organizationCode: ${organizationCode}, role: ${role}, email: ${email}`);

    // ✅ CRITICAL: Verify admin belongs to the same organization
    if (req.user.organizationCode !== organizationCode) {
      console.warn(
        `[SECURITY_VIOLATION] Admin ${req.user.userCode} from ${req.user.organizationCode} ` +
        `attempted to create user in ${organizationCode}`
      );
      return sendError(
        res,
        `You can only create users in your own organization (${req.user.organizationCode})`,
        403
      );
    }

    // Validate input
    const validationErrors = validateUserCreationInput(req.body);
    if (validationErrors.length > 0) {
      console.warn(`[VALIDATION_ERROR] ${validationErrors.join(", ")}`);
      return sendError(res, validationErrors.join(", "), 400);
    }

    // Create user
    const userData = {
      organizationCode,
      name,
      email,
      password,
      role,
      status
    };

    const result = await OrganizationUser.create(userData);

    console.log(`[USER_CREATE_SUCCESS]\n`);

    sendSuccess(res, {
      ...result,
      message: `User ${role} created successfully`
    }, `User ${role} created successfully`, 201);

  } catch (error) {
    console.error(`[ERROR] Create user error:`, error.message);
    
    if (error.message === "Organization not found") {
      return sendError(res, "Organization not found", 404);
    }
    if (error.message === "Email already exists in this organization") {
      return sendError(res, error.message, 409);
    }

    sendError(res, `Failed to create user: ${error.message}`, 500);
  }
};

/**
 * Get all users for an organization
 * GET /api/organization-users/:organizationCode
 */
export const getOrganizationUsers = async (req, res) => {
  try {
    const { organizationCode } = req.params;
    const { page = 1, limit = 10, role, status } = req.query;

    console.log(`[GET_USERS_REQUEST] organizationCode: ${organizationCode}`);

    const options = { page, limit, role, status };
    const result = await OrganizationUser.findByOrganization(organizationCode, options);

    sendSuccess(res, result, `Found ${result.pagination.totalItems} users`);

  } catch (error) {
    console.error(`[ERROR] Get users error:`, error.message);
    
    if (error.message === "Organization not found") {
      return sendError(res, "Organization not found", 404);
    }

    sendError(res, `Failed to fetch users: ${error.message}`, 500);
  }
};

/**
 * Get user by user code
 * GET /api/organization-users/:organizationCode/user/:userCode
 */
export const getOrganizationUserByCode = async (req, res) => {
  try {
    const { organizationCode, userCode } = req.params;

    console.log(`[GET_USER_REQUEST] ${organizationCode} - ${userCode}`);

    const user = await OrganizationUser.findByUserCode(organizationCode, userCode);

    sendSuccess(res, user, "User found");

  } catch (error) {
    console.error(`[ERROR] Get user error:`, error.message);
    
    if (error.message === "User not found") {
      return sendError(res, "User not found", 404);
    }

    sendError(res, `Failed to fetch user: ${error.message}`, 500);
  }
};

/**
 * Update user details (except password)
 * PUT /api/organization-users/:organizationCode/:userCode
 */
export const updateOrganizationUser = async (req, res) => {
  try {
    const { organizationCode, userCode } = req.params;
    const { name, role, status } = req.body;

    console.log(`[UPDATE_USER_REQUEST] ${organizationCode} - ${userCode}`);

    // ✅ CRITICAL: Verify admin belongs to the same organization
    if (req.user.organizationCode !== organizationCode) {
      console.warn(
        `[SECURITY_VIOLATION] Admin ${req.user.userCode} from ${req.user.organizationCode} ` +
        `attempted to update user in ${organizationCode}`
      );
      return sendError(
        res,
        `You can only update users in your own organization (${req.user.organizationCode})`,
        403
      );
    }

    const updateData = { name, role, status };
    const user = await OrganizationUser.update(organizationCode, userCode, updateData);

    sendSuccess(res, user, "User updated successfully");

  } catch (error) {
    console.error(`[ERROR] Update user error:`, error.message);
    
    if (error.message === "User not found") {
      return sendError(res, "User not found", 404);
    }

    sendError(res, `Failed to update user: ${error.message}`, 500);
  }
};

/**
 * Delete user
 * DELETE /api/organization-users/:organizationCode/:userCode
 */
export const deleteOrganizationUser = async (req, res) => {
  try {
    const { organizationCode, userCode } = req.params;

    console.log(`[DELETE_USER_REQUEST] ${organizationCode} - ${userCode}`);

    // ✅ CRITICAL: Verify admin belongs to the same organization
    if (req.user.organizationCode !== organizationCode) {
      console.warn(
        `[SECURITY_VIOLATION] Admin ${req.user.userCode} from ${req.user.organizationCode} ` +
        `attempted to delete user in ${organizationCode}`
      );
      return sendError(
        res,
        `You can only delete users in your own organization (${req.user.organizationCode})`,
        403
      );
    }

    await OrganizationUser.delete(organizationCode, userCode);

    sendSuccess(res, {
      userCode: userCode,
      message: "User deleted successfully"
    }, "User deleted successfully");

  } catch (error) {
    console.error(`[ERROR] Delete user error:`, error.message);
    
    if (error.message === "User not found") {
      return sendError(res, "User not found", 404);
    }

    sendError(res, `Failed to delete user: ${error.message}`, 500);
  }
};

/**
 * Change user password
 * PUT /api/organization-users/:organizationCode/:userCode/password
 */
export const changeUserPassword = async (req, res) => {
  try {
    const { organizationCode, userCode } = req.params;
    const { currentPassword, newPassword } = req.body;

    console.log(`[PASSWORD_CHANGE_REQUEST] ${organizationCode} - ${userCode}`);

    if (!currentPassword || !newPassword) {
      return sendError(res, "Current password and new password are required", 400);
    }

    if (newPassword.length < 6) {
      return sendError(res, "New password must be at least 6 characters", 400);
    }

    await OrganizationUser.changePassword(organizationCode, userCode, currentPassword, newPassword);

    sendSuccess(res, {
      userCode: userCode,
      message: "Password changed successfully"
    }, "Password changed successfully");

  } catch (error) {
    console.error(`[ERROR] Change password error:`, error.message);
    
    if (error.message === "User not found") {
      return sendError(res, "User not found", 404);
    }
    if (error.message === "Current password is incorrect") {
      return sendError(res, error.message, 401);
    }

    sendError(res, `Failed to change password: ${error.message}`, 500);
  }
};

/**
 * Get users by role
 * GET /api/organization-users/:organizationCode/role/:role
 */
export const getUsersByRole = async (req, res) => {
  try {
    const { organizationCode, role } = req.params;
    const { page = 1, limit = 10 } = req.query;

    console.log(`[GET_USERS_BY_ROLE_REQUEST] ${organizationCode} - ${role}`);

    const options = { page, limit };
    const result = await OrganizationUser.findByRole(organizationCode, role, options);

    sendSuccess(res, result, `Found ${result.pagination.totalItems} users with role ${role}`);

  } catch (error) {
    console.error(`[ERROR] Get users by role error:`, error.message);
    
    if (error.message === "Organization not found") {
      return sendError(res, "Organization not found", 404);
    }

    sendError(res, `Failed to fetch users: ${error.message}`, 500);
  }
};

/**
 * Get organization users statistics
 * GET /api/organization-users/:organizationCode/stats
 */
export const getOrganizationUsersStats = async (req, res) => {
  try {
    const { organizationCode } = req.params;

    console.log(`[STATS_REQUEST] ${organizationCode}`);

    const stats = await OrganizationUser.getStats(organizationCode);

    sendSuccess(res, stats, "Statistics retrieved");

  } catch (error) {
    console.error(`[ERROR] Get stats error:`, error.message);
    
    if (error.message === "Organization not found") {
      return sendError(res, "Organization not found", 404);
    }

    sendError(res, `Failed to fetch statistics: ${error.message}`, 500);
  }
};
