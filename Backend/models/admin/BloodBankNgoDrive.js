import { getDB } from "../../config/db.js";
import { ObjectId } from "mongodb";

// #region BloodBankNgoDriveModel

/**
 * BloodBankNgoDrive Model
 * 
 * PURPOSE:
 * - Manage blood donation drives organized by NGOs and supported by Blood Banks
 * - Track drive lifecycle from planning to completion
 * - Record blood collection and admin approval
 * - Enable NGO-Blood Bank collaboration
 * 
 * COLLECTION: bloodbank_ngo_drives
 * 
 * RELATIONSHIPS:
 * - bloodBankId → organizations (type: bloodbank)
 * - ngoId → organizations (type: ngo)
 * - approvedBy → admins (for drive approval)
 * - campId → ngo_camps (optional, if drive is part of a camp)
 * 
 * DRIVE STATUS LIFECYCLE:
 * PLANNED → APPROVED (by Admin) → ONGOING → COMPLETED | CANCELLED
 */
class BloodBankNgoDrive {
  constructor() {
    this.collectionName = "bloodbank_ngo_drives";
  }

  getCollection() {
    const db = getDB();
    return db.collection(this.collectionName);
  }

  /**
   * CREATE - Register new blood donation drive
   * 
   * @param {Object} driveData
   * @param {string} driveData.bloodBankId - Blood Bank ObjectId
   * @param {string} driveData.ngoId - NGO ObjectId
   * @param {string} driveData.driveName - Name of the drive
   * @param {Date} driveData.scheduledDate - When drive is scheduled
   * @param {Object} driveData.location - Drive location details
   */
  async create(driveData) {
    const collection = this.getCollection();
    
    const newDrive = {
      // Relationship IDs
      bloodBankId: new ObjectId(driveData.bloodBankId),
      ngoId: new ObjectId(driveData.ngoId),
      campId: driveData.campId ? new ObjectId(driveData.campId) : null,
      
      // Drive Information
      driveName: driveData.driveName,
      driveCode: driveData.driveCode || `DRIVE-${Date.now()}`,
      description: driveData.description || null,
      
      // Schedule
      scheduledDate: new Date(driveData.scheduledDate),
      startTime: driveData.startTime || "09:00 AM",
      endTime: driveData.endTime || "05:00 PM",
      duration: driveData.duration || 8, // hours
      
      // Location
      location: {
        venueName: driveData.location?.venueName,
        address: driveData.location?.address,
        city: driveData.location?.city,
        state: driveData.location?.state,
        pinCode: driveData.location?.pinCode,
        coordinates: driveData.location?.coordinates || null
      },
      
      // Targets and Capacity
      targetDonors: driveData.targetDonors || 0,
      expectedUnits: driveData.expectedUnits || 0,
      maxCapacity: driveData.maxCapacity || 100,
      
      // Blood Collection Data
      collectedUnits: {
        "O+": 0,
        "O-": 0,
        "A+": 0,
        "A-": 0,
        "B+": 0,
        "B-": 0,
        "AB+": 0,
        "AB-": 0
      },
      totalUnitsCollected: 0,
      totalDonorsParticipated: 0,
      
      // Status and Approval
      status: "PLANNED", // PLANNED | APPROVED | ONGOING | COMPLETED | CANCELLED
      approvalStatus: {
        isApproved: false,
        approvedBy: null, // Admin ObjectId
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null
      },
      
      // Blood Bank Support Details
      bloodBankSupport: {
        staffProvided: driveData.bloodBankSupport?.staffProvided || 0,
        equipmentProvided: driveData.bloodBankSupport?.equipmentProvided || [],
        vehicleProvided: driveData.bloodBankSupport?.vehicleProvided || false,
        refreshmentsProvided: driveData.bloodBankSupport?.refreshmentsProvided || false
      },
      
      // NGO Coordination
      ngoCoordinator: {
        name: driveData.ngoCoordinator?.name || null,
        phone: driveData.ngoCoordinator?.phone || null,
        email: driveData.ngoCoordinator?.email || null
      },
      
      // Blood Bank Coordinator
      bloodBankCoordinator: {
        name: driveData.bloodBankCoordinator?.name || null,
        phone: driveData.bloodBankCoordinator?.phone || null,
        email: driveData.bloodBankCoordinator?.email || null
      },
      
      // Additional Details
      requirements: driveData.requirements || [],
      notes: driveData.notes || null,
      
      // Metadata
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      cancelledAt: null,
      cancellationReason: null
    };

    const result = await collection.insertOne(newDrive);
    return { _id: result.insertedId, ...newDrive };
  }

  /**
   * READ - Find drive by ID
   */
  async findById(id) {
    const collection = this.getCollection();
    try {
      return await collection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error("Error finding drive by ID:", error);
      return null;
    }
  }

  /**
   * READ - Find all drives for a blood bank
   */
  async findByBloodBankId(bloodBankId, filters = {}, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 20 } = pagination;

    const query = { bloodBankId: new ObjectId(bloodBankId) };
    
    if (filters.status) query.status = filters.status;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    const total = await collection.countDocuments(query);
    const drives = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ scheduledDate: -1 })
      .toArray();

    return {
      drives,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * READ - Find all drives for an NGO
   */
  async findByNgoId(ngoId, filters = {}, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 20 } = pagination;

    const query = { ngoId: new ObjectId(ngoId) };
    
    if (filters.status) query.status = filters.status;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    const total = await collection.countDocuments(query);
    const drives = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ scheduledDate: -1 })
      .toArray();

    return {
      drives,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * READ - Find drives by status
   */
  async findByStatus(status, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 20 } = pagination;

    const query = { status };

    const total = await collection.countDocuments(query);
    const drives = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ scheduledDate: -1 })
      .toArray();

    return {
      drives,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * READ - Get drives with full details (blood bank + NGO info)
   */
  async getDriveWithDetails(id) {
    const collection = this.getCollection();
    try {
      const result = await collection.aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: "organizations",
            localField: "bloodBankId",
            foreignField: "_id",
            as: "bloodBankDetails"
          }
        },
        {
          $lookup: {
            from: "organizations",
            localField: "ngoId",
            foreignField: "_id",
            as: "ngoDetails"
          }
        },
        {
          $lookup: {
            from: "admins",
            localField: "approvalStatus.approvedBy",
            foreignField: "_id",
            as: "approverDetails"
          }
        },
        {
          $unwind: {
            path: "$bloodBankDetails",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: "$ngoDetails",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: "$approverDetails",
            preserveNullAndEmptyArrays: true
          }
        }
      ]).toArray();

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error getting drive with details:", error);
      return null;
    }
  }

  /**
   * UPDATE - General update
   */
  async updateById(id, updateData) {
    const collection = this.getCollection();
    try {
      // Prevent direct status updates
      delete updateData.status;
      delete updateData.approvalStatus;
      
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error updating drive:", error);
      return false;
    }
  }

  /**
   * ADMIN ACTION - Approve drive
   */
  async approveByAdmin(id, adminId, remarks = null) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { 
          _id: new ObjectId(id),
          status: "PLANNED"
        },
        { 
          $set: { 
            status: "APPROVED",
            "approvalStatus.isApproved": true,
            "approvalStatus.approvedBy": new ObjectId(adminId),
            "approvalStatus.approvedAt": new Date(),
            updatedAt: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error approving drive:", error);
      return false;
    }
  }

  /**
   * ADMIN ACTION - Reject drive
   */
  async rejectByAdmin(id, adminId, rejectionReason) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { 
          _id: new ObjectId(id),
          status: "PLANNED"
        },
        { 
          $set: { 
            "approvalStatus.rejectedBy": new ObjectId(adminId),
            "approvalStatus.rejectedAt": new Date(),
            "approvalStatus.rejectionReason": rejectionReason,
            isActive: false,
            updatedAt: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error rejecting drive:", error);
      return false;
    }
  }

  /**
   * UPDATE - Start drive (change status to ONGOING)
   */
  async startDrive(id) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { 
          _id: new ObjectId(id),
          status: "APPROVED"
        },
        { 
          $set: { 
            status: "ONGOING",
            updatedAt: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error starting drive:", error);
      return false;
    }
  }

  /**
   * UPDATE - Record blood collection
   */
  async recordBloodCollection(id, bloodGroup, units) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $inc: { 
            [`collectedUnits.${bloodGroup}`]: units,
            totalUnitsCollected: units
          },
          $set: { updatedAt: new Date() }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error recording blood collection:", error);
      return false;
    }
  }

  /**
   * UPDATE - Complete drive
   */
  async completeDrive(id, finalData = {}) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { 
          _id: new ObjectId(id),
          status: "ONGOING"
        },
        { 
          $set: { 
            status: "COMPLETED",
            completedAt: new Date(),
            totalDonorsParticipated: finalData.totalDonorsParticipated || 0,
            notes: finalData.notes || null,
            updatedAt: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error completing drive:", error);
      return false;
    }
  }

  /**
   * UPDATE - Cancel drive
   */
  async cancelDrive(id, cancellationReason) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancellationReason,
            isActive: false,
            updatedAt: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error cancelling drive:", error);
      return false;
    }
  }

  /**
   * DELETE
   */
  async deleteById(id) {
    const collection = this.getCollection();
    try {
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting drive:", error);
      return false;
    }
  }

  /**
   * ANALYTICS - Get drive statistics
   */
  async getDriveStatistics(bloodBankId = null, ngoId = null) {
    const collection = this.getCollection();
    try {
      const matchStage = {};
      if (bloodBankId) matchStage.bloodBankId = new ObjectId(bloodBankId);
      if (ngoId) matchStage.ngoId = new ObjectId(ngoId);

      return await collection.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalUnitsCollected: { $sum: "$totalUnitsCollected" },
            totalDonors: { $sum: "$totalDonorsParticipated" }
          }
        }
      ]).toArray();
    } catch (error) {
      console.error("Error getting drive statistics:", error);
      return [];
    }
  }
}

export default new BloodBankNgoDrive();
