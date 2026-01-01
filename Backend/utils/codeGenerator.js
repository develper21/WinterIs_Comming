/**
 * Code Generation Utility
 * Generates human-readable codes for organizations and users
 */

import { getDB } from "../config/db.js";

// #region OrganizationCode

/**
 * Generate Organization Code
 * Format: TYPE-CITY-SEQUENCE
 * Examples: HOSP-DEL-001, BB-MUM-001, NGO-BNG-001
 */
export const generateOrganizationCode = async (type, city) => {
  const db = getDB();
  
  // Type prefix (4 chars)
  const typePrefix = {
    "hospital": "HOSP",
    "bloodbank": "BB",
    "ngo": "NGO"
  }[type.toLowerCase()] || "ORG";
  
  // City prefix (3 chars)
  const cityPrefix = city.substring(0, 3).toUpperCase();
  
  // Get next sequence number
  const lastOrg = await db
    .collection("organizations")
    .find({ type: type.toLowerCase() })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();
  
  let sequenceNum = 1;
  if (lastOrg.length > 0 && lastOrg[0].organizationCode) {
    const lastCode = lastOrg[0].organizationCode;
    const lastNum = parseInt(lastCode.split("-").pop());
    sequenceNum = lastNum + 1;
  }
  
  const sequence = String(sequenceNum).padStart(3, "0");
  return `${typePrefix}-${cityPrefix}-${sequence}`;
};

/**
 * Generate Registration Code
 * Format: REG-YEAR-SEQUENCE
 * Examples: REG-2025-001, REG-2025-002
 */
export const generateRegistrationCode = async () => {
  const db = getDB();
  const year = new Date().getFullYear();
  
  // Get count of registrations this year
  const count = await db
    .collection("organizations")
    .countDocuments({
      createdAt: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`)
      }
    });
  
  const sequence = String(count + 1).padStart(3, "0");
  return `REG-${year}-${sequence}`;
};

/**
 * Generate User Code
 * Format: ORGPREFIX-ROLE-SEQUENCE
 * Examples: ABCEM-ADMIN-001, ABCEM-STAFF-001
 */
export const generateUserCode = async (organizationCode, role) => {
  const db = getDB();
  
  // Get org prefix (first 4 chars of org name, uppercase)
  const org = await db.collection("organizations").findOne({
    organizationCode: organizationCode
  });
  
  if (!org) {
    throw new Error("Organization not found for code generation");
  }
  
  const orgPrefix = org.name
    .substring(0, 4)
    .toUpperCase()
    .replace(/\s/g, "");
  
  const rolePrefix = role.substring(0, 3).toUpperCase();
  
  // Get next sequence for this organization
  const lastUser = await db
    .collection("organizationUsers")
    .find({ organizationCode: organizationCode })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();
  
  let sequenceNum = 1;
  if (lastUser.length > 0 && lastUser[0].userCode) {
    const lastCode = lastUser[0].userCode;
    const lastNum = parseInt(lastCode.split("-").pop());
    sequenceNum = lastNum + 1;
  }
  
  const sequence = String(sequenceNum).padStart(3, "0");
  return `${orgPrefix}-${rolePrefix}-${sequence}`;
};
