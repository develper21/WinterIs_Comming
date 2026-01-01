import express from "express";
import { getDB } from "../config/db.js";

const router = express.Router();

/**
 * @route   GET /api/public-ngos
 * @desc    Get all verified NGOs
 * @access  Public
 */
router.get("/", async (req, res) => {
    try {
        const { verificationStatus, city, state, page, limit } = req.query;

        const db = getDB();
        const collection = db.collection("organizations");

        // Build query
        const query = {
            type: "ngo" // Only NGOs
        };

        if (verificationStatus) {
            query.status = verificationStatus;
        }

        if (city) {
            query.city = new RegExp(city, "i");
        }

        if (state) {
            query.state = new RegExp(state, "i");
        }

        // Pagination
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const skip = (pageNum - 1) * limitNum;

        // Fetch NGOs
        const ngos = await collection
            .find(query)
            .sort({ name: 1 })
            .skip(skip)
            .limit(limitNum)
            .toArray();

        // Get total count
        const total = await collection.countDocuments(query);

        res.status(200).json({
            success: true,
            data: ngos,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error("Error fetching NGOs:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch NGOs",
            error: error.message
        });
    }
});

/**
 * @route   GET /api/public-ngos/verified
 * @desc    Get all VERIFIED and APPROVED NGOs (shorthand)
 * @access  Public
 */
router.get("/verified", async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection("organizations");

        const ngos = await collection
            .find({
                type: "ngo",
                status: { $in: ["VERIFIED", "APPROVED"] }
            })
            .sort({ name: 1 })
            .toArray();

        res.status(200).json({
            success: true,
            data: ngos
        });
    } catch (error) {
        console.error("Error fetching verified NGOs:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch verified NGOs",
            error: error.message
        });
    }
});

export default router;
