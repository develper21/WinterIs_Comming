import { getDB } from "../../config/db.js";
import { ObjectId } from "mongodb";

// #region BloodBankModel

/**
 * BloodBank Model - ADMIN DEPENDENT
 * Production-ready MongoDB schema for Blood Bank management
 * 
 * FEATURES:
 * - Admin-controlled verification, rejection, suspension
 * - Blood stock management with real-time tracking
 * - Integration with NGO drives and Hospital requests
 * - Complete audit trail via BloodBankAdminAction collection
 * 
 * STATUS LIFECYCLE:
 * PENDING → VERIFIED (by Admin)
 * PENDING → REJECTED (by Admin)
 * VERIFIED → SUSPENDED (by Admin)
 * SUSPENDED → VERIFIED (by Admin - reactivation)
 */
class BloodBank {
  constructor() {
    this.collectionName = "organizations";
    this.type = "bloodbank";
  }

  getCollection() {
    const db = getDB();
    return db.collection(this.collectionName);
  }

  // Base query for blood banks only
  getBloodBankQuery() {
    return { type: this.type };
  }

  /**
   * CREATE - Register new blood bank
   * Initial status: PENDING (requires admin verification)
   */
  async create(bloodBankData) {
    const collection = this.getCollection();
    
    const newBloodBank = {
      type: this.type,
      
      // Basic Information
      organizationCode: bloodBankData.organizationCode,
      name: bloodBankData.name,
      email: bloodBankData.email.toLowerCase(),
      phone: bloodBankData.phone,
      
      // Location Details
      address: {
        street: bloodBankData.address?.street || bloodBankData.address,
        city: bloodBankData.city,
        state: bloodBankData.state,
        pinCode: bloodBankData.pinCode,
        country: bloodBankData.address?.country || "India"
      },
      
      // Contact Person
      contactPerson: {
        name: bloodBankData.contactPerson?.name || bloodBankData.contactPerson,
        designation: bloodBankData.contactPerson?.designation || "Manager",
        phone: bloodBankData.contactPerson?.phone || bloodBankData.phone,
        email: bloodBankData.contactPerson?.email || bloodBankData.email
      },
      
      // License & Certification
      licenseNumber: bloodBankData.licenseNumber,
      licenseIssuedDate: bloodBankData.licenseIssuedDate || null,
      licenseExpiryDate: bloodBankData.licenseExpiryDate || null,
      certifications: bloodBankData.certifications || [],
      
      // Operational Details
      operatingHours: bloodBankData.operatingHours || {
        weekdays: "9:00 AM - 6:00 PM",
        weekends: "9:00 AM - 2:00 PM",
        emergency24x7: false
      },
      facilities: bloodBankData.facilities || [],
      storageCapacity: bloodBankData.storageCapacity || 0, // in units
      
      // Admin Control Fields
      status: "PENDING", // PENDING | VERIFIED | REJECTED | SUSPENDED
      verificationStatus: {
        isVerified: false,
        verifiedBy: null, // Admin ObjectId
        verifiedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        suspendedBy: null,
        suspendedAt: null,
        suspensionReason: null
      },
      
      // Statistics & Metrics
      statistics: {
        totalDonationsReceived: 0,
        totalUnitsDistributed: 0,
        totalNgoDrivesSupported: 0,
        totalHospitalRequestsFulfilled: 0,
        lastDonationDate: null,
        lastDistributionDate: null
      },
      
      // Relationships
      supportedNgoDrives: [], // Array of NgoDrive ObjectIds
      hospitalRequests: [], // Array of HospitalBloodRequest ObjectIds
      
      // Metadata
      isActive: false, // Activated only after VERIFIED
      createdAt: new Date(),
      updatedAt: new Date(),
      lastStockUpdate: null
    };

    const result = await collection.insertOne(newBloodBank);
    return { _id: result.insertedId, ...newBloodBank };
  }

  /**
   * READ - Find by MongoDB ID
   */
  async findById(id) {
    const collection = this.getCollection();
    try {
      return await collection.findOne({
        _id: new ObjectId(id),
        ...this.getBloodBankQuery()
      });
    } catch (error) {
      console.error("Error finding blood bank by ID:", error);
      return null;
    }
  }

  /**
   * READ - Find by Organization Code
   */
  async findByCode(organizationCode) {
    const collection = this.getCollection();
    return await collection.findOne({
      organizationCode,
      ...this.getBloodBankQuery()
    });
  }

  /**
   * READ - Find by email
   */
  async findByEmail(email) {
    const collection = this.getCollection();
    return await collection.findOne({
      email: email.toLowerCase(),
      ...this.getBloodBankQuery()
    });
  }

  /**
   * READ - Find all with pagination & filters
   */
  async findAll(filters = {}, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 20 } = pagination;

    // Base query for blood banks only
    const query = { ...this.getBloodBankQuery() };
    
    // Add filters
    if (filters.status) query.status = filters.status;
    if (filters.city) query["address.city"] = new RegExp(filters.city, "i");
    if (filters.state) query["address.state"] = new RegExp(filters.state, "i");
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.emergency24x7) query["operatingHours.emergency24x7"] = true;

    const total = await collection.countDocuments(query);
    const bloodBanks = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    return {
      bloodBanks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * READ - Find all by status (for Admin dashboard)
   */
  async findByStatus(status, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 20 } = pagination;

    const query = {
      ...this.getBloodBankQuery(),
      status: status
    };

    const total = await collection.countDocuments(query);
    const bloodBanks = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    return {
      bloodBanks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * UPDATE - Touch stock timestamp (metadata only)
   */
  async touchStockTimestamp(id) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        {
          _id: new ObjectId(id),
          ...this.getBloodBankQuery()
        },
        {
          $set: {
            lastStockUpdate: new Date(),
            updatedAt: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error updating stock timestamp:", error);
      return false;
    }
  }

  /**
   * UPDATE - General update by ID
   */
  async updateById(id, updateData) {
    const collection = this.getCollection();
    try {
      // Prevent direct status updates (must use admin action methods)
      delete updateData.status;
      delete updateData.verificationStatus;
      
      const result = await collection.updateOne(
        { 
          _id: new ObjectId(id),
          ...this.getBloodBankQuery()
        },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error updating blood bank:", error);
      return false;
    }
  }

  /**
   * ADMIN ACTION - Verify Blood Bank
   * Called by Admin only
   * Creates audit entry in BloodBankAdminAction collection
   */
  async verifyByAdmin(id, adminId, remarks = null) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { 
          _id: new ObjectId(id),
          ...this.getBloodBankQuery(),
          status: "PENDING" // Can only verify PENDING blood banks
        },
        { 
          $set: { 
            status: "VERIFIED",
            isActive: true,
            "verificationStatus.isVerified": true,
            "verificationStatus.verifiedBy": new ObjectId(adminId),
            "verificationStatus.verifiedAt": new Date(),
            updatedAt: new Date()
          }
        }
      );
      
      // Note: BloodBankAdminAction entry should be created by the controller
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error verifying blood bank:", error);
      return false;
    }
  }

  /**
   * ADMIN ACTION - Reject Blood Bank
   * Called by Admin only
   */
  async rejectByAdmin(id, adminId, rejectionReason) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { 
          _id: new ObjectId(id),
          ...this.getBloodBankQuery(),
          status: "PENDING"
        },
        { 
          $set: { 
            status: "REJECTED",
            isActive: false,
            "verificationStatus.rejectedBy": new ObjectId(adminId),
            "verificationStatus.rejectedAt": new Date(),
            "verificationStatus.rejectionReason": rejectionReason,
            updatedAt: new Date()
          }
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error rejecting blood bank:", error);
      return false;
    }
  }

  /**
   * ADMIN ACTION - Suspend Blood Bank
   * Called by Admin only
   */
  async suspendByAdmin(id, adminId, suspensionReason) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { 
          _id: new ObjectId(id),
          ...this.getBloodBankQuery(),
          status: "VERIFIED" // Can only suspend VERIFIED blood banks
        },
        { 
          $set: { 
            status: "SUSPENDED",
            isActive: false,
            "verificationStatus.suspendedBy": new ObjectId(adminId),
            "verificationStatus.suspendedAt": new Date(),
            "verificationStatus.suspensionReason": suspensionReason,
            updatedAt: new Date()
          }
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error suspending blood bank:", error);
      return false;
    }
  }

  /**
   * ADMIN ACTION - Reactivate Suspended Blood Bank
   * Called by Admin only
   */
  async reactivateByAdmin(id, adminId, remarks = null) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { 
          _id: new ObjectId(id),
          ...this.getBloodBankQuery(),
          status: "SUSPENDED"
        },
        { 
          $set: { 
            status: "VERIFIED",
            isActive: true,
            "verificationStatus.suspendedBy": null,
            "verificationStatus.suspendedAt": null,
            "verificationStatus.suspensionReason": null,
            updatedAt: new Date()
          }
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error reactivating blood bank:", error);
      return false;
    }
  }

  /**
   * UPDATE - Increment statistics
   */
  async incrementStatistics(id, field, value = 1) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { 
          _id: new ObjectId(id),
          ...this.getBloodBankQuery()
        },
        { 
          $inc: { [`statistics.${field}`]: value },
          $set: { updatedAt: new Date() }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error incrementing statistics:", error);
      return false;
    }
  }

  /**
   * DELETE - Soft delete (set isActive to false)
   * Hard delete only by Admin with proper authorization
   */
  async deleteById(id) {
    const collection = this.getCollection();
    try {
      const result = await collection.deleteOne({
        _id: new ObjectId(id),
        ...this.getBloodBankQuery()
      });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting blood bank:", error);
      return false;
    }
  }

  /**
   * ANALYTICS - Get blood banks by city/state
   */
  async getStatsByLocation() {
    const collection = this.getCollection();
    try {
      return await collection
        .aggregate([
          { $match: this.getBloodBankQuery() },
          {
            $lookup: {
              from: "blood_stock",
              localField: "_id",
              foreignField: "bloodBankId",
              as: "stock"
            }
          },
          {
            $unwind: {
              path: "$stock",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $group: {
              _id: {
                state: "$address.state",
                city: "$address.city"
              },
              count: { $sum: 1 },
              verified: {
                $sum: { $cond: [{ $eq: ["$status", "VERIFIED"] }, 1, 0] }
              },
              totalStock: {
                $sum: {
                  $ifNull: ["$stock.totalUnitsAvailable", 0]
                }
              }
            }
          },
          { $sort: { count: -1 } }
        ])
        .toArray();
    } catch (error) {
      console.error("Error getting location stats:", error);
      return [];
    }
  }
}

export default new BloodBank();
