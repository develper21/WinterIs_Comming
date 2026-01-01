import bcrypt from "bcryptjs";
import { Organization } from "../../models/organization/Organization.js";
import {
  generateOrganizationCode,
  generateRegistrationCode
} from "../../utils/codeGenerator.js";

// #region Validators

const validateRegistrationInput = (data) => {
  const errors = [];
  
  // Organization Details
  if (!data.organizationName) errors.push("Organization name is required");
  if (!data.type) errors.push("Organization type is required");
  if (!["hospital", "bloodbank", "ngo"].includes(data.type?.toLowerCase())) {
    errors.push("Type must be: hospital, bloodbank, or ngo");
  }
  
  // Location
  if (!data.location?.city) errors.push("City is required");
  if (!data.location?.state) errors.push("State is required");
  
  // Contact
  if (!data.email) errors.push("Organization email is required");
  if (!data.phone) errors.push("Phone number is required");
  
  // License (only this, no documents)
  if (!data.licenseNumber) errors.push("License number is required");
  
  // Admin Details
  if (!data.adminName) errors.push("Admin name is required");
  if (!data.adminEmail) errors.push("Admin email is required");
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    errors.push("Invalid organization email format");
  }
  if (data.adminEmail && !emailRegex.test(data.adminEmail)) {
    errors.push("Invalid admin email format");
  }
  
  return errors;
};

// #region ResponseHandlers

const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const sendError = (res, message = "An error occurred", statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    message,
    data: null
  });
};

// #region OrganizationRegistration

/**
 * Register Organization
 * - Accepts: org details, license number, admin details
 * - NO documents yet
 * - Auto-generates: organizationCode, registrationCode
 * - Creates admin account info (for later creation on approval)
 */
export const registerOrganization = async (req, res) => {
  try {
    const {
      organizationName,
      type,
      email,
      phone,
      location,
      licenseNumber,
      contactPerson,
      adminName,
      adminEmail
    } = req.body;

    // Validate input
    const validationErrors = validateRegistrationInput(req.body);
    if (validationErrors.length > 0) {
      return sendError(res, validationErrors.join(", "), 400);
    }

    // Check if organization email already exists
    const existingOrg = await Organization.findByEmail(email);
    if (existingOrg) {
      return sendError(res, "Organization with this email already registered", 409);
    }

    // Check if license number already exists
    const existingLicense = await Organization.findByLicense(licenseNumber);
    if (existingLicense) {
      return sendError(res, "License number already registered", 409);
    }

    // Check if admin email already exists
    const existingAdminEmail = await Organization.findByAdminEmail(adminEmail);
    if (existingAdminEmail) {
      return sendError(res, "Admin email already registered", 409);
    }

    // ✅ Generate organizationCode
    const organizationCode = await generateOrganizationCode(
      type,
      location.city
    );

    // ✅ Generate registrationCode
    const registrationCode = await generateRegistrationCode();

    // Create organization document
    const organizationData = {
      organizationCode,        // ← Auto-generated
      registrationCode,        // ← Auto-generated
      name: organizationName,
      type: type.toLowerCase(),
      
      // Contact
      email: email.toLowerCase(),
      phone,
      
      // Location
      location: {
        city: location.city,
        state: location.state,
        pincode: location.pincode || "",
        address: location.address || ""
      },
      
      // License only (no documents yet)
      licenseNumber,
      
      // Primary contact
      contactPerson: contactPerson || adminName,
      
      // Admin info (will create user on approval)
      adminName,
      adminEmail: adminEmail.toLowerCase(),
      
      // Status
      status: "PENDING"
    };

    // Insert into organizations collection using model
    await Organization.create(organizationData);

    // Log registration
    console.log(`[ORGANIZATION REGISTRATION] ${organizationName} (${organizationCode}) registered`);

    // Response
    sendSuccess(res, {
      organizationCode,
      registrationCode,
      name: organizationName,
      type,
      email,
      status: "PENDING",
      message: "Registration submitted. Awaiting admin approval."
    }, "Organization registered successfully", 201);

  } catch (error) {
    console.error("Organization registration error:", error);
    sendError(res, "Registration failed", 500);
  }
};

/**
 * Get Organization Registration Status
 * Allows org to check their application status
 */
export const getOrganizationStatus = async (req, res) => {
  try {
    const { organizationCode } = req.params;

    const org = await Organization.findByCode(organizationCode);

    if (!org) {
      return sendError(res, "Organization not found", 404);
    }

    // Return complete organization details for profile page
    const response = {
      _id: org._id,
      organizationCode: org.organizationCode,
      registrationCode: org.registrationCode,
      name: org.name,
      type: org.type,
      email: org.email,                    // ✅ Added
      phone: org.phone,                    // ✅ Added
      address: org.location || org.address, // ✅ Added (handle both field names)
      licenseNumber: org.licenseNumber,    // ✅ Added
      licenseIssuedDate: org.licenseIssuedDate, // ✅ Added
      licenseExpiryDate: org.licenseExpiryDate, // ✅ Added
      storageCapacity: org.storageCapacity, // ✅ Added
      contactPerson: org.contactPerson,    // ✅ Added
      certifications: org.certifications,  // ✅ Added
      facilities: org.facilities,          // ✅ Added
      operatingHours: org.operatingHours,  // ✅ Added
      status: org.status,
      verificationStatus: org.verificationStatus, // ✅ Added
      statusDetails: {
        pending: org.status === "PENDING",
        approved: org.status === "APPROVED",
        rejected: org.status === "REJECTED",
        suspended: org.status === "SUSPENDED"
      },
      createdAt: org.createdAt,
      updatedAt: org.updatedAt
    };

    // Add approval details if approved
    if (org.status === "APPROVED") {
      response.approvedAt = org.approvedAt;
      response.approvalRemarks = org.approvalRemarks;
      response.admin = {
        name: org.organizationAdmin?.name || org.adminName,
        email: org.organizationAdmin?.email || org.adminEmail
      };
    }

    // Add rejection details if rejected
    if (org.status === "REJECTED") {
      response.rejectionReason = org.rejectionReason;
    }

    console.log(`[ORG_STATUS] Returning complete details for ${organizationCode}`);

    sendSuccess(res, response, "Organization status retrieved");

  } catch (error) {
    console.error("Get organization status error:", error);
    sendError(res, "Failed to retrieve status", 500);
  }
};

/**
 * Get All Pending Organizations (Admin View)
 * Only main admin can see this
 */
export const getPendingOrganizations = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;

    const filters = {};
    if (type && ["hospital", "bloodbank", "ngo"].includes(type.toLowerCase())) {
      filters.type = type.toLowerCase();
    }

    const pagination = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    };

    // Get pending organizations using model
    const result = await Organization.findAllPending(filters, pagination);

    // Format response
    const formatted = result.organizations.map(org => ({
      _id: org._id,
      organizationCode: org.organizationCode,
      registrationCode: org.registrationCode,
      name: org.name,
      type: org.type,
      email: org.email,
      phone: org.phone,
      location: org.location,
      licenseNumber: org.licenseNumber,
      contactPerson: org.contactPerson,
      admin: {
        name: org.adminName,
        email: org.adminEmail
      },
      requestedAt: org.createdAt
    }));

    sendSuccess(res, {
      organizations: formatted,
      pagination: result.pagination
    }, `Found ${result.pagination.totalItems} pending organizations`);

  } catch (error) {
    console.error("Get pending organizations error:", error);
    sendError(res, "Failed to fetch pending organizations", 500);
  }
};

/**
 * Get All Organizations (Admin View)
 * Retrieve all organizations with optional filters and pagination
 */
export const getAllOrganizations = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status } = req.query;

    const filters = {};
    if (type && ["hospital", "bloodbank", "ngo"].includes(type.toLowerCase())) {
      filters.type = type.toLowerCase();
    }
    if (status) {
      filters.status = status;
    }

    const pagination = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    };

    // Get all organizations using model
    const result = await Organization.findAll(filters, pagination);

    // Format response
    const formatted = result.organizations.map(org => ({
      _id: org._id,
      organizationCode: org.organizationCode,
      registrationCode: org.registrationCode,
      name: org.name,
      type: org.type,
      email: org.email,
      phone: org.phone,
      location: org.location,
      licenseNumber: org.licenseNumber,
      status: org.status,
      admin: {
        name: org.adminName,
        email: org.adminEmail
      },
      createdAt: org.createdAt,
      updatedAt: org.updatedAt
    }));

    sendSuccess(res, {
      organizations: formatted,
      pagination: result.pagination
    }, `Found ${result.pagination.totalItems} organizations`);

  } catch (error) {
    console.error("Get all organizations error:", error);
    sendError(res, "Failed to fetch organizations", 500);
  }
};
