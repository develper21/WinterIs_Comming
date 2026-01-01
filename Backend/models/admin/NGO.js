import { getDB } from "../../config/db.js";
import { ObjectId } from "mongodb";

// #region NgoModel

/**
 * NGO Model
 * Note: NGOs are stored in 'organizations' collection with type: 'ngo'
 */
class NGO {
  constructor() {
    this.collectionName = "organizations";
    this.type = "ngo";
  }

  getCollection() {
    const db = getDB();
    return db.collection(this.collectionName);
  }

  // Base query for NGOs only
  getNGOQuery() {
    return { type: this.type };
  }

  // CREATE - Add new NGO
  async create(ngoData) {
    const collection = this.getCollection();
    const newNGO = {
      type: this.type,
      organizationCode: ngoData.organizationCode,
      name: ngoData.name,
      address: ngoData.address,
      city: ngoData.city,
      state: ngoData.state,
      pinCode: ngoData.pinCode,
      contactPerson: ngoData.contactPerson,
      email: ngoData.email.toLowerCase(),
      phone: ngoData.phone,
      focusArea: ngoData.focusArea || "Blood Donation",
      status: "PENDING",
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newNGO);
    return { _id: result.insertedId, ...newNGO };
  }

  // READ - Find by MongoDB ID
  async findById(id) {
    const collection = this.getCollection();
    try {
      return await collection.findOne({
        _id: new ObjectId(id),
        ...this.getNGOQuery()
      });
    } catch (error) {
      return null;
    }
  }

  // READ - Find by NGO Code
  async findByCode(organizationCode) {
    const collection = this.getCollection();
    return await collection.findOne({
      organizationCode,
      ...this.getNGOQuery()
    });
  }

  // READ - Find all with pagination & filters
  async findAll(filters = {}, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 20 } = pagination;

    // Base query for NGOs only
    const query = { ...this.getNGOQuery() };
    
    // Add filters
    if (filters.status) query.status = filters.status;
    if (filters.city) query.city = new RegExp(filters.city, "i");
    if (filters.state) query.state = new RegExp(filters.state, "i");
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    const total = await collection.countDocuments(query);
    const ngos = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    return {
      ngos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // READ - Find all by status
  async findByStatus(status, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 20 } = pagination;

    const query = {
      ...this.getNGOQuery(),
      status: status
    };

    const total = await collection.countDocuments(query);
    const ngos = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    return {
      ngos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // READ - Get donor coverage (AGGREGATED DATA ONLY - NO individual donor info)
  async getDonorCoverage(id) {
    const collection = this.getCollection();
    try {
      const ngo = await collection.findOne({
        _id: new ObjectId(id),
        ...this.getNGOQuery()
      });

      if (!ngo) return null;

      // Return AGGREGATED donor coverage (count by blood group)
      // This does NOT include individual donor data
      return {
        ngoId: ngo._id,
        organizationCode: ngo.organizationCode,
        name: ngo.name,
        donorCoverage: ngo.donorCoverage || {
          "O+": 0,
          "O-": 0,
          "A+": 0,
          "A-": 0,
          "B+": 0,
          "B-": 0,
          "AB+": 0,
          "AB-": 0
        },
        totalDonors: ngo.totalDonors || 0
      };
    } catch (error) {
      return null;
    }
  }

  // UPDATE - By ID
  async updateById(id, updateData) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { 
          _id: new ObjectId(id),
          ...this.getNGOQuery()
        },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      return false;
    }
  }

  // UPDATE - Enable/Disable participation
  async updateActiveStatus(id, isActive) {
    return await this.updateById(id, { isActive });
  }

  // DELETE
  async deleteById(id) {
    const collection = this.getCollection();
    try {
      const result = await collection.deleteOne({
        _id: new ObjectId(id),
        ...this.getNGOQuery()
      });
      return result.deletedCount > 0;
    } catch (error) {
      return false;
    }
  }
}

export default new NGO();
