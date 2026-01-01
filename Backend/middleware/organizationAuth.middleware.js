// #region OrganizationAuthMiddleware

/**
 * Organization Authorization Middleware
 * Ensures user can only access resources within their organization
 * 
 * Usage:
 * app.get('/api/users/:organizationCode/...', 
 *   authMiddleware, 
 *   organizationAuthMiddleware,
 *   controller
 * )
 */
const organizationAuthMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      console.warn("[ORG_AUTH_MIDDLEWARE] User not authenticated");
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    // Get organization code from URL parameters
    const urlOrgCode = req.params.organizationCode;

    // If organizationCode is in URL, verify user belongs to that organization
    if (urlOrgCode) {
      if (req.user.organizationCode !== urlOrgCode) {
        console.warn(
          `[ORG_AUTH_MIDDLEWARE] Access denied - User ${req.user.userCode} ` +
          `from ${req.user.organizationCode} tried to access ${urlOrgCode}`
        );
        return res.status(403).json({
          success: false,
          message: "You don't have access to this organization"
        });
      }

      console.log(
        `[ORG_AUTH_MIDDLEWARE] User ${req.user.userCode} ` +
        `accessing their organization: ${urlOrgCode}`
      );
    }

    // Store organization info in request for controllers
    req.orgCode = req.user.organizationCode;

    next();
  } catch (error) {
    console.error("[ORG_AUTH_MIDDLEWARE] Error:", error);
    res.status(403).json({
      success: false,
      message: "Authorization check failed"
    });
  }
};

export default organizationAuthMiddleware;
