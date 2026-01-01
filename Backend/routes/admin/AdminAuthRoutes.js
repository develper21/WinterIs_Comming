import express from "express";
import {
  adminLogin,
  getAdminProfile,
  adminLogout,
  adminRegister
} from "../../controllers/admin/AdminAuthController.js";

import adminAuthMiddleware from "../../middleware/adminAuth.middleware.js";
import { loginLimiter } from "../../middleware/rateLimiter.js";

const router = express.Router();

// #region PublicEndpoints

// Admin login (with rate limiting)
router.post("/login", loginLimiter, adminLogin);

// Admin registration (protected - only existing admins can register new admins)
router.post("/register", adminAuthMiddleware, adminRegister);

// #region ProtectedEndpoints

// Get admin profile
router.get("/me", adminAuthMiddleware, getAdminProfile);

// Admin logout
router.post("/logout", adminAuthMiddleware, adminLogout);

export default router;
