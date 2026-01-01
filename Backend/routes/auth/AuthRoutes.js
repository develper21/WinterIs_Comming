import express from "express";
import { login } from "../../controllers/Auth/AuthController.js";

const router = express.Router();

/**
 * Organization User Login
 * POST /api/auth/login
 * 
 * Body:
 * {
 *   organizationCode: "HOSP-DEL-001",
 *   email: "doctor@hospital.com",
 *   password: "password123"
 * }
 * 
 * Response:
 * {
 *   token: "jwt_token_here",
 *   user: { userCode, name, email, role, organizationCode, ... }
 * }
 */
router.post("/login", login);

export default router;
