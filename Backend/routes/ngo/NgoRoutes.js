import express from "express";
import {
  // Camp Management
  createCamp,
  getMyCamps,
  getCampById,
  updateCamp,
  deleteCamp,
  // Slot Management
  createSlot,
  getSlotsByCamp,
  updateSlot,
  deleteSlot,
  // Registration Management
  registerDonorToSlot,
  getMyRegistrations,
  getCampRegistrations,
  cancelRegistration
} from "../../controllers/NGO/NgoController.js";

import authMiddleware from "../../middleware/auth.middleware.js";
import roleMiddleware from "../../middleware/role.middleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// #region CampRoutes

// Create camp (ADMIN only)
router.post("/camp", roleMiddleware(["ADMIN"]), createCamp);

// Get all my camps (ADMIN only)
router.get("/camp", roleMiddleware(["ADMIN"]), getMyCamps);

// Get camp by ID
router.get("/camp/:campId", getCampById);

// Update camp (NGO owner only)
router.put("/camp/:campId", roleMiddleware(["ngo","ADMIN"]), updateCamp);

// Delete camp (NGO owner only)
router.delete("/camp/:campId", roleMiddleware(["ngo","ADMIN"]), deleteCamp);

// #region SlotRoutes

// Create slot for camp (NGO owner only)
router.post("/slot", roleMiddleware(["ngo","ADMIN"]), createSlot);

// Get all slots for a camp
router.get("/camp/:campId/slots", getSlotsByCamp);

// Update slot (NGO owner only)
router.put("/slot/:slotId", roleMiddleware(["ngo","ADMIN"]), updateSlot);

// Delete slot (NGO owner only)
router.delete("/slot/:slotId", roleMiddleware(["ngo"]), deleteSlot);

// #region RegistrationRoutes

// Register donor to camp slot (Donor/User only)
router.post("/register", roleMiddleware(["user"]), registerDonorToSlot);

// Get my registrations (Donor specific)
router.get("/registrations", roleMiddleware(["user"]), getMyRegistrations);

// Get all registrations for a camp (NGO owner only)
router.get("/camp/:campId/registrations", roleMiddleware(["ngo"]), getCampRegistrations);

// Cancel registration (Donor can cancel their own)
router.delete("/registration/:registrationId", roleMiddleware(["user"]), cancelRegistration);

export default router;
