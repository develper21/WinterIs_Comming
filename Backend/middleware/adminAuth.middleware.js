import jwt from "jsonwebtoken";
import Admin from "../models/admin/Admin.js";

// #region AdminAuthMiddleware

/**
 * Admin Authentication Middleware
 * ✅ Verifies JWT token is from admin
 * ✅ Checks admin still exists and is active in admins collection
 * ✅ Used on all admin endpoints
 */
const adminAuthMiddleware = async (req, res, next) => {
  try {
    // Check if authMiddleware has already verified the token
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    console.log(`[ADMIN_AUTH_MIDDLEWARE] Token verified for admin: ${req.user.email}`);

    // ✅ Check if role is ADMIN in the token itself
    if (req.user.role !== "ADMIN") {
      console.log(`[ADMIN_AUTH_MIDDLEWARE] User role is not ADMIN: ${req.user.role}`);
      return res.status(403).json({
        success: false,
        message: "Admin not authorized"
      });
    }

    // ✅ CRITICAL: Verify admin exists in admins collection and is active
    let admin = await Admin.findByEmail(req.user.email);
    
    if (!admin) {
      console.log(`[ADMIN_AUTH_MIDDLEWARE] Admin not found in database for email: ${req.user.email}`);
      return res.status(403).json({
        success: false,
        message: "Admin not authorized"
      });
    }
    
    // Verify admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account is inactive"
      });
    }

    // Update request with admin info from database
    req.user = {
      id: admin._id,
      email: admin.email,
      adminCode: admin.adminCode,
      role: "ADMIN",
      permissions: admin.permissions
    };

    next();

  } catch (error) {
    console.error("[ADMIN_AUTH_MIDDLEWARE] Error:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Admin token has expired"
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid admin token"
    });
  }
};

export default adminAuthMiddleware;
