import jwt from "jsonwebtoken";

// #region AuthMiddleware

/**
 * Authentication Middleware - Verify JWT token
 * Decodes token and attaches user data to request
 * 
 * Token contains:
 * - userId: MongoDB ObjectId
 * - userCode: Generated user code
 * - organizationCode: Organization code
 * - organizationName: Organization name
 * - organizationType: Organization type (hospital, bloodbank, ngo)
 * - role: User role (Doctor, Admin, etc.)
 * - email: User email
 * - name: User name
 */
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      console.warn("[AUTH_MIDDLEWARE] No token provided");
      return res.status(401).json({ 
        success: false, 
        message: "No token provided" 
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );

    console.log(`[AUTH_MIDDLEWARE] Token verified for user: ${decoded.userCode} (${decoded.role})`);

    // Attach user info to request for use in controllers and middleware
    req.user = decoded;
    
    // Also attach organization info for organization-scoped operations
    req.organization = {
      code: decoded.organizationCode,
      name: decoded.organizationName,
      type: decoded.organizationType
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      console.warn("[AUTH_MIDDLEWARE] Token expired");
      return res.status(401).json({ 
        success: false, 
        message: "Token has expired" 
      });
    }
    console.error("[AUTH_MIDDLEWARE] Invalid token:", error.message);
    return res.status(401).json({ 
      success: false, 
      message: "Invalid token" 
    });
  }
};

export default authMiddleware;
