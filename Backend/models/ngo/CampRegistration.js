import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";

// #region CampRegistrationModel

/**
 * CampRegistration Model - MongoDB Native
 * Handles all donor camp registration database operations
 */
class CampRegistration {
  constructor(data) {
    this._id = data._id || new ObjectId();
    this.campId = data.campId;
    this.slotId = data.slotId;
    this.donorId = data.donorId;
    this.name = data.name;
    this.mobileNumber = data.mobileNumber;
    this.address = data.address;
    this.bloodGroup = data.bloodGroup;
    this.donationDate = new Date(data.donationDate);
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // CREATE new registration
  static async create(registrationData) {
    const db = getDB();
    const registration = new CampRegistration(registrationData);
    const result = await db
      .collection("campRegistrations")
      .insertOne(registration);
    registration._id = result.insertedId;
    return registration;
  }

  // FIND registration by ID
  static async findById(id) {
    const db = getDB();
    const registration = await db.collection("campRegistrations").findOne({
      _id: new ObjectId(id)
    });
    return registration ? new CampRegistration(registration) : null;
  }

  // FIND all registrations by Camp ID
  static async findByCampId(campId) {
    const db = getDB();
    const registrations = await db
      .collection("campRegistrations")
      .find({ campId: new ObjectId(campId) })
      .sort({ createdAt: -1 })
      .toArray();
    return registrations.map(reg => new CampRegistration(reg));
  }

  // FIND all registrations by Donor ID
  static async findByDonorId(donorId) {
    const db = getDB();
    const registrations = await db
      .collection("campRegistrations")
      .find({ donorId: new ObjectId(donorId) })
      .sort({ createdAt: -1 })
      .toArray();
    return registrations.map(reg => new CampRegistration(reg));
  }

  // FIND registration by Camp + Donor (check duplicate)
  static async findByCampAndDonor(campId, donorId) {
    const db = getDB();
    const registration = await db.collection("campRegistrations").findOne({
      campId: new ObjectId(campId),
      donorId: new ObjectId(donorId)
    });
    return registration ? new CampRegistration(registration) : null;
  }

  // FIND all registrations by Slot ID
  static async findBySlotId(slotId) {
    const db = getDB();
    const registrations = await db
      .collection("campRegistrations")
      .find({ slotId: new ObjectId(slotId) })
      .sort({ createdAt: -1 })
      .toArray();
    return registrations.map(reg => new CampRegistration(reg));
  }

  // FIND all registrations
  static async findAll() {
    const db = getDB();
    const registrations = await db
      .collection("campRegistrations")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return registrations.map(reg => new CampRegistration(reg));
  }

  // UPDATE registration by ID
  static async updateById(id, updateData) {
    const db = getDB();
    updateData.updatedAt = new Date();
    const result = await db
      .collection("campRegistrations")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: "after" }
      );
    return result.value ? new CampRegistration(result.value) : null;
  }

  // DELETE registration by ID
  static async deleteById(id) {
    const db = getDB();
    const result = await db.collection("campRegistrations").deleteOne({
      _id: new ObjectId(id)
    });
    return result.deletedCount > 0;
  }

  // COUNT registrations for a camp
  static async countByCampId(campId) {
    const db = getDB();
    return await db.collection("campRegistrations").countDocuments({
      campId: new ObjectId(campId)
    });
  }
}

export default CampRegistration;
