import OrganizationUser from "../../models/organization/OrganizationUser.js";
import User from "../../models/ngo/User.js";
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
  // For organization users, organizationCode is required
  // For regular users, it's optional
  if (!data.email || !validateEmail(data.email)) {
    errors.push("Invalid email format");
  }
  if (!data.password) {
    errors.push("Password is required");
  }
  return errors;
};

const validateRegisterInput = (data) => {
  const errors = [];
  if (!data.name) {
    errors.push("Name is required");
  }
  if (!data.email || !validateEmail(data.email)) {
    errors.push("Invalid email format");
  }
  if (!data.password) {
    errors.push("Password is required");
  }
  if (data.password && data.password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }
  if (!data.role) {
    errors.push("Role is required");
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
 * REGISTER - Register a regular user
 * POST /api/auth/register
 * 
 * Body:
 * {
 *   name: "Aarav Sharma",
 *   email: "aarav.sharma@bloodbridge.test",
 *   password: "Aarav@2026",
 *   role: "User"
 * }
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    console.log(`\n[REGISTER_REQUEST] Name: ${name}, Email: ${email}, Role: ${role}`);

    // Validate input
    const validationErrors = validateRegisterInput(req.body);
    if (validationErrors.length > 0) {
      console.warn(`[REGISTER_VALIDATION_ERROR] ${validationErrors.join(", ")}`);
      return sendValidationError(res, validationErrors);
    }

    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.warn(`[REGISTER_FAILED] Email already exists: ${email}`);
      return sendError(res, "Email already registered", 409);
    }

    console.log(`[REGISTER_EMAIL_UNIQUE] ${email}`);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`[REGISTER_PASSWORD_HASHED]`);

    // Create user
    const userData = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newUser = await User.create(userData);
    console.log(`[REGISTER_USER_CREATED] ${newUser._id} - ${name} (${role})`);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "24h" }
    );

    console.log(`[REGISTER_TOKEN_GENERATED]`);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = newUser;

    console.log(`[REGISTER_SUCCESS] ${email}\n`);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error(`[REGISTER_ERROR] ${error.message}`);
    sendError(res, `Registration failed: ${error.message}`, 500);
  }
};

/**
 * LOGIN - Authenticate user (regular or organization user)
 * POST /api/auth/login
 * 
 * For Regular User:
 * {
 *   email: "aarav.sharma@bloodbridge.test",
 *   password: "Aarav@2026"
 * }
 * 
 * For Organization User:
 * {
 *   organizationCode: "HOSP-DEL-001",
 *   email: "doctor@hospital.com",
 *   password: "password123"
 * }
 */
export const login = async (req, res) => {
  try {
    const { organizationCode, email, password } = req.body;

    console.log(`\n[LOGIN_REQUEST] Organization: ${organizationCode || 'N/A'}, Email: ${email}`);

    // Validate input
    const validationErrors = validateLoginInput(req.body);
    if (validationErrors.length > 0) {
      console.warn(`[LOGIN_VALIDATION_ERROR] ${validationErrors.join(", ")}`);
      return sendValidationError(res, validationErrors);
    }

    let user;
    let token;
    let userData;

    // If organizationCode is provided, try organization user login
    if (organizationCode) {
      console.log(`[LOGIN_TYPE] Organization User Login`);
      
      // Find user in organizationUsers collection
      user = await OrganizationUser.findByUserEmail(organizationCode, email);
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
      token = jwt.sign(
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
      userData = {
        _id: user._id,
        userCode: user.userCode,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        organizationCode: user.organizationCode,
        organizationName: user.organizationName,
        organizationType: user.organizationType,
        organizationId: organization ? organization._id.toString() : null
      };

      console.log(`[LOGIN_SUCCESS] ${user.userCode}\n`);

    } else {
      // Regular user login (no organizationCode)
      console.log(`[LOGIN_TYPE] Regular User Login`);
      
      // Find user in users collection
      user = await User.findByEmail(email);
      if (!user) {
        console.warn(`[LOGIN_FAILED] User not found: ${email}`);
        return sendError(res, "Invalid credentials", 401);
      }

      console.log(`[LOGIN_USER_FOUND] ${user._id} - ${user.name} (${user.role})`);

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.warn(`[LOGIN_FAILED] Invalid password: ${email}`);
        return sendError(res, "Invalid credentials", 401);
      }

      console.log(`[LOGIN_PASSWORD_VERIFIED]`);

      // Generate JWT token
      token = jwt.sign(
        {
          userId: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET || "your_jwt_secret",
        { expiresIn: "24h" }
      );

      console.log(`[LOGIN_TOKEN_GENERATED]`);

      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      userData = userWithoutPassword;

      console.log(`[LOGIN_SUCCESS] ${email}\n`);
    }

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
