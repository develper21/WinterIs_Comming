import Admin from "../../models/admin/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// #region Admin Auth
const validateAdminLoginInput = (data) => {
  const errors = [];
  if (!data.email) {
    errors.push("Email is required");
  }
  if (!data.password) {
    errors.push("Password is required");
  }
  return errors;
};

const validateAdminRegistrationInput = (data) => {
  const errors = [];
  if (!data.email) {
    errors.push("Email is required");
  }
  if (!data.password) {
    errors.push("Password is required");
  }
  if (!data.name) {
    errors.push("Name is required");
  }
  if (!data.adminCode) {
    errors.push("Admin code is required");
  }
  if (!Array.isArray(data.permissions) || data.permissions.length === 0) {
    errors.push("Permissions array is required");
  }
  
  if (data.password && data.password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    errors.push("Invalid email format");
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

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    const validationErrors = validateAdminLoginInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors
      });
    }

    const admin = await Admin.findByEmail(email);

    if (!admin) {
      return sendError(res, "Invalid admin credentials", 401);
    }

    if (!admin.isActive) {
      return sendError(res, "Admin account is inactive", 403);
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      await Admin.updateLoginHistory(admin._id, ipAddress, false);
      return sendError(res, "Invalid admin credentials", 401);
    }

    await Admin.updateLoginHistory(admin._id, ipAddress, true);

    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        adminCode: admin.adminCode,
        role: "ADMIN",
        permissions: admin.permissions
      },
      process.env.JWT_SECRET || "admin_jwt_secret",
      { expiresIn: "24h" }
    );

    const adminData = {
      _id: admin._id,
      adminCode: admin.adminCode,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      permissions: admin.permissions
    };

    sendSuccess(res, {
      token,
      admin: adminData
    }, "Admin login successful", 200);

  } catch (error) {
    console.error("Admin login error:", error);
    sendError(res, "Login failed", 500);
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);

    if (!admin || !admin.isActive) {
      return sendError(res, "Admin not found", 404);
    }

    const adminData = {
      _id: admin._id,
      adminCode: admin.adminCode,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      permissions: admin.permissions,
      loginHistory: admin.loginHistory
    };

    sendSuccess(res, adminData, "Admin profile retrieved");

  } catch (error) {
    console.error("Get admin profile error:", error);
    sendError(res, "Failed to retrieve profile", 500);
  }
};

export const adminLogout = async (req, res) => {
  try {
    sendSuccess(res, null, "Admin logged out successfully");
  } catch (error) {
    sendError(res, "Logout failed", 500);
  }
};

export const adminRegister = async (req, res) => {
  try {
    const { email, password, name, adminCode, permissions } = req.body;
    const createdBy = req.user._id;

    const validationErrors = validateAdminRegistrationInput(req.body);
    if (validationErrors.length > 0) {
      return sendError(res, validationErrors.join(", "), 400);
    }

    const existingAdmin = await Admin.findByEmail(email);
    if (existingAdmin) {
      return sendError(res, "Admin with this email already exists", 409);
    }

    const existingCode = await Admin.findByCode(adminCode);
    if (existingCode) {
      return sendError(res, "Admin code already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await Admin.create({
      email,
      password: hashedPassword,
      name,
      adminCode,
      permissions,
      isActive: true,
      role: "ADMIN",
      createdBy
    });

    const adminData = {
      _id: newAdmin._id,
      adminCode: newAdmin.adminCode,
      name: newAdmin.name,
      email: newAdmin.email,
      permissions: newAdmin.permissions,
      isActive: newAdmin.isActive,
      createdAt: newAdmin.createdAt
    };

    console.log(`[ADMIN REGISTRATION] New admin registered: ${email} by admin: ${req.user.email}`);

    sendSuccess(res, adminData, "Admin registered successfully", 201);

  } catch (error) {
    console.error("Admin registration error:", error);
    sendError(res, "Admin registration failed", 500);
  }
};
