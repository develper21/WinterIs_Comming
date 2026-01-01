import { getDB } from "../../config/db.js";
import { ObjectId } from "mongodb";

// #region HospitalModel

/**
 * Hospital Model
 * Note: Hospitals are stored in 'organizations' collection with type: 'hospital'
 */
class Hospital {
  constructor() {
    this.collectionName = "organizations";
    this.type = "hospital";
  }

  getCollection() {
    const db = getDB();
    return db.collection(this.collectionName);
  }

  // Base query for hospitals only
  getHospitalQuery() {
    return { type: this.type };
  }

  // CREATE - Add new hospital
  async create(hospitalData) {
    const collection = this.getCollection();
    const newHospital = {
      type: this.type,
      organizationCode: hospitalData.organizationCode,
      name: hospitalData.name,
      address: hospitalData.address,
      city: hospitalData.city,
      state: hospitalData.state,
      pinCode: hospitalData.pinCode,
      contactPerson: hospitalData.contactPerson,
      email: hospitalData.email.toLowerCase(),
      phone: hospitalData.phone,
      totalBedCapacity: hospitalData.totalBedCapacity,
      emergencyCapacity: hospitalData.emergencyCapacity,
      status: "PENDING",
      registeredDate: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newHospital);
    return { _id: result.insertedId, ...newHospital };
  }

  // READ - Find by MongoDB ID
  async findById(id) {
    const collection = this.getCollection();
    try {
      return await collection.findOne({
        _id: new ObjectId(id),
        ...this.getHospitalQuery()
      });
    } catch (error) {
      return null;
    }
  }

  // READ - Find by Hospital Code
  async findByCode(organizationCode) {
    const collection = this.getCollection();
    return await collection.findOne({
      organizationCode,
      ...this.getHospitalQuery()
    });
  }

  // READ - Find all with pagination & filters
  async findAll(filters = {}, pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 20 } = pagination;

    // Base query for hospitals only
    const query = { ...this.getHospitalQuery() };
    
    // Add filters
    if (filters.status) query.status = filters.status;
    if (filters.city) query.city = new RegExp(filters.city, "i");
    if (filters.state) query.state = new RegExp(filters.state, "i");

    const total = await collection.countDocuments(query);
    const hospitals = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ registeredDate: -1 })
      .toArray();

    return {
      hospitals,
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
      ...this.getHospitalQuery(),
      status: status
    };

    const total = await collection.countDocuments(query);
    const hospitals = await collection
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ registeredDate: -1 })
      .toArray();

    return {
      hospitals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // UPDATE - By ID
  async updateById(id, updateData) {
    const collection = this.getCollection();
    try {
      const result = await collection.updateOne(
        { 
          _id: new ObjectId(id),
          ...this.getHospitalQuery()
        },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      return false;
    }
  }

  // UPDATE - Status
  async updateStatus(id, status) {
    return await this.updateById(id, { status });
  }

  // DELETE
  async deleteById(id) {
    const collection = this.getCollection();
    try {
      const result = await collection.deleteOne({
        _id: new ObjectId(id),
        ...this.getHospitalQuery()
      });
      return result.deletedCount > 0;
    } catch (error) {
      return false;
    }
  }
}

export default new Hospital();
