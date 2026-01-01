import { getDB } from "../../config/db.js";
import { ObjectId } from "mongodb";

// #region HospitalBloodRequestModel

/**
 * HospitalBloodRequest Model
 * 
 * PURPOSE:
 * - Manage emergency blood requests from hospitals to blood banks
 * - Track request lifecycle from creation to fulfillment
 * - Enable real-time blood availability matching
 * - Maintain request history and analytics
 * 
 * COLLECTION: hospital_blood_requests
 * 
 * RELATIONSHIPS:
 * - hospitalId → organizations (type: hospital)
 * - bloodBankId → organizations (type: bloodbank)
 * - requestedBy → organization_users (hospital staff)
 * - fulfilledBy → organization_users (blood bank staff)
 * - approvedBy → admins (optional, for high-priority requests)
 * 
 * REQUEST STATUS LIFECYCLE:
 * PENDING → APPROVED → PROCESSING → FULFILLED | REJECTED | CANCELLED | EXPIRED
 */
class HospitalBloodRequest {
  constructor() {
    this.collectionName = "hospital_blood_requests";
  }

  getCollection() {
    const db = getDB();
    return db.collection(this.collectionName);
  }

  /**
   * CREATE - New blood request from hospital
   * 
   * @param {Object} requestData
   * @param {string} requestData.hospitalId - Hospital ObjectId
   * @param {string} requestData.bloodBankId - Blood Bank ObjectId (optional initially)
   * @param {string} requestData.bloodGroup - Required blood group
   * @param {number} requestData.unitsRequired - Number of units needed
   * @param {string} requestData.urgency - CRITICAL | HIGH | MEDIUM | LOW
   */
  async create(requestData) {
    const collection = this.getCollection();
    
    const newRequest = {
      // Relationship IDs
      hospitalId: new ObjectId(requestData.hospitalId),
      bloodBankId: requestData.bloodBankId ? new ObjectId(requestData.bloodBankId) : null,
      requestedBy: requestData.requestedBy ? new ObjectId(requestData.requestedBy) : null,
      
      // Request Details
      requestCode: requestData.requestCode || `REQ-${Date.now()}`,
      bloodGroup: requestData.bloodGroup, // O+, O-, A+, A-, B+, B-, AB+, AB-
      unitsRequired: requestData.unitsRequired,
      unitsFulfilled: 0,
      
      // Urgency and Priority
      urgency: requestData.urgency || "MEDIUM", // CRITICAL | HIGH | MEDIUM | LOW
      priority: requestData.priority || "NORMAL", // EMERGENCY | HIGH | NORMAL
      
      // Patient Information (anonymized for privacy)
      patientInfo: {
        patientId: requestData.patientInfo?.patientId || null, // Hospital internal ID
        age: requestData.patientInfo?.age || null,
        gender: requestData.patientInfo?.gender || null,
        condition: requestData.patientInfo?.condition || null, // Medical condition
        department: requestData.patientInfo?.department || null // ICU, Emergency, etc.
      },
      
      // Request Timeline
      requestedAt: new Date(),
      requiredBy: requestData.requiredBy ? new Date(requestData.requiredBy) : null,
      expiresAt: requestData.expiresAt ? new Date(requestData.expiresAt) : null,
      
      // Status and Lifecycle
      status: "PENDING", // PENDING | APPROVED | PROCESSING | FULFILLED | REJECTED | CANCELLED | EXPIRED
      
      // Approval (for high-priority/critical requests)
      approvalStatus: {
        requiresApproval: requestData.urgency === "CRITICAL" || requestData.priority === "EMERGENCY",
        isApproved: false,
        approvedBy: null, // Admin ObjectId
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null
      },
      
      // Fulfillment Details
      fulfillmentDetails: {
        fulfilledBy: null, // Blood Bank staff ObjectId
        fulfilledAt: null,
        batchNumbers: [], // Blood bag batch numbers
        expiryDates: [], // Blood bag expiry dates
        collectionMethod: null, // PICKUP | DELIVERY
        deliveryAddress: requestData.fulfillmentDetails?.deliveryAddress || null,
        estimatedDeliveryTime: null,
        actualDeliveryTime: null
      },
      
      // Blood Bank Response
      bloodBankResponse: {
        responseTime: null,
        availableUnits: null,
        confirmedUnits: null,
        alternativeBloodGroups: [], // If exact match not available
        estimatedAvailability: null,
        contactPerson: null,
        contactPhone: null
      },
      
      // Additional Information
      notes: requestData.notes || null,
      specialRequirements: requestData.specialRequirements || [], // e.g., "CMV Negative", "Irradiated"
      
      // Communication Log
      communicationLog: [],
      
      // Metadata
      isActive: true,
      isUrgent: requestData.urgency === "CRITICAL" || requestData.urgency === "HIGH",
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      cancelledAt: null,
      cancellationReason: null
    };

    const result = await collection.insertOne(newRequest);
    return { _id: result.insertedId, ...newRequest };
  }

  /**
   * READ - Find request by ID
   */
  async findById(id) {
    const collection = this.getCollection();
    try {
      return await collection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error("Error finding request by ID:", error);
      return null;
    }
  }

  /**
   * READ - Find request by request code
   */
  async findByRequestCode(requestCode) {
    const collection = this.getCollection();
    return await collection.findOne({ requestCode });
  }

  /**
   * READ - Find all requests for a hospital
   */
  async findByHospitalId(hospitalId, filters = {}, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 20 } = pagination;

    const query = { hospitalId: new ObjectId(hospitalId) };
    
    if (filters.status) query.status = filters.status;
    if (filters.urgency) query.urgency = filters.urgency;
    if (filters.bloodGroup) query.bloodGroup = filters.bloodGroup;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    const total = await collection.countDocuments(query);
    const requests = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ requestedAt: -1 })
      .toArray();

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * READ - Find all requests for a blood bank
   */
  async findByBloodBankId(bloodBankId, filters = {}, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 20 } = pagination;

    const query = { bloodBankId: new ObjectId(bloodBankId) };
    
    if (filters.status) query.status = filters.status;
    if (filters.urgency) query.urgency = filters.urgency;
    if (filters.bloodGroup) query.bloodGroup = filters.bloodGroup;

    const total = await collection.countDocuments(query);
    const requests = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ requestedAt: -1 })
      .toArray();

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * READ - Find pending requests (for blood bank matching)
   */
  async findPendingRequests(filters = {}, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 20 } = pagination;

    const query = { 
      status: "PENDING",
      isActive: true
    };
    
    if (filters.bloodGroup) query.bloodGroup = filters.bloodGroup;
    if (filters.urgency) query.urgency = filters.urgency;
    if (filters.city) query["patientInfo.city"] = filters.city;

    const total = await collection.countDocuments(query);
    const requests = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ urgency: -1, requestedAt: 1 }) // Most urgent first
      .toArray();

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * READ - Find urgent/critical requests
   */
  async findUrgentRequests(pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 20 } = pagination;

    const query = { 
      isUrgent: true,
      status: { $in: ["PENDING", "APPROVED", "PROCESSING"] },
      isActive: true
    };

    const total = await collection.countDocuments(query);
    const requests = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ urgency: -1, requestedAt: 1 })
      .toArray();

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * READ - Get request with full details (hospital + blood bank info)
   */
  async getRequestWithDetails(id) {
    const collection = this.getCollection();
    try {
      const result = await collection.aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: "organizations",
            localField: "hospitalId",
            foreignField: "_id",
            as: "hospitalDetails"
          }
        },
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
            from: "admins",
            localField: "approvalStatus.approvedBy",
            foreignField: "_id",
            as: "approverDetails"
          }
        },
        {
          $unwind: {
            path: "$hospitalDetails",
            preserveNullAndEmptyArrays: true
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
            path: "$approverDetails",
            preserveNullAndEmptyArrays: true
          }
        }
      ]).toArray();

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error getting request with details:", error);
      return null;
    }
  }

  /**
   * UPDATE - Assign blood bank to request
   */
  async assignBloodBank(id, bloodBankId) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { 
          _id: new ObjectId(id),
          status: "PENDING"
        },
        { 
          $set: { 
            bloodBankId: new ObjectId(bloodBankId),
            status: "APPROVED",
            "bloodBankResponse.responseTime": new Date(),
            updatedAt: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error assigning blood bank:", error);
      return false;
    }
  }

  /**
   * ADMIN ACTION - Approve critical request
   */
  async approveByAdmin(id, adminId, remarks = null) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { 
          _id: new ObjectId(id),
          "approvalStatus.requiresApproval": true
        },
        { 
          $set: { 
            "approvalStatus.isApproved": true,
            "approvalStatus.approvedBy": new ObjectId(adminId),
            "approvalStatus.approvedAt": new Date(),
            status: "APPROVED",
            updatedAt: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error approving request:", error);
      return false;
    }
  }

  /**
   * UPDATE - Blood bank response
   */
  async updateBloodBankResponse(id, responseData) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            "bloodBankResponse.availableUnits": responseData.availableUnits,
            "bloodBankResponse.confirmedUnits": responseData.confirmedUnits,
            "bloodBankResponse.alternativeBloodGroups": responseData.alternativeBloodGroups || [],
            "bloodBankResponse.estimatedAvailability": responseData.estimatedAvailability,
            "bloodBankResponse.contactPerson": responseData.contactPerson,
            "bloodBankResponse.contactPhone": responseData.contactPhone,
            "bloodBankResponse.responseTime": new Date(),
            updatedAt: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error updating blood bank response:", error);
      return false;
    }
  }

  /**
   * UPDATE - Start processing request
   */
  async startProcessing(id, staffId = null) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { 
          _id: new ObjectId(id),
          status: "APPROVED"
        },
        { 
          $set: { 
            status: "PROCESSING",
            "fulfillmentDetails.fulfilledBy": staffId ? new ObjectId(staffId) : null,
            updatedAt: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error starting processing:", error);
      return false;
    }
  }

  /**
   * UPDATE - Fulfill request
   */
  async fulfillRequest(id, fulfillmentData) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { 
          _id: new ObjectId(id),
          status: "PROCESSING"
        },
        { 
          $set: { 
            status: "FULFILLED",
            unitsFulfilled: fulfillmentData.unitsFulfilled,
            "fulfillmentDetails.fulfilledAt": new Date(),
            "fulfillmentDetails.batchNumbers": fulfillmentData.batchNumbers || [],
            "fulfillmentDetails.expiryDates": fulfillmentData.expiryDates || [],
            "fulfillmentDetails.collectionMethod": fulfillmentData.collectionMethod,
            "fulfillmentDetails.actualDeliveryTime": fulfillmentData.actualDeliveryTime || new Date(),
            completedAt: new Date(),
            isActive: false,
            updatedAt: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error fulfilling request:", error);
      return false;
    }
  }

  /**
   * UPDATE - Reject request
   */
  async rejectRequest(id, rejectionReason, rejectedBy = null) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            status: "REJECTED",
            "approvalStatus.rejectedBy": rejectedBy ? new ObjectId(rejectedBy) : null,
            "approvalStatus.rejectedAt": new Date(),
            "approvalStatus.rejectionReason": rejectionReason,
            isActive: false,
            updatedAt: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error rejecting request:", error);
      return false;
    }
  }

  /**
   * UPDATE - Cancel request
   */
  async cancelRequest(id, cancellationReason) {
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
      console.error("Error cancelling request:", error);
      return false;
    }
  }

  /**
   * UPDATE - Add communication log entry
   */
  async addCommunicationLog(id, logEntry) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $push: { 
            communicationLog: {
              timestamp: new Date(),
              message: logEntry.message,
              from: logEntry.from,
              to: logEntry.to,
              type: logEntry.type || "NOTE"
            }
          },
          $set: { updatedAt: new Date() }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error adding communication log:", error);
      return false;
    }
  }

  /**
   * UPDATE - Mark expired requests
   * Should be run periodically (cron job)
   */
  async markExpiredRequests() {
    const collection = this.getCollection();
    try {
      const result = await collection.updateMany(
        { 
          expiresAt: { $lt: new Date() },
          status: { $in: ["PENDING", "APPROVED"] },
          isActive: true
        },
        { 
          $set: { 
            status: "EXPIRED",
            isActive: false,
            updatedAt: new Date()
          }
        }
      );
      return result.modifiedCount;
    } catch (error) {
      console.error("Error marking expired requests:", error);
      return 0;
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
      console.error("Error deleting request:", error);
      return false;
    }
  }

  /**
   * ANALYTICS - Get request statistics
   */
  async getRequestStatistics(hospitalId = null, bloodBankId = null) {
    const collection = this.getCollection();
    try {
      const matchStage = {};
      if (hospitalId) matchStage.hospitalId = new ObjectId(hospitalId);
      if (bloodBankId) matchStage.bloodBankId = new ObjectId(bloodBankId);

      return await collection.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              status: "$status",
              bloodGroup: "$bloodGroup"
            },
            count: { $sum: 1 },
            totalUnitsRequested: { $sum: "$unitsRequired" },
            totalUnitsFulfilled: { $sum: "$unitsFulfilled" }
          }
        },
        { $sort: { count: -1 } }
      ]).toArray();
    } catch (error) {
      console.error("Error getting request statistics:", error);
      return [];
    }
  }

  /**
   * ANALYTICS - Get average response time
   */
  async getAverageResponseTime(bloodBankId = null) {
    const collection = this.getCollection();
    try {
      const matchStage = { status: "FULFILLED" };
      if (bloodBankId) matchStage.bloodBankId = new ObjectId(bloodBankId);

      return await collection.aggregate([
        { $match: matchStage },
        {
          $project: {
            responseTime: {
              $subtract: ["$bloodBankResponse.responseTime", "$requestedAt"]
            },
            fulfillmentTime: {
              $subtract: ["$fulfillmentDetails.fulfilledAt", "$requestedAt"]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: "$responseTime" },
            avgFulfillmentTime: { $avg: "$fulfillmentTime" }
          }
        }
      ]).toArray();
    } catch (error) {
      console.error("Error getting average response time:", error);
      return [];
    }
  }
}

export default new HospitalBloodRequest();
