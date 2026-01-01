import express from "express";
import { getDB } from "../config/db.js";

const router = express.Router();

/**
 * @route   GET /api/blood-banks
 * @desc    Get all verified blood banks
 * @access  Public (can be protected based on requirements)
 */
router.get("/", async (req, res) => {
    try {
        const { verificationStatus, city, state, page, limit } = req.query;

        const db = getDB();
        const collection = db.collection("organizations");

        // Build query
        const query = {
            type: "bloodbank" // Only blood banks
        };

        if (verificationStatus) {
            query.verificationStatus = verificationStatus;
        }

        if (city) {
            query.city = new RegExp(city, "i"); // Case-insensitive search
        }

        if (state) {
            query.state = new RegExp(state, "i");
        }

        // Pagination
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const skip = (pageNum - 1) * limitNum;

        // Fetch blood banks
        const bloodBanks = await collection
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .toArray();

        // Get total count
        const total = await collection.countDocuments(query);

        res.status(200).json({
            success: true,
            data: bloodBanks,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error("Error fetching blood banks:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch blood banks",
            error: error.message
        });
    }
});

/**
 * @route   GET /api/blood-banks/verified
 * @desc    Get all VERIFIED blood banks (shorthand)
 * @access  Public
 */
router.get("/verified", async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection("organizations");

        const bloodBanks = await collection
            .find({
                type: "bloodbank",
                status: "APPROVED"
            })
            .sort({ name: 1 })
            .toArray();

        res.status(200).json({
            success: true,
            data: bloodBanks
        });
    } catch (error) {
        console.error("Error fetching verified blood banks:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch verified blood banks",
            error: error.message
        });
    }
});

/**
 * @route   GET /api/blood-banks/:id
 * @desc    Get blood bank by ID
 * @access  Public
 */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { ObjectId } = await import("mongodb");

        const db = getDB();
        const collection = db.collection("organizations");

        const bloodBank = await collection.findOne({
            _id: new ObjectId(id),
            type: "bloodbank"
        });

        if (!bloodBank) {
            return res.status(404).json({
                success: false,
                message: "Blood bank not found"
            });
        }

        res.status(200).json({
            success: true,
            data: bloodBank
        });
    } catch (error) {
        console.error("Error fetching blood bank:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch blood bank",
            error: error.message
        });
    }
});

export default router;
