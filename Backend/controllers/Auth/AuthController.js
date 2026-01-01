import OrganizationUser from "../../models/organization/OrganizationUser.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// #region Validators

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  const errors = [];
  if (password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }
  return errors;
};

const validateLoginInput = (data) => {
  const errors = [];
  if (!data.organizationCode) {
    errors.push("Organization code is required");
  }
  if (!data.email || !validateEmail(data.email)) {
    errors.push("Invalid email format");
  }
  if (!data.password) {
    errors.push("Password is required");
  }
  return errors;
};

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

const sendValidationError = (res, errors = []) => {
  res.status(400).json({
    success: false,
    message: "Validation failed",
    errors
  });
};

// #region Controllers

/**
 * LOGIN - Authenticate organization user
 * POST /api/auth/login
 * 
 * Body:
 * {
 *   organizationCode: "HOSP-DEL-001",
 *   email: "doctor@hospital.com",
 *   password: "password123"
 * }
 */
export const login = async (req, res) => {
  try {
    const { organizationCode, email, password } = req.body;

    console.log(`\n[LOGIN_REQUEST] Organization: ${organizationCode}, Email: ${email}`);

    // Validate input
    const validationErrors = validateLoginInput(req.body);
    if (validationErrors.length > 0) {
      console.warn(`[LOGIN_VALIDATION_ERROR] ${validationErrors.join(", ")}`);
      return sendValidationError(res, validationErrors);
    }

    // Find user in organizationUsers collection
    const user = await OrganizationUser.findByUserEmail(organizationCode, email);
    if (!user) {
      console.warn(`[LOGIN_FAILED] User not found: ${organizationCode}/${email}`);
      return sendError(res, "Invalid credentials", 401);
    }

    console.log(`[LOGIN_USER_FOUND] ${user.userCode} - ${user.name} (${user.role})`);

    // Check if user is active
    if (user.status === "INACTIVE") {
      console.warn(`[LOGIN_FAILED] User inactive: ${user.userCode}`);
      return sendError(res, "User account is inactive", 403);
    }

    console.log(`[LOGIN_USER_ACTIVE]`);

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[LOGIN_FAILED] Invalid password: ${user.userCode}`);
      return sendError(res, "Invalid credentials", 401);
    }

    console.log(`[LOGIN_PASSWORD_VERIFIED]`);

    // Generate JWT token with organization context
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        userCode: user.userCode,
        organizationCode: user.organizationCode,
        organizationName: user.organizationName,
        organizationType: user.organizationType,
        role: user.role,
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "24h" }
    );

    console.log(`[LOGIN_TOKEN_GENERATED] ${user.userCode}`);

    // Fetch organization ObjectId from organizations collection
    const { getDB } = await import("../../config/db.js");
    const db = getDB();
    const organization = await db.collection("organizations").findOne({
      organizationCode: user.organizationCode
    });

    console.log(`[LOGIN_ORG_FETCHED] ${organization ? organization._id : 'Not found'}`);

    // Return user data without password
    const userData = {
      _id: user._id,
      userCode: user.userCode,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      organizationCode: user.organizationCode,
      organizationName: user.organizationName,
      organizationType: user.organizationType,
      organizationId: organization ? organization._id.toString() : null  // ← Renamed to organizationId
    };

    console.log(`[LOGIN_SUCCESS] ${user.userCode}\n`);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userData
    });
  } catch (error) {
    console.error(`[LOGIN_ERROR] ${error.message}`);
    sendError(res, `Login failed: ${error.message}`, 500);
  }
};
