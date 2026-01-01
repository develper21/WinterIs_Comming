import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";

// #region CampSlotModel

/**
 * CampSlot Model - MongoDB Native
 * Handles all camp slot database operations
 */
class CampSlot {
  constructor(data) {
    this._id = data._id || new ObjectId();
    this.campId = data.campId;
    this.slotTime = data.slotTime; // e.g., "09:00 - 10:00"
    this.maxDonors = data.maxDonors;
    this.bookedCount = data.bookedCount || 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // CREATE new slot
  static async create(slotData) {
    const db = getDB();
    const slot = new CampSlot(slotData);
    const result = await db.collection("campSlots").insertOne(slot);
    slot._id = result.insertedId;
    return slot;
  }

  // FIND slot by ID
  static async findById(id) {
    const db = getDB();
    const slot = await db.collection("campSlots").findOne({
      _id: new ObjectId(id)
    });
    return slot ? new CampSlot(slot) : null;
  }

  // FIND all slots by Camp ID
  static async findByCampId(campId) {
    const db = getDB();
    const slots = await db
      .collection("campSlots")
      .find({ campId: new ObjectId(campId) })
      .sort({ createdAt: 1 })
      .toArray();
    return slots.map(slot => new CampSlot(slot));
  }

  // FIND all slots
  static async findAll() {
    const db = getDB();
    const slots = await db
      .collection("campSlots")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return slots.map(slot => new CampSlot(slot));
  }

  // UPDATE slot by ID
  static async updateById(id, updateData) {
    const db = getDB();
    updateData.updatedAt = new Date();
    const result = await db.collection("campSlots").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );
    return result.value ? new CampSlot(result.value) : null;
  }

  // INCREMENT booked count
  static async incrementBooked(id) {
    const db = getDB();
    const result = await db.collection("campSlots").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $inc: { bookedCount: 1 },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: "after" }
    );
    return result.value ? new CampSlot(result.value) : null;
  }

  // DECREMENT booked count
  static async decrementBooked(id) {
    const db = getDB();
    const result = await db.collection("campSlots").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $inc: { bookedCount: -1 },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: "after" }
    );
    return result.value ? new CampSlot(result.value) : null;
  }

  // DELETE slot by ID
  static async deleteById(id) {
    const db = getDB();
    const result = await db.collection("campSlots").deleteOne({
      _id: new ObjectId(id)
    });
    return result.deletedCount > 0;
  }
}

export default CampSlot;
