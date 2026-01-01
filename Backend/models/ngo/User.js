import { getDB } from "../../config/db.js";
import { ObjectId } from "mongodb";

// #region UserModel

/**
 * User Model for MongoDB
 */
class User {
  constructor() {
    this.collectionName = "users";
  }

  getCollection() {
    const db = getDB();
    return db.collection(this.collectionName);
  }

  async create(userData) {
    const collection = this.getCollection();
    const newUser = {
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: userData.password,
      role: userData.role,
      organizationName: userData.organizationName || null,
      registrationNumber: userData.registrationNumber || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await collection.insertOne(newUser);
    return { _id: result.insertedId, ...newUser };
  }

  async findByEmail(email) {
    const collection = this.getCollection();
    return await collection.findOne({ email: email.toLowerCase() });
  }

  async findById(id) {
    const collection = this.getCollection();
    try {
      return await collection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      return null;
    }
  }

  async updateById(id, updateData) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      return false;
    }
  }

  async deleteById(id) {
    const collection = this.getCollection();
    try {
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      return false;
    }
  }

  async findAll(filter = {}, skip = 0, limit = 50) {
    const collection = this.getCollection();
    return await collection.find(filter).skip(skip).limit(limit).toArray();
  }

  async findByRole(role) {
    const collection = this.getCollection();
    return await collection.find({ role }).toArray();
  }

  // #region ApprovalQueries

  /**
   * Find organizations by type and status with pagination
   */
  async findByTypeAndStatus(type, status, skip = 0, limit = 10) {
    const collection = this.getCollection();
    return await collection
      .find({
        type: type.toLowerCase(),
        status: status.toUpperCase()
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  /**
   * Count organizations by type and status
   */
  async countByTypeAndStatus(type, status) {
    const collection = this.getCollection();
    return await collection.countDocuments({
      type: type.toLowerCase(),
      status: status.toUpperCase()
    });
  }

  /**
   * Find all pending organizations (all types)
   */
  async findAllPending(skip = 0, limit = 50) {
    const collection = this.getCollection();
    return await collection
      .find({ status: "PENDING" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  /**
   * Count all pending organizations
   */
  async countAllPending() {
    const collection = this.getCollection();
    return await collection.countDocuments({ status: "PENDING" });
  }

  /**
   * Find organizations by status (any type)
   */
  async findByStatus(status, skip = 0, limit = 50) {
    const collection = this.getCollection();
    return await collection
      .find({ status: status.toUpperCase() })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  /**
   * Get approval statistics
   */
  async getApprovalStats() {
    const collection = this.getCollection();
    
    return {
      total: await collection.countDocuments(),
      pending: await collection.countDocuments({ status: "PENDING" }),
      approved: await collection.countDocuments({ status: "APPROVED" }),
      rejected: await collection.countDocuments({ status: "REJECTED" }),
      suspended: await collection.countDocuments({ status: "SUSPENDED" }),
      byType: {
        hospital: {
          pending: await collection.countDocuments({ type: "hospital", status: "PENDING" }),
          approved: await collection.countDocuments({ type: "hospital", status: "APPROVED" })
        },
        bloodbank: {
          pending: await collection.countDocuments({ type: "bloodbank", status: "PENDING" }),
          approved: await collection.countDocuments({ type: "bloodbank", status: "APPROVED" })
        },
        ngo: {
          pending: await collection.countDocuments({ type: "ngo", status: "PENDING" }),
          approved: await collection.countDocuments({ type: "ngo", status: "APPROVED" })
        }
      }
    };
  }
}

export default new User();
