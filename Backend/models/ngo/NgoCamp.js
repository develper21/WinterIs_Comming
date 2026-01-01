import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";

// #region NgoCampModel

/**
 * NgoCamp Model - MongoDB Native
 * Handles all blood donation camp database operations
 */
class NgoCamp {
  constructor(data) {
    this._id = data._id || new ObjectId();
    this.ngoId = data.ngoId;
    this.campName = data.campName;
    this.description = data.description || "";
    this.location = data.location;
    this.city = data.city || "";
    this.state = data.state || "";
    this.pincode = data.pincode || "";
    this.startDate = new Date(data.startDate);
    this.endDate = new Date(data.endDate);
    this.contactPersonName = data.contactPersonName || "";
    this.contactMobile = data.contactMobile || "";
    this.totalSlots = data.totalSlots || 0;
    this.expectedDonors = data.expectedDonors || 0;
    this.status = data.status || "pending"; // pending, approved, active, completed, cancelled
    this.isActive = data.isActive !== false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // CREATE new camp
  static async create(campData) {
    const db = getDB();
    const camp = new NgoCamp(campData);
    const result = await db.collection("ngoCamps").insertOne(camp);
    camp._id = result.insertedId;
    return camp;
  }

  // FIND camp by ID
  static async findById(id) {
    const db = getDB();
    const camp = await db.collection("ngoCamps").findOne({
      _id: new ObjectId(id)
    });
    return camp ? new NgoCamp(camp) : null;
  }

  // FIND all camps by NGO ID
  static async findByNgoId(ngoId) {
    const db = getDB();
    console.log("[NgoCamp.findByNgoId] Searching for camps with ngoId:", ngoId, "Type:", typeof ngoId);
    
    const camps = await db
      .collection("ngoCamps")
      .find({ ngoId: new ObjectId(ngoId) })
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log("[NgoCamp.findByNgoId] Found camps:", camps.length);
    
    return camps.map(camp => new NgoCamp(camp));
  }

  // FIND all camps (for admin)
  static async findAll() {
    const db = getDB();
    const camps = await db
      .collection("ngoCamps")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return camps.map(camp => new NgoCamp(camp));
  }

  // UPDATE camp by ID
  static async updateById(id, updateData) {
    const db = getDB();
    updateData.updatedAt = new Date();
    const result = await db.collection("ngoCamps").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );
    return result.value ? new NgoCamp(result.value) : null;
  }

  // DELETE camp by ID
  static async deleteById(id) {
    const db = getDB();
    const result = await db.collection("ngoCamps").deleteOne({
      _id: new ObjectId(id)
    });
    return result.deletedCount > 0;
  }

  // FIND camps by status
  static async findByStatus(status) {
    const db = getDB();
    const camps = await db
      .collection("ngoCamps")
      .find({ status })
      .sort({ createdAt: -1 })
      .toArray();
    return camps.map(camp => new NgoCamp(camp));
  }
}

export default NgoCamp;
