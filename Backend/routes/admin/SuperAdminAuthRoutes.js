import express from "express";
import { createSuperAdminLogin } from "../../controllers/admin/SuperAdminController.js";
import { loginLimiter } from "../../middleware/rateLimiter.js";

const router = express.Router();

// SuperAdmin login (with rate limiting)
router.post("/login", loginLimiter, createSuperAdminLogin);

export default router;
