import { ObjectId } from "mongodb";
import { DonorCollection } from "../../models/donor/Donor.js";
import { DonationCollection } from "../../models/donor/Donation.js";
import { getDB } from "../../config/db.js";

// #region DonorController

/**
 * Get CampRegistrations collection
 */
const CampRegistrationCollection = () => {
  return getDB().collection("campRegistrations");
};

/**
 * Register a new donor directly (without camp)
 * Used for general blood donor registration via landing page
 * Stores data in campRegistrations collection
 */
export const registerDonor = async (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      bloodGroup,
      mobileNumber,
      city,
      address,
      email,
      donationDate,
      donationTime,
      nextDonationDate,
      campId,
      slotId,
      campName,
      campLocation,
      slotTime,
    } = req.body;

    // 0️⃣ Validate required fields
    if (!name || !age || !gender || !bloodGroup || !mobileNumber || !city || !donationDate || !donationTime) {
      return res.status(400).json({
        message: "Missing required fields: name, age, gender, bloodGroup, mobileNumber, city, donationDate, donationTime"
      });
    }

    // Validate age
    if (age < 18 || age > 65) {
      return res.status(400).json({
        message: "Age must be between 18 and 65 years"
      });
    }

    // Validate mobile number
    if (!/^\d{10}$/.test(mobileNumber)) {
      return res.status(400).json({
        message: "Mobile number must be 10 digits"
      });
    }

    // 1️⃣ Check if donor already exists by mobile number in donors collection
    let donor = await DonorCollection().findOne({ mobileNumber });

    if (donor) {
      return res.status(400).json({
        message: "Donor already registered with this mobile number"
      });
    }

    // 2️⃣ Check if registration already exists for this mobile number on this date
    const existingRegistration = await CampRegistrationCollection().findOne({
      mobileNumber,
      donationDate: new Date(donationDate)
    });

    if (existingRegistration) {
      return res.status(400).json({
        message: "You already have a registration for this date"
      });
    }

    // 3️⃣ Create new donor in donors collection
    const donorInsert = await DonorCollection().insertOne({
      name,
      age,
      gender,
      bloodGroup,
      mobileNumber,
      city,
      address: address || "",
      email: email || "",
      lastDonationDate: null,
      totalDonations: 0,
      registrationType: "direct",
      createdAt: new Date()
    });

    // 4️⃣ Create camp registration entry in campRegistrations collection
    const campRegistrationInsert = await CampRegistrationCollection().insertOne({
      donorId: donorInsert.insertedId,
      name,
      age,
      gender,
      bloodGroup,
      mobileNumber,
      city,
      address: address || "",
      email: email || "",
      donationDate: new Date(donationDate),
      donationTime,
      nextDonationDate: new Date(nextDonationDate),
      campId: campId ? new ObjectId(campId) : null,
      slotId: slotId ? new ObjectId(slotId) : null,
      campName: campName || "",
      campLocation: campLocation || "",
      slotTime: slotTime || "",
      status: "registered", // registered, completed, cancelled
      registrationType: "direct",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: "✅ Donor registered successfully! Thank you for being a blood donor.",
      donorId: donorInsert.insertedId,
      registrationId: campRegistrationInsert.insertedId,
      nextDonationDate: nextDonationDate
    });
  } catch (error) {
    console.error("Register donor error:", error);
    res.status(500).json({
      message: "Server error",
      ...(process.env.NODE_ENV === "development" && { error: error.message })
    });
  }
};

/**
 * Register a donor for a specific camp
 */
export const registerDonorForCamp = async (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      bloodGroup,
      mobileNumber,
      city,
      campId,
      campName,
      slotId,
      slotTime
    } = req.body;

    // 0️⃣ Validate required fields
    if (!name || !age || !gender || !bloodGroup || !mobileNumber || !city) {
      return res.status(400).json({
        message: "Missing required fields: name, age, gender, bloodGroup, mobileNumber, city"
      });
    }

    if (!campId || !campName || !slotId || !slotTime) {
      return res.status(400).json({
        message: "Missing required camp fields: campId, campName, slotId, slotTime"
      });
    }

    // Validate campId and slotId are valid MongoDB ObjectIds
    if (!ObjectId.isValid(campId)) {
      return res.status(400).json({
        message: "Invalid campId. Must be a valid MongoDB ObjectId (24 hex characters)"
      });
    }

    if (!ObjectId.isValid(slotId)) {
      return res.status(400).json({
        message: "Invalid slotId. Must be a valid MongoDB ObjectId (24 hex characters)"
      });
    }

    // 1️⃣ Check donor exists by mobile number
    let donor = await DonorCollection().findOne({ mobileNumber });

    // 2️⃣ 90-day donation rule
    if (donor?.lastDonationDate) {
      const daysPassed =
        (new Date() - new Date(donor.lastDonationDate)) /
        (1000 * 60 * 60 * 24);

      if (daysPassed < 90) {
        return res.status(400).json({
          message: `Donor not eligible. Wait ${Math.ceil(
            90 - daysPassed
          )} more days`
        });
      }
    }

    // 3️⃣ If donor does not exist → create donor
    if (!donor) {
      const donorInsert = await DonorCollection().insertOne({
        name,
        age,
        gender,
        bloodGroup,
        mobileNumber,
        city,
        lastDonationDate: null,
        totalDonations: 0,
        createdAt: new Date()
      });

      donor = { _id: donorInsert.insertedId };
    }

    // 4️⃣ Create donation entry (with donor snapshot)
    await DonationCollection().insertOne({
      donorId: donor._id,

      donorSnapshot: {
        name,
        mobileNumber,
        bloodGroup,
        city
      },

      campId: new ObjectId(campId),
      campName,

      slotId: new ObjectId(slotId),
      slotTime,

      status: "registered",
      donationDate: null,
      registeredAt: new Date()
    });

    res.status(201).json({
      message: "✅ Donor registered successfully for camp"
    });
  } catch (error) {
    console.error("Register donor error:", error);
    res.status(500).json({
      message: "Server error",
      ...(process.env.NODE_ENV === "development" && { error: error.message })
    });
  }
};

/**
 * Record a completed donation (mark donation as donated and update donor stats)
 * Body: { donationId: string, donationDate?: string }
 */
export const recordDonation = async (req, res) => {
  try {
    const { donationId, donationDate } = req.body;

    if (!donationId) {
      return res.status(400).json({ message: "donationId is required" });
    }

    const donationObjectId = new ObjectId(donationId);

    // Find existing donation
    const existing = await DonationCollection().findOne({ _id: donationObjectId });
    if (!existing) return res.status(404).json({ message: "Donation not found" });

    if (existing.status === "donated") {
      return res.status(400).json({ message: "Donation already recorded as donated" });
    }

    const finalizedDate = donationDate ? new Date(donationDate) : new Date();

    // Update the donation document
    const updatedDonationResult = await DonationCollection().findOneAndUpdate(
      { _id: donationObjectId },
      {
        $set: {
          status: "donated",
          donationDate: finalizedDate,
          updatedAt: new Date()
        }
      },
      { returnDocument: "after" }
    );

    const updatedDonation = updatedDonationResult.value;

    // Update donor stats: prefer donorId, fallback to donorSnapshot.mobileNumber
    let donorFilter = null;
    if (updatedDonation.donorId) donorFilter = { _id: new ObjectId(updatedDonation.donorId) };
    else if (updatedDonation.donorSnapshot?.mobileNumber)
      donorFilter = { mobileNumber: updatedDonation.donorSnapshot.mobileNumber };

    let updatedDonor = null;
    if (donorFilter) {
      // If donor exists, update lastDonationDate and increment totalDonations
      const updateOps = {
        $set: { lastDonationDate: finalizedDate },
        $inc: { totalDonations: 1 }
      };

      // If donor document doesn't exist and we only have donorSnapshot, create it
      const options = { returnDocument: "after", upsert: true };

      // If upserting, ensure createdAt and basic fields are set using $setOnInsert
      if (!donorFilter._id && updatedDonation.donorSnapshot) {
        updateOps.$setOnInsert = {
          name: updatedDonation.donorSnapshot.name || "",
          mobileNumber: updatedDonation.donorSnapshot.mobileNumber || "",
          bloodGroup: updatedDonation.donorSnapshot.bloodGroup || "",
          city: updatedDonation.donorSnapshot.city || "",
          age: null,
          gender: null,
          createdAt: new Date()
        };
      }

      const donorResult = await DonorCollection().findOneAndUpdate(donorFilter, updateOps, options);
      updatedDonor = donorResult.value;
    }

    return res.status(200).json({
      message: "✅ Donation recorded and donor updated",
      donation: updatedDonation,
      donor: updatedDonor
    });
  } catch (error) {
    console.error("Record donation error:", error);
    return res.status(500).json({
      message: "Server error",
      ...(process.env.NODE_ENV === "development" && { error: error.message })
    });
  }
};
