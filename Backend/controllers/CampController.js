import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

// #region CampController

/**
 * Get available camps with their slots
 * Only shows camps that are active and have available slots
 */
export const getAvailableCampsWithSlots = async (req, res) => {
  try {
    const db = getDB();

    // Get all active camps
    const camps = await db
      .collection("ngoCamps")
      .find({
        status: "active",
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      })
      .sort({ startDate: 1 })
      .toArray();

    if (camps.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No camps available at the moment",
        camps: []
      });
    }

    // Get slots for each camp
    const campsWithSlots = await Promise.all(
      camps.map(async (camp) => {
        const slots = await db
          .collection("campSlots")
          .find({ campId: new ObjectId(camp._id) })
          .toArray();

        // Filter only available slots (not fully booked)
        const availableSlots = slots.filter(
          (slot) => slot.bookedCount < slot.maxDonors
        );

        return {
          _id: camp._id,
          campName: camp.campName,
          description: camp.description,
          location: camp.location,
          city: camp.city,
          state: camp.state,
          startDate: camp.startDate,
          endDate: camp.endDate,
          contactPersonName: camp.contactPersonName,
          contactMobile: camp.contactMobile,
          totalSlots: camp.totalSlots,
          expectedDonors: camp.expectedDonors,
          slots: availableSlots.map((slot) => ({
            _id: slot._id,
            campId: slot.campId,
            slotTime: slot.slotTime,
            maxDonors: slot.maxDonors,
            bookedCount: slot.bookedCount,
            availableSeats: slot.maxDonors - slot.bookedCount
          }))
        };
      })
    );

    // Filter camps that have at least one available slot
    const campsWithAvailableSlots = campsWithSlots.filter(
      (camp) => camp.slots.length > 0
    );

    res.status(200).json({
      success: true,
      message: `${campsWithAvailableSlots.length} camps available`,
      camps: campsWithAvailableSlots
    });
  } catch (error) {
    console.error("Get available camps error:", error);
    res.status(500).json({
      message: "Server error",
      ...(process.env.NODE_ENV === "development" && { error: error.message })
    });
  }
};

/**
 * Get slots for a specific camp
 */
export const getCampSlots = async (req, res) => {
  try {
    const { campId } = req.params;

    if (!campId || !ObjectId.isValid(campId)) {
      return res.status(400).json({
        message: "Invalid campId provided"
      });
    }

    const db = getDB();

    // Get camp details
    const camp = await db
      .collection("ngoCamps")
      .findOne({ _id: new ObjectId(campId) });

    if (!camp) {
      return res.status(404).json({
        message: "Camp not found"
      });
    }

    // Get available slots for this camp
    const slots = await db
      .collection("campSlots")
      .find({ campId: new ObjectId(campId) })
      .toArray();

    const availableSlots = slots
      .filter((slot) => slot.bookedCount < slot.maxDonors)
      .map((slot) => ({
        _id: slot._id,
        slotTime: slot.slotTime,
        maxDonors: slot.maxDonors,
        bookedCount: slot.bookedCount,
        availableSeats: slot.maxDonors - slot.bookedCount
      }));

    res.status(200).json({
      success: true,
      camp: {
        _id: camp._id,
        campName: camp.campName,
        location: camp.location,
        city: camp.city,
        startDate: camp.startDate,
        endDate: camp.endDate
      },
      slots: availableSlots
    });
  } catch (error) {
    console.error("Get camp slots error:", error);
    res.status(500).json({
      message: "Server error",
      ...(process.env.NODE_ENV === "development" && { error: error.message })
    });
  }
};
