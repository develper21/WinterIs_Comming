import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// #region OrganizationRegistration

/**
 * Register a new organization
 * POST /api/auth/org/register
 * Public endpoint - no authentication required
 */
export const registerOrganization = (data) => 
  axios.post(`${API_BASE}/auth/org/register`, data);

/**
 * Check organization registration status
 * GET /api/auth/org/status/:organizationCode
 * Public endpoint - anyone can check
 */
export const checkRegistrationStatus = (organizationCode) =>
  axios.get(`${API_BASE}/auth/org/status/${organizationCode}`);

// #region SuperAdminEndpoints

/**
 * Get all pending organizations
 * GET /api/auth/org/pending
 * Protected - requires superadmin token
 */
export const getPendingOrganizations = (token) =>
  axios.get(`${API_BASE}/auth/org/pending`, {
    headers: { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

/**
 * Get all organizations (approved and pending)
 * GET /api/auth/org/all
 * Protected - requires superadmin token
 */
export const getAllOrganizations = (token) =>
  axios.get(`${API_BASE}/auth/org/all`, {
    headers: { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
