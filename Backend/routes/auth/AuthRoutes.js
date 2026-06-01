import express from "express";
import { login, register } from "../../controllers/Auth/AuthController.js";

const router = express.Router();

/**
 * Regular User Registration
 * POST /api/auth/register
 * 
 * Body:
 * {
 *   name: "Aarav Sharma",
 *   email: "aarav.sharma@bloodbridge.test",
 *   password: "Aarav@2026",
 *   role: "User"
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   message: "Registration successful",
 *   user: { _id, name, email, role, ... }
 * }
 */
router.post("/register", register);

/**
 * User Login (Regular User or Organization User)
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
 * 
 * Response:
 * {
 *   token: "jwt_token_here",
 *   user: { userCode, name, email, role, organizationCode, ... }
 * }
 */
router.post("/login", login);

export default router;
