// #region RoleMiddleware

/**
 * Role-based Access Control Middleware
 * Ensures user has required role within their organization
 * 
 * Usage:
 * app.post('/api/admin/...',
 *   authMiddleware,
 *   organizationAuthMiddleware,
 *   roleMiddleware(["Admin"]),
 *   controller
 * )
 * 
 * Supports both array and variadic arguments:
 * roleMiddleware(["admin", "director"])
 * roleMiddleware("admin", "director")
 */
const roleMiddleware = (allowedRolesInput) => {
  // Handle both array and variadic arguments
  let allowedRoles = Array.isArray(allowedRolesInput) 
    ? allowedRolesInput 
    : [allowedRolesInput];

  return (req, res, next) => {
    try {
      if (!req.user) {
        console.warn("[ROLE_MIDDLEWARE] User not found in request");
        return res.status(403).json({ 
          success: false, 
          message: "User information not found" 
        });
      }

      const userRole = req.user.role;
      const userCode = req.user.userCode;
      const orgCode = req.user.organizationCode;

      if (!allowedRoles.includes(userRole)) {
        console.warn(
          `[ROLE_MIDDLEWARE] Access denied - User ${userCode} (${userRole}) ` +
          `from ${orgCode} attempted to access resource requiring ${allowedRoles.join(", ")}`
        );
        return res.status(403).json({ 
          success: false, 
          message: `This action requires role(s): ${allowedRoles.join(", ")}. You have role: ${userRole}` 
        });
      }

      console.log(
        `[ROLE_MIDDLEWARE] User ${userCode} (${userRole}) ` +
        `authorized to access resource in ${orgCode}`
      );

      next();
    } catch (error) {
      console.error("[ROLE_MIDDLEWARE] Error:", error);
      res.status(403).json({ 
        success: false, 
        message: "Authorization check failed" 
      });
    }
  };
};

export default roleMiddleware;
