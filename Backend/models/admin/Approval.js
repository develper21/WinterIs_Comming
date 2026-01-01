import { getDB } from "../../config/db.js";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import User from "../ngo/User.js";
import { generateUserCode } from "../../utils/codeGenerator.js";

// #region ApprovalModel

export class Approval {
  /**
   * Get pending organizations by type with pagination
   * @param {string} type - hospital, bloodbank, ngo
   * @param {Object} pagination - {page, limit}
   * @returns {Promise<Object>} {organizations, pagination}
   */
  static async getPendingByType(type, pagination = {}) {
    const db = getDB();
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const filter = {
      type: type.toLowerCase(),
      status: "PENDING"
    };

    const organizations = await db
      .collection("organizations")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection("organizations").countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    return {
      organizations,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  /**
   * Get all pending organizations with optional filters
   * @param {Object} filters - {type, status}
   * @param {Object} pagination - {page, limit}
   * @returns {Promise<Object>} {organizations, pagination}
   */
  static async getPendingAll(filters = {}, pagination = {}) {
    const db = getDB();
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    let filter = { status: "PENDING" };

    if (filters.type && ["hospital", "bloodbank", "ngo"].includes(filters.type.toLowerCase())) {
      filter.type = filters.type.toLowerCase();
    }

    const organizations = await db
      .collection("organizations")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection("organizations").countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    return {
      organizations,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  /**
   * Get organization by code
   * @param {string} organizationCode
   * @returns {Promise<Object|null>}
   */
  static async getByCode(organizationCode) {
    const db = getDB();
    return await db.collection("organizations").findOne({
      organizationCode: organizationCode
    });
  }

  /**
   * Approve organization
   * 1. Remove adminPassword from organization document
   * 2. Create new organization admin user in organizationUsers collection with password "admin123"
   * 3. Set organization status to APPROVED
   * @param {string} organizationCode
   * @param {Object} adminData - {name, email, role}
   * @param {string} remarks
   * @returns {Promise<Object>} Updated organization
   */
  static async approve(organizationCode, adminData, remarks) {
    const db = getDB();

    try {
      // Get the organization to access all details
      const org = await db.collection("organizations").findOne({
        organizationCode: organizationCode
      });

      if (!org) {
        throw new Error("Organization not found");
      }

      console.log(`[APPROVAL] Processing approval for: ${organizationCode}`);

      // Hash default password for organization admin
      const defaultPassword = "admin123";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      console.log(`[APPROVAL] Password hashed for admin user`);

      // Generate user code for organization admin
      const userCode = await generateUserCode(organizationCode, "ADMIN");
      console.log(`[APPROVAL] Generated userCode: ${userCode}`);

      // Create organization admin user in organizationUsers collection
      const organizationAdminUser = {
        _id: new ObjectId(),
        organizationCode: organizationCode,
        organizationName: org.name,
        organizationType: org.type,
        userCode: userCode,
        name: adminData.name,
        email: adminData.email,
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const userResult = await db.collection("organizationUsers").insertOne(organizationAdminUser);
      console.log(`[APPROVAL] Organization admin user created in organizationUsers collection`);
      console.log(`[APPROVAL] Admin user email: ${adminData.email}, userCode: ${userCode}`);

      // Update organization document:
      // 1. Set status to APPROVED
      // 2. Add organizationAdmin object
      // 3. REMOVE adminPassword field
      const updateData = {
        status: "APPROVED",
        organizationAdmin: {
          name: adminData.name,
          email: adminData.email,
          role: "ORGANIZATION_ADMIN",
          userCode: userCode
        },
        approvedAt: new Date(),
        approvalRemarks: remarks,
        updatedAt: new Date()
      };

      const result = await db.collection("organizations").findOneAndUpdate(
        { organizationCode: organizationCode },
        {
          $set: updateData,
          $unset: { adminPassword: "" }  // Remove adminPassword field
        },
        { returnDocument: "after" }
      );

      console.log(`[APPROVAL] Organization ${organizationCode} status updated to APPROVED`);
      console.log(`[APPROVAL] adminPassword field removed from organization`);

      // Handle different result formats from MongoDB driver
      const updatedOrg = result?.value || result;
      
      if (!updatedOrg) {
        console.warn(`[APPROVAL] findOneAndUpdate returned empty result, fetching from DB`);
        const org = await db.collection("organizations").findOne({ organizationCode: organizationCode });
        return org;
      }

      return updatedOrg;
    } catch (error) {
      console.error("❌ Error in Approval.approve:", error.message);
      console.error("Stack:", error.stack);
      throw error;
    }
  }

  /**
   * Reject organization
   * @param {string} organizationCode
   * @param {string} reason
   * @returns {Promise<Object>} Updated organization
   */
  static async reject(organizationCode, reason) {
    const db = getDB();

    const updateData = {
      status: "REJECTED",
      rejectionReason: reason,
      updatedAt: new Date()
    };

    const result = await db.collection("organizations").findOneAndUpdate(
      { organizationCode: organizationCode },
      { $set: updateData },
      { returnDocument: "after" }
    );

    return result.value;
  }

  /**
   * Suspend organization
   * @param {string} organizationCode
   * @param {string} reason
   * @returns {Promise<Object>} Updated organization
   */
  static async suspend(organizationCode, reason) {
    const db = getDB();

    const updateData = {
      status: "SUSPENDED",
      suspensionReason: reason,
      updatedAt: new Date()
    };

    const result = await db.collection("organizations").findOneAndUpdate(
      { organizationCode: organizationCode },
      { $set: updateData },
      { returnDocument: "after" }
    );

    return result.value;
  }

  /**
   * Get approval statistics
   * @returns {Promise<Object>} Statistics by type
   */
  static async getStats() {
    const db = getDB();

    const stats = await db
      .collection("organizations")
      .aggregate([
        {
          $group: {
            _id: "$type",
            total: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] }
            },
            approved: {
              $sum: { $cond: [{ $eq: ["$status", "APPROVED"] }, 1, 0] }
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$status", "REJECTED"] }, 1, 0] }
            },
            suspended: {
              $sum: { $cond: [{ $eq: ["$status", "SUSPENDED"] }, 1, 0] }
            }
          }
        }
      ])
      .toArray();

    return stats;
  }

  /**
   * Count organizations by status
   * @param {string} status
   * @returns {Promise<number>}
   */
  static async countByStatus(status) {
    const db = getDB();
    return await db.collection("organizations").countDocuments({
      status: status
    });
  }

  /**
   * Count organizations by type and status
   * @param {string} type
   * @param {string} status
   * @returns {Promise<number>}
   */
  static async countByTypeAndStatus(type, status) {
    const db = getDB();
    return await db.collection("organizations").countDocuments({
      type: type.toLowerCase(),
      status: status
    });
  }
}
