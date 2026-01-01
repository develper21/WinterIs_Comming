import express from "express";
import {
	registerDonor,
	registerDonorForCamp,
	recordDonation
} from "../../controllers/Donor/DonorController.js";

const router = express.Router();

// Direct donor registration (NO LOGIN)
router.post("/register", registerDonor);

// Donor camp registration (NO LOGIN)
router.post("/register-for-camp", registerDonorForCamp);

// Record a completed donation and update donor stats
router.post("/donate", recordDonation);

export default router;
