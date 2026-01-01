import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";

// #region AdminModel

/**
 * Admin Model - MongoDB Native
 * Handles admin-only database operations
 * Separate from User collection for security
 */
class Admin {
  constructor(data) {
    this._id = data._id || new ObjectId();
    this.adminCode = data.adminCode;
    this.name = data.name;
    this.email = data.email.toLowerCase();
    this.password = data.password;
    this.role = "ADMIN";
    this.isActive = data.isActive !== false;
    this.permissions = data.permissions || [];
    this.loginHistory = data.loginHistory || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // FIND admin by email
  static async findByEmail(email) {
    const db = getDB();
    return await db.collection("admins").findOne({
      email: email.toLowerCase()
    });
  }

  // FIND admin by adminCode
  static async findByCode(adminCode) {
    const db = getDB();
    return await db.collection("admins").findOne({
      adminCode: adminCode
    });
  }

  // FIND admin by ID
  static async findById(id) {
    const db = getDB();
    try {
      return await db.collection("admins").findOne({
        _id: new ObjectId(id)
      });
    } catch (error) {
      return null;
    }
  }

  // CREATE new admin
  static async create(adminData) {
    const db = getDB();
    const admin = new Admin(adminData);
    const result = await db.collection("admins").insertOne(admin);
    admin._id = result.insertedId;
    return admin;
  }

  // UPDATE admin
  static async updateById(id, updateData) {
    const db = getDB();
    updateData.updatedAt = new Date();
    const result = await db.collection("admins").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );
    return result.value ? new Admin(result.value) : null;
  }

  // UPDATE login history
  static async updateLoginHistory(id, ipAddress, success) {
    try {
      const db = getDB();
      const admin = await this.findById(id);

      if (!admin) {
        return;
      }

      const loginHistory = admin.loginHistory || [];
      loginHistory.push({
        timestamp: new Date(),
        ip: ipAddress,
        success: success
      });

      // Keep only last 20 entries
      if (loginHistory.length > 20) {
        loginHistory.shift();
      }

      await db.collection("admins").updateOne(
        { _id: new ObjectId(id) },
        { $set: { loginHistory } }
      );
    } catch (error) {
      console.error("Error updating login history:", error);
    }
  }

  // DELETE admin
  static async deleteById(id) {
    const db = getDB();
    const result = await db.collection("admins").deleteOne({
      _id: new ObjectId(id)
    });
    return result.deletedCount > 0;
  }

  // FIND all admins
  static async findAll() {
    const db = getDB();
    return await db.collection("admins").find({}).toArray();
  }
}

export default Admin;
