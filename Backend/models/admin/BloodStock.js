import { getDB } from "../../config/db.js";
import { ObjectId } from "mongodb";

const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const DEFAULT_INITIAL_UNITS = {
  "O+": 8,
  "O-": 5,
  "A+": 10,
  "A-": 6,
  "B+": 9,
  "B-": 4,
  "AB+": 7,
  "AB-": 3
};

const prepareStockEntries = (sourceStock = {}, fallbackUnits = {}, updatedBy = "system") => {
  const now = new Date();
  const entries = {};

  BLOOD_GROUPS.forEach((group) => {
    const rawValue = sourceStock[group];
    const fallback = fallbackUnits[group] ?? 0;

    let units = fallback;
    let lastUpdated = now;
    let updatedByValue = updatedBy;

    if (typeof rawValue === "number") {
      units = rawValue;
    } else if (rawValue && typeof rawValue === "object") {
      units = rawValue.units ?? fallback;
      lastUpdated = rawValue.lastUpdated ? new Date(rawValue.lastUpdated) : now;
      updatedByValue = rawValue.updatedBy || updatedBy;
    }

    entries[group] = {
      units: Math.max(0, units),
      lastUpdated,
      updatedBy: updatedByValue
    };
  });

  return entries;
};

const computeStockMeta = (stockEntries) => {
  let totalUnits = 0;
  let criticalCount = 0;

  Object.values(stockEntries).forEach((entry) => {
    totalUnits += entry.units;
    if (entry.units < 5) criticalCount++;
  });

  return { totalUnits, criticalCount };
};

const getLatestUpdateAt = (stockEntries) => {
  return Object.values(stockEntries).reduce((latest, entry) => {
    return entry.lastUpdated > latest ? entry.lastUpdated : latest;
  }, new Date(0));
};

/**
 * BloodStock Model
 * Manages blood inventory for blood banks
 * Note: Each blood bank has one blood stock document
 */
class BloodStock {
  constructor() {
    this.collectionName = "blood_stock";
  }

  getCollection() {
    const db = getDB();
    return db.collection(this.collectionName);
  }

  // CREATE - Initialize blood stock for a blood bank
  async create(bloodBankId, bloodBankCode) {
    const collection = this.getCollection();
    const newStock = {
      bloodBankId: new ObjectId(bloodBankId),
      bloodBankCode: bloodBankCode,
      bloodStock: {
        "O+": { units: 8, lastUpdated: new Date(), updatedBy: "system" },
        "O-": { units: 5, lastUpdated: new Date(), updatedBy: "system" },
        "A+": { units: 10, lastUpdated: new Date(), updatedBy: "system" },
        "A-": { units: 6, lastUpdated: new Date(), updatedBy: "system" },
        "B+": { units: 9, lastUpdated: new Date(), updatedBy: "system" },
        "B-": { units: 4, lastUpdated: new Date(), updatedBy: "system" },
        "AB+": { units: 7, lastUpdated: new Date(), updatedBy: "system" },
        "AB-": { units: 3, lastUpdated: new Date(), updatedBy: "system" }
      },
      lastStockUpdateAt: new Date(),
      totalUnitsAvailable: 52,
      criticalCount: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newStock);
    return { _id: result.insertedId, ...newStock };
  }

  // READ - Find blood stock by blood bank ID
  async findByBloodBankId(bloodBankId) {
    const collection = this.getCollection();
    try {
      return await collection.findOne({
        bloodBankId: new ObjectId(bloodBankId)
      });
    } catch (error) {
      return null;
    }
  }

  // READ - Find blood stock by blood bank code
  async findByBloodBankCode(bloodBankCode) {
    const collection = this.getCollection();
    return await collection.findOne({ bloodBankCode });
  }

  // UPDATE - Update units for a specific blood group
  async updateBloodGroupUnits(bloodBankId, bloodGroup, units, updatedBy) {
    const collection = this.getCollection();
    try {
      // Calculate total units
      const stock = await this.findByBloodBankId(bloodBankId);
      if (!stock) return false;

      let totalUnits = 0;
      let criticalCount = 0;
      const updatedStock = { ...stock.bloodStock };

      updatedStock[bloodGroup] = {
        units: Math.max(0, units), // Prevent negative
        lastUpdated: new Date(),
        updatedBy: updatedBy
      };

      // Recalculate totals
      Object.values(updatedStock).forEach((bg) => {
        totalUnits += bg.units;
        if (bg.units < 5) criticalCount++;
      });

      const result = await collection.updateOne(
        { bloodBankId: new ObjectId(bloodBankId) },
        {
          $set: {
            bloodStock: updatedStock,
            totalUnitsAvailable: totalUnits,
            criticalCount: criticalCount,
            lastStockUpdateAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      return false;
    }
  }

  // READ - Get all blood stock (for analytics)
  async findAll(pagination = {}) {
    const collection = this.getCollection();
    const { page = 1, limit = 20 } = pagination;

    const total = await collection.countDocuments();
    const stocks = await collection
      .find()
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ updatedAt: -1 })
      .toArray();

    return {
      stocks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // READ - Get blood stock summary (all blood banks combined)
  async getSummary() {
    const collection = this.getCollection();
    
    const result = await collection.aggregate([
      {
        $group: {
          _id: null,
          totalUnitsAvailable: { $sum: "$totalUnitsAvailable" },
          totalCritical: { $sum: "$criticalCount" },
          bloodBankCount: { $sum: 1 }
        }
      }
    ]).toArray();

    if (result.length === 0) {
      return {
        totalUnitsAvailable: 0,
        bloodGroupBreakdown: {},
        criticalBloodGroups: [],
        lastUpdatedAt: new Date()
      };
    }

    // Get detailed breakdown by blood group
    const allStocks = await collection.find().toArray();
    const bloodGroupBreakdown = {
      "O+": 0,
      "O-": 0,
      "A+": 0,
      "A-": 0,
      "B+": 0,
      "B-": 0,
      "AB+": 0,
      "AB-": 0
    };

    const rareBloodGroups = ["O-", "B-", "AB-"];
    let criticalBloodGroups = [];

    allStocks.forEach((stock) => {
      Object.entries(stock.bloodStock).forEach(([bg, data]) => {
        bloodGroupBreakdown[bg] += data.units;
        if (data.units < 5 && rareBloodGroups.includes(bg)) {
          criticalBloodGroups.push(bg);
        }
      });
    });

    // Remove duplicates
    criticalBloodGroups = [...new Set(criticalBloodGroups)];

    return {
      totalUnitsAvailable: result[0].totalUnitsAvailable,
      bloodGroupBreakdown,
      criticalBloodGroups,
      lastUpdatedAt: new Date()
    };
  }

  // READ - Get stock by specific blood group
  async getByBloodGroup(bloodGroup) {
    const collection = this.getCollection();
    
    const stocks = await collection
      .aggregate([
        {
          $project: {
            bloodBankId: 1,
            bloodBankCode: 1,
            units: `$bloodStock.${bloodGroup}.units`,
            lastUpdated: `$bloodStock.${bloodGroup}.lastUpdated`
          }
        },
        { $sort: { units: -1 } }
      ])
      .toArray();

    const totalUnits = stocks.reduce((sum, stock) => sum + (stock.units || 0), 0);

    return {
      bloodGroup,
      totalUnits,
      bloodBanks: stocks
    };
  }

  // READ - Get shortage alerts
  async getShortages() {
    const collection = this.getCollection();
    
    const allStocks = await collection.find().toArray();
    const rareBloodGroups = ["O-", "B-", "AB-"];
    const criticalShortages = [];
    const lowStockAlerts = [];

    const bloodGroupStats = {
      "O+": { total: 0, affected: 0 },
      "O-": { total: 0, affected: 0 },
      "A+": { total: 0, affected: 0 },
      "A-": { total: 0, affected: 0 },
      "B+": { total: 0, affected: 0 },
      "B-": { total: 0, affected: 0 },
      "AB+": { total: 0, affected: 0 },
      "AB-": { total: 0, affected: 0 }
    };

    allStocks.forEach((stock) => {
      Object.entries(stock.bloodStock).forEach(([bg, data]) => {
        bloodGroupStats[bg].total += data.units;
        
        if (data.units < 5) {
          bloodGroupStats[bg].affected++;
        }
      });
    });

    // Classify shortages
    Object.entries(bloodGroupStats).forEach(([bg, stats]) => {
      if (stats.total < 20) {
        const alert = {
          bloodGroup: bg,
          totalAvailable: stats.total,
          bloodBanksAffected: stats.affected,
          isRare: rareBloodGroups.includes(bg),
          recommendation:
            stats.total < 5
              ? "CRITICAL: Urgent collection drive needed"
              : "Alert donors for collection"
        };

        if (rareBloodGroups.includes(bg) && stats.total < 20) {
          criticalShortages.push(alert);
        } else if (stats.total < 20) {
          lowStockAlerts.push(alert);
        }
      }
    });

    return {
      criticalShortages,
      lowStockAlerts
    };
  }

  // DELETE - Remove blood stock (on blood bank deletion)
  async deleteByBloodBankId(bloodBankId) {
    const collection = this.getCollection();
    try {
      const result = await collection.deleteOne({
        bloodBankId: new ObjectId(bloodBankId)
      });
      return result.deletedCount > 0;
    } catch (error) {
      return false;
    }
  }
}

export default new BloodStock();
