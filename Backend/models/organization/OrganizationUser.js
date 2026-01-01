import { getDB } from "../../config/db.js";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { generateUserCode } from "../../utils/codeGenerator.js";

// #region OrganizationUserModel

/**
 * OrganizationUser Model - Handles all database operations for organization users
 */
class OrganizationUser {
  constructor() {
    this.collectionName = "organizationUsers";
  }

  /**
   * Get the organizationUsers collection
   */
  getCollection() {
    const db = getDB();
    return db.collection(this.collectionName);
  }

  /**
   * Create a new user for an organization
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user object
   */
  async create(userData) {
    try {
      const db = getDB();
      const collection = this.getCollection();

      // Check if organization exists
      const org = await db.collection("organizations").findOne({
        organizationCode: userData.organizationCode
      });

      if (!org) {
        throw new Error("Organization not found");
      }

      console.log(`[DB_ORG_FOUND] ${org.name} (${org.type})`);

      // Check if email already exists in this organization
      const existingUser = await collection.findOne({
        organizationCode: userData.organizationCode,
        email: userData.email.toLowerCase()
      });

      if (existingUser) {
        throw new Error("Email already exists in this organization");
      }

      console.log(`[DB_EMAIL_UNIQUE] ${userData.email}`);

      // Generate user code
      const userCode = await generateUserCode(userData.organizationCode, userData.role);
      console.log(`[DB_USERCODE_GENERATED] ${userCode}`);

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      console.log(`[DB_PASSWORD_HASHED]`);

      // Create user document
      const newUser = {
        _id: new ObjectId(),
        organizationCode: userData.organizationCode,
        organizationName: org.name,
        organizationType: org.type,
        userCode: userCode,
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        role: userData.role,
        status: userData.status || "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Insert user
      const result = await collection.insertOne(newUser);
      console.log(`[DB_USER_CREATED] ${userCode} - ${userData.name} (${userData.role})`);

      return {
        _id: result.insertedId,
        userCode: userCode,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: userData.status || "ACTIVE",
        organizationCode: userData.organizationCode
      };

    } catch (error) {
      console.error(`[DB_ERROR] Create user error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all users for an organization with pagination
   * @param {string} organizationCode - Organization code
   * @param {Object} options - {page, limit, role, status}
   * @returns {Promise<Object>} {users, pagination}
   */
  async findByOrganization(organizationCode, options = {}) {
    try {
      const collection = this.getCollection();
      const db = getDB();

      // Check if organization exists
      const org = await db.collection("organizations").findOne({
        organizationCode: organizationCode
      });

      if (!org) {
        throw new Error("Organization not found");
      }

      const { page = 1, limit = 10, role, status } = options;
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      // Build filter
      let filter = { organizationCode: organizationCode };
      if (role) filter.role = role;
      if (status) filter.status = status;

      // Get users
      const users = await collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray();

      // Count total
      const total = await collection.countDocuments(filter);
      const totalPages = Math.ceil(total / limitNum);

      // Format response (exclude passwords)
      const formattedUsers = users.map(user => this.formatUserResponse(user));

      console.log(`[DB_USERS_FETCHED] ${formattedUsers.length} users`);

      return {
        users: formattedUsers,
        pagination: {
          currentPage: pageNum,
          totalPages: totalPages,
          totalItems: total,
          itemsPerPage: limitNum
        }
      };

    } catch (error) {
      console.error(`[DB_ERROR] Get users error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user by user code
   * @param {string} organizationCode - Organization code
   * @param {string} userCode - User code
   * @returns {Promise<Object>} User object
   */
  async findByUserCode(organizationCode, userCode) {
    try {
      const collection = this.getCollection();

      const user = await collection.findOne({
        organizationCode: organizationCode,
        userCode: userCode
      });

      if (!user) {
        throw new Error("User not found");
      }

      console.log(`[DB_USER_FOUND] ${userCode}`);

      return this.formatUserResponse(user);

    } catch (error) {
      console.error(`[DB_ERROR] Get user error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user by email for login (for authentication)
   * @param {string} organizationCode - Organization code
   * @param {string} email - User email
   * @returns {Promise<Object>} User object (with password for verification)
   */
  async findByUserEmail(organizationCode, email) {
    try {
      const collection = this.getCollection();

      const user = await collection.findOne({
        organizationCode: organizationCode,
        email: email.toLowerCase()
      });

      if (!user) {
        throw new Error("User not found");
      }

      console.log(`[DB_USER_FOUND_BY_EMAIL] ${user.userCode}`);

      // Return full user object including password for auth verification
      return user;

    } catch (error) {
      console.error(`[DB_ERROR] Get user by email error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user details (except password)
   * @param {string} organizationCode - Organization code
   * @param {string} userCode - User code
   * @param {Object} updateData - Data to update {name, role, status}
   * @returns {Promise<Object>} Updated user object
   */
  async update(organizationCode, userCode, updateData) {
    try {
      const collection = this.getCollection();

      // Check if user exists
      const user = await collection.findOne({
        organizationCode: organizationCode,
        userCode: userCode
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Build update data
      const update = {};
      if (updateData.name) update.name = updateData.name;
      if (updateData.role) update.role = updateData.role;
      if (updateData.status) update.status = updateData.status;
      update.updatedAt = new Date();

      // Update user
      const result = await collection.findOneAndUpdate(
        { organizationCode: organizationCode, userCode: userCode },
        { $set: update },
        { returnDocument: "after" }
      );

      const updatedUser = result?.value || result;

      if (!updatedUser) {
        throw new Error("Failed to update user");
      }

      console.log(`[DB_USER_UPDATED] ${userCode}`);

      return this.formatUserResponse(updatedUser);

    } catch (error) {
      console.error(`[DB_ERROR] Update user error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete user
   * @param {string} organizationCode - Organization code
   * @param {string} userCode - User code
   * @returns {Promise<boolean>} Success status
   */
  async delete(organizationCode, userCode) {
    try {
      const collection = this.getCollection();

      // Check if user exists
      const user = await collection.findOne({
        organizationCode: organizationCode,
        userCode: userCode
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Delete user
      const result = await collection.deleteOne({
        organizationCode: organizationCode,
        userCode: userCode
      });

      if (result.deletedCount === 0) {
        throw new Error("Failed to delete user");
      }

      console.log(`[DB_USER_DELETED] ${userCode}`);

      return true;

    } catch (error) {
      console.error(`[DB_ERROR] Delete user error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {string} organizationCode - Organization code
   * @param {string} userCode - User code
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async changePassword(organizationCode, userCode, currentPassword, newPassword) {
    try {
      const collection = this.getCollection();

      // Get user
      const user = await collection.findOne({
        organizationCode: organizationCode,
        userCode: userCode
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        console.warn(`[DB_INVALID_PASSWORD] ${userCode}`);
        throw new Error("Current password is incorrect");
      }

      console.log(`[DB_PASSWORD_VERIFIED]`);

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const result = await collection.findOneAndUpdate(
        { organizationCode: organizationCode, userCode: userCode },
        { $set: { password: hashedNewPassword, updatedAt: new Date() } },
        { returnDocument: "after" }
      );

      const updatedUser = result?.value || result;

      if (!updatedUser) {
        throw new Error("Failed to change password");
      }

      console.log(`[DB_PASSWORD_CHANGED] ${userCode}`);

      return true;

    } catch (error) {
      console.error(`[DB_ERROR] Change password error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get users by role
   * @param {string} organizationCode - Organization code
   * @param {string} role - Role name
   * @param {Object} options - {page, limit}
   * @returns {Promise<Object>} {users, pagination}
   */
  async findByRole(organizationCode, role, options = {}) {
    try {
      const collection = this.getCollection();
      const db = getDB();

      // Check if organization exists
      const org = await db.collection("organizations").findOne({
        organizationCode: organizationCode
      });

      if (!org) {
        throw new Error("Organization not found");
      }

      const { page = 1, limit = 10 } = options;
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      // Get users with specific role
      const users = await collection
        .find({
          organizationCode: organizationCode,
          role: role
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray();

      // Count total
      const total = await collection.countDocuments({
        organizationCode: organizationCode,
        role: role
      });

      // Format response
      const formattedUsers = users.map(user => this.formatUserResponse(user));

      console.log(`[DB_ROLE_USERS_FETCHED] ${formattedUsers.length} users with role ${role}`);

      return {
        users: formattedUsers,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum
        }
      };

    } catch (error) {
      console.error(`[DB_ERROR] Get users by role error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get organization users statistics
   * @param {string} organizationCode - Organization code
   * @returns {Promise<Object>} Statistics data
   */
  async getStats(organizationCode) {
    try {
      const collection = this.getCollection();
      const db = getDB();

      // Check if organization exists
      const org = await db.collection("organizations").findOne({
        organizationCode: organizationCode
      });

      if (!org) {
        throw new Error("Organization not found");
      }

      // Get stats
      const stats = await collection
        .aggregate([
          { $match: { organizationCode: organizationCode } },
          {
            $group: {
              _id: null,
              totalUsers: { $sum: 1 },
              activeUsers: {
                $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] }
              },
              inactiveUsers: {
                $sum: { $cond: [{ $eq: ["$status", "INACTIVE"] }, 1, 0] }
              }
            }
          }
        ])
        .toArray();

      // Get users by role
      const usersByRole = await collection
        .aggregate([
          { $match: { organizationCode: organizationCode } },
          {
            $group: {
              _id: "$role",
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } }
        ])
        .toArray();

      const statsData = stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0
      };

      const roleBreakdown = {};
      usersByRole.forEach(item => {
        roleBreakdown[item._id] = item.count;
      });

      console.log(`[DB_STATS_RETRIEVED]`);

      return {
        organization: org.name,
        organizationType: org.type,
        ...statsData,
        usersByRole: roleBreakdown
      };

    } catch (error) {
      console.error(`[DB_ERROR] Get stats error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Format user response (exclude password)
   * @param {Object} user - User object
   * @returns {Object} Formatted user object
   */
  formatUserResponse(user) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export default new OrganizationUser();
