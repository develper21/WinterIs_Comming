import NgoCamp from "../../models/ngo/NgoCamp.js";
import CampSlot from "../../models/ngo/CampSlot.js";
import CampRegistration from "../../models/ngo/CampRegistration.js";
import { ObjectId } from "mongodb";

// #region Validators

const validateCampInput = (data) => {
  const errors = [];
  if (!data.campName || data.campName.trim().length < 3) {
    errors.push("Camp name must be at least 3 characters");
  }
  if (!data.location || data.location.trim().length < 3) {
    errors.push("Location is required");
  }
  if (!data.startDate) {
    errors.push("Start date is required");
  }
  if (!data.endDate) {
    errors.push("End date is required");
  }
  if (data.startDate && data.endDate && new Date(data.startDate) >= new Date(data.endDate)) {
    errors.push("End date must be after start date");
  }
  return errors;
};

const validateSlotInput = (data) => {
  const errors = [];
  if (!data.campId) {
    errors.push("Camp ID is required");
  }
  if (!data.slotTime || data.slotTime.trim().length < 5) {
    errors.push("Slot time is required (e.g., '09:00 - 10:00')");
  }
  if (!data.maxDonors || data.maxDonors < 1) {
    errors.push("Max donors must be at least 1");
  }
  return errors;
};

const validateRegistrationInput = (data) => {
  const errors = [];
  if (!data.campId) {
    errors.push("Camp ID is required");
  }
  if (!data.slotId) {
    errors.push("Slot ID is required");
  }
  if (!data.bloodGroup || data.bloodGroup.trim().length < 1) {
    errors.push("Blood group is required");
  }
  const validBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  if (data.bloodGroup && !validBloodGroups.includes(data.bloodGroup)) {
    errors.push("Invalid blood group");
  }
  return errors;
};

// #region ResponseHandlers

const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const sendError = (res, message = "An error occurred", statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    message,
    data: null
  });
};

const sendValidationError = (res, errors = []) => {
  res.status(400).json({
    success: false,
    message: "Validation failed",
    errors
  });
};

// #region CampManagement

/**
 * CREATE BLOOD DONATION CAMP (NGO only)
 */
export const createCamp = async (req, res) => {
  try {
    // Check if user is ADMIN
    if (req.user.role !== "ADMIN") {
      return sendError(res, "Only ADMIN can create camps", 403);
    }

    // Validate input
    const validationErrors = validateCampInput(req.body);
    if (validationErrors.length > 0) {
      console.warn("[CREATE_CAMP] Validation errors:", validationErrors);
      console.warn("[CREATE_CAMP] Received data:", req.body);
      return sendValidationError(res, validationErrors);
    }

    // Create camp
    const camp = await NgoCamp.create({
      ngoId: new ObjectId(req.user.userId),
      campName: req.body.campName,
      location: req.body.location,
      city: req.body.city || "",
      state: req.body.state || "",
      pincode: req.body.pincode || "",
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      description: req.body.description || "",
      contactPersonName: req.body.contactPersonName || "",
      contactMobile: req.body.contactMobile || "",
      expectedDonors: req.body.expectedDonors || 0
    });

    sendSuccess(res, camp, "Camp created successfully", 201);
  } catch (error) {
    console.error("Create camp error:", error);
    sendError(res, "Failed to create camp", 500);
  }
};

/**
 * GET ALL CAMPS BY LOGGED-IN NGO
 */
export const getMyCamps = async (req, res) => {
  try {
    console.log("[getMyCamps] User ID:", req.user.userId);
    const camps = await NgoCamp.findByNgoId(req.user.userId);
    console.log("[getMyCamps] Retrieved camps:", camps.length);
    sendSuccess(res, camps, "Camps retrieved successfully");
  } catch (error) {
    console.error("Get my camps error:", error);
    sendError(res, "Failed to retrieve camps", 500);
  }
};

/**
 * GET CAMP DETAILS BY ID
 */
export const getCampById = async (req, res) => {
  try {
    const { campId } = req.params;
    const camp = await NgoCamp.findById(campId);

    if (!camp) {
      return sendError(res, "Camp not found", 404);
    }

    sendSuccess(res, camp, "Camp retrieved successfully");
  } catch (error) {
    console.error("Get camp by ID error:", error);
    sendError(res, "Failed to retrieve camp", 500);
  }
};

/**
 * UPDATE CAMP (NGO owner only)
 */
export const updateCamp = async (req, res) => {
  try {
    const { campId } = req.params;
    const camp = await NgoCamp.findById(campId);

    if (!camp) {
      return sendError(res, "Camp not found", 404);
    }

    // Check if user owns this camp
    if (camp.ngoId.toString() !== req.user.userId) {
      return sendError(res, "You are not authorized to update this camp", 403);
    }

    // Validate input if provided
    if (req.body.campName || req.body.startDate || req.body.endDate || req.body.location) {
      const validationErrors = validateCampInput({ ...camp, ...req.body });
      if (validationErrors.length > 0) {
        return sendValidationError(res, validationErrors);
      }
    }

    const updatedCamp = await NgoCamp.updateById(campId, req.body);
    sendSuccess(res, updatedCamp, "Camp updated successfully");
  } catch (error) {
    console.error("Update camp error:", error);
    sendError(res, "Failed to update camp", 500);
  }
};

/**
 * DELETE CAMP (NGO owner only)
 */
export const deleteCamp = async (req, res) => {
  try {
    const { campId } = req.params;
    const camp = await NgoCamp.findById(campId);

    if (!camp) {
      return sendError(res, "Camp not found", 404);
    }

    // Check if user owns this camp
    if (camp.ngoId.toString() !== req.user.userId) {
      return sendError(res, "You are not authorized to delete this camp", 403);
    }

    // Delete associated slots and registrations
    const slots = await CampSlot.findByCampId(campId);
    for (const slot of slots) {
      await CampRegistration.findBySlotId(slot._id);
      await CampSlot.deleteById(slot._id);
    }

    await NgoCamp.deleteById(campId);
    sendSuccess(res, null, "Camp deleted successfully");
  } catch (error) {
    console.error("Delete camp error:", error);
    sendError(res, "Failed to delete camp", 500);
  }
};

// #region SlotManagement

/**
 * CREATE SLOT FOR A CAMP (NGO owner only)
 */
export const createSlot = async (req, res) => {
  try {
    // Validate input
    const validationErrors = validateSlotInput(req.body);
    if (validationErrors.length > 0) {
      return sendValidationError(res, validationErrors);
    }

    // Check if camp exists
    const camp = await NgoCamp.findById(req.body.campId);
    if (!camp) {
      return sendError(res, "Camp not found", 404);
    }

    // Check if user owns this camp
    if (camp.ngoId.toString() !== req.user.userId) {
      return sendError(res, "You are not authorized to add slot to this camp", 403);
    }

    // Create slot with campId as ObjectId
    const slot = await CampSlot.create({
      campId: new ObjectId(req.body.campId),
      slotTime: req.body.slotTime,
      maxDonors: req.body.maxDonors
    });

    sendSuccess(res, slot, "Slot created successfully", 201);
  } catch (error) {
    console.error("Create slot error:", error);
    sendError(res, "Failed to create slot", 500);
  }
};

/**
 * GET ALL SLOTS FOR A CAMP
 */
export const getSlotsByCamp = async (req, res) => {
  try {
    const { campId } = req.params;
    const camp = await NgoCamp.findById(campId);

    if (!camp) {
      return sendError(res, "Camp not found", 404);
    }

    const slots = await CampSlot.findByCampId(campId);
    sendSuccess(res, slots, "Slots retrieved successfully");
  } catch (error) {
    console.error("Get slots by camp error:", error);
    sendError(res, "Failed to retrieve slots", 500);
  }
};

/**
 * UPDATE SLOT (NGO owner only)
 */
export const updateSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const slot = await CampSlot.findById(slotId);

    if (!slot) {
      return sendError(res, "Slot not found", 404);
    }

    // Check camp ownership
    const camp = await NgoCamp.findById(slot.campId.toString());
    if (camp.ngoId.toString() !== req.user.userId) {
      return sendError(res, "You are not authorized to update this slot", 403);
    }

    const updatedSlot = await CampSlot.updateById(slotId, req.body);
    sendSuccess(res, updatedSlot, "Slot updated successfully");
  } catch (error) {
    console.error("Update slot error:", error);
    sendError(res, "Failed to update slot", 500);
  }
};

/**
 * DELETE SLOT (NGO owner only)
 */
export const deleteSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const slot = await CampSlot.findById(slotId);

    if (!slot) {
      return sendError(res, "Slot not found", 404);
    }

    // Check camp ownership
    const camp = await NgoCamp.findById(slot.campId.toString());
    if (camp.ngoId.toString() !== req.user.userId) {
      return sendError(res, "You are not authorized to delete this slot", 403);
    }

    // Delete registrations for this slot
    await CampRegistration.findBySlotId(slotId);
    await CampSlot.deleteById(slotId);

    sendSuccess(res, null, "Slot deleted successfully");
  } catch (error) {
    console.error("Delete slot error:", error);
    sendError(res, "Failed to delete slot", 500);
  }
};

// #region RegistrationManagement

/**
 * REGISTER DONOR TO CAMP SLOT (Donor/User only)
 */
export const registerDonorToSlot = async (req, res) => {
  try {
    // Only donors can register
    if (req.user.role !== "user") {
      return sendError(res, "Only donors can register for camps", 403);
    }

    // Validate input
    const validationErrors = validateRegistrationInput(req.body);
    if (validationErrors.length > 0) {
      return sendValidationError(res, validationErrors);
    }

    const { campId, slotId, bloodGroup } = req.body;
    const donorId = req.user.userId;

    // Check if camp exists
    const camp = await NgoCamp.findById(campId);
    if (!camp) {
      return sendError(res, "Camp not found", 404);
    }

    // Check if slot exists
    const slot = await CampSlot.findById(slotId);
    if (!slot) {
      return sendError(res, "Slot not found", 404);
    }

    // Check if slot belongs to this camp
    if (slot.campId.toString() !== campId) {
      return sendError(res, "Slot does not belong to this camp", 400);
    }

    // Check if slot is full
    if (slot.bookedCount >= slot.maxDonors) {
      return sendError(res, "Slot is already full", 400);
    }

    // Check for duplicate registration
    const alreadyRegistered = await CampRegistration.findByCampAndDonor(campId, donorId);
    if (alreadyRegistered) {
      return sendError(res, "You already registered for this camp", 400);
    }

    // Create registration
    const registration = await CampRegistration.create({
      campId,
      slotId,
      donorId,
      name: req.user.name || "Unknown",
      mobileNumber: req.body.mobileNumber || "",
      address: req.body.address || "",
      bloodGroup,
      donationDate: camp.startDate
    });

    // Increment booked count in slot
    await CampSlot.incrementBooked(slotId);

    sendSuccess(res, registration, "Donor registered successfully", 201);
  } catch (error) {
    console.error("Register donor error:", error);
    sendError(res, "Failed to register donor", 500);
  }
};

/**
 * GET MY REGISTRATIONS (Donor specific)
 */
export const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await CampRegistration.findByDonorId(req.user.userId);
    sendSuccess(res, registrations, "Registrations retrieved successfully");
  } catch (error) {
    console.error("Get my registrations error:", error);
    sendError(res, "Failed to retrieve registrations", 500);
  }
};

/**
 * GET ALL REGISTRATIONS FOR A CAMP (NGO owner only)
 */
export const getCampRegistrations = async (req, res) => {
  try {
    const { campId } = req.params;
    const camp = await NgoCamp.findById(campId);

    if (!camp) {
      return sendError(res, "Camp not found", 404);
    }

    // Check if user owns this camp
    if (camp.ngoId.toString() !== req.user.userId) {
      return sendError(res, "You are not authorized to view this camp's registrations", 403);
    }

    const registrations = await CampRegistration.findByCampId(campId);
    sendSuccess(res, registrations, "Registrations retrieved successfully");
  } catch (error) {
    console.error("Get camp registrations error:", error);
    sendError(res, "Failed to retrieve registrations", 500);
  }
};

/**
 * CANCEL REGISTRATION (Donor can cancel their own)
 */
export const cancelRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const registration = await CampRegistration.findById(registrationId);

    if (!registration) {
      return sendError(res, "Registration not found", 404);
    }

    // Check if donor owns this registration
    if (registration.donorId.toString() !== req.user.userId) {
      return sendError(res, "You are not authorized to cancel this registration", 403);
    }

    // Decrement booked count
    await CampSlot.decrementBooked(registration.slotId.toString());

    // Delete registration
    await CampRegistration.deleteById(registrationId);

    sendSuccess(res, null, "Registration cancelled successfully");
  } catch (error) {
    console.error("Cancel registration error:", error);
    sendError(res, "Failed to cancel registration", 500);
  }
};
