import jwt from "jsonwebtoken";
import Admin from "../models/admin/Admin.js";

/**
 * SuperAdmin Authentication Middleware
 * ✅ Verifies JWT token is from superadmin
 * ✅ Checks superadmin still exists and is active in admins collection
 * ✅ Used on all superadmin endpoints
 */
const superAdminAuthMiddleware = async (req, res, next) => {
  try {
    // Check if authMiddleware has already verified the token
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    console.log(`[SUPERADMIN_AUTH_MIDDLEWARE] Token verified for user: ${req.user.email}`);

    // ✅ Check if role is SUPERADMIN in the token itself
    if (req.user.role !== "SUPERADMIN" && req.user.role !== "superadmin") {
      console.log(`[SUPERADMIN_AUTH_MIDDLEWARE] User role is not SUPERADMIN: ${req.user.role}`);
      return res.status(403).json({
        success: false,
        message: "Superadmin not authorized"
      });
    }

    // ✅ CRITICAL: Verify admin exists in admins collection and is active
    let admin = await Admin.findByEmail(req.user.email);
    
    if (!admin) {
      console.log(`[SUPERADMIN_AUTH_MIDDLEWARE] Superadmin not found in database for email: ${req.user.email}`);
      return res.status(403).json({
        success: false,
        message: "Superadmin not authorized"
      });
    }
    
    // Verify admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Superadmin account is inactive"
      });
    }

    // Update request with admin info from database
    req.user = {
      id: admin._id,
      email: admin.email,
      adminCode: admin.adminCode,
      role: "SUPERADMIN",
      permissions: admin.permissions
    };

    next();

  } catch (error) {
    console.error("[SUPERADMIN_AUTH_MIDDLEWARE] Error:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Superadmin token has expired"
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid superadmin token"
    });
  }
};

export default superAdminAuthMiddleware;
