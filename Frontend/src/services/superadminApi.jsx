import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// Helper function to get auth token
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
};

// #region Dashboard APIs

/**
 * Get complete dashboard overview
 * GET /api/admin/dashboard/overview
 */
export const getDashboardOverview = async () => {
  const response = await axios.get(`${API_BASE}/admin/dashboard/overview`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Get organization statistics
 * GET /api/admin/dashboard/organizations
 */
export const getOrganizationStats = async () => {
  const response = await axios.get(`${API_BASE}/admin/dashboard/organizations`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Get blood stock statistics
 * GET /api/admin/dashboard/blood-stock
 */
export const getBloodStockStats = async () => {
  const response = await axios.get(`${API_BASE}/admin/dashboard/blood-stock`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Get alert statistics
 * GET /api/admin/dashboard/alerts
 */
export const getAlertStats = async () => {
  const response = await axios.get(`${API_BASE}/admin/dashboard/alerts`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Get user statistics
 * GET /api/admin/dashboard/users
 */
export const getUserStats = async () => {
  const response = await axios.get(`${API_BASE}/admin/dashboard/users`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Get recent activity logs
 * GET /api/admin/dashboard/activity?limit=10
 */
export const getRecentActivity = async (limit = 10) => {
  const response = await axios.get(`${API_BASE}/admin/dashboard/activity`, {
    headers: getAuthHeaders(),
    params: { limit }
  });
  return response.data;
};

/**
 * Get system health status
 * GET /api/admin/dashboard/health
 */
export const getSystemHealth = async () => {
  const response = await axios.get(`${API_BASE}/admin/dashboard/health`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// #region Approval APIs

/**
 * Get all pending approvals (all types combined)
 * GET /api/admin/approvals/pending/all
 */
export const getAllPendingApprovals = async (page = 1, limit = 10, sortBy = "createdAt") => {
  const response = await axios.get(`${API_BASE}/admin/approvals/pending/all`, {
    headers: getAuthHeaders(),
    params: { page, limit, sortBy }
  });
  return response.data;
};

/**
 * Get pending approvals by type
 * GET /api/admin/approvals/pending?type=hospital
 */
export const getPendingApprovals = async (type, page = 1, limit = 10) => {
  const response = await axios.get(`${API_BASE}/admin/approvals/pending`, {
    headers: getAuthHeaders(),
    params: { type, page, limit }
  });
  return response.data;
};

/**
 * Get pending hospitals only
 * GET /api/admin/approvals/pending/hospitals
 */
export const getPendingHospitals = async (page = 1, limit = 10) => {
  const response = await axios.get(`${API_BASE}/admin/approvals/pending/hospitals`, {
    headers: getAuthHeaders(),
    params: { page, limit }
  });
  return response.data;
};

/**
 * Get pending blood banks only
 * GET /api/admin/approvals/pending/bloodbanks
 */
export const getPendingBloodBanks = async (page = 1, limit = 10) => {
  const response = await axios.get(`${API_BASE}/admin/approvals/pending/bloodbanks`, {
    headers: getAuthHeaders(),
    params: { page, limit }
  });
  return response.data;
};

/**
 * Get pending NGOs only
 * GET /api/admin/approvals/pending/ngos
 */
export const getPendingNgos = async (page = 1, limit = 10) => {
  const response = await axios.get(`${API_BASE}/admin/approvals/pending/ngos`, {
    headers: getAuthHeaders(),
    params: { page, limit }
  });
  return response.data;
};

/**
 * Get approval statistics summary
 * GET /api/admin/approvals/stats
 */
export const getApprovalStats = async () => {
  const response = await axios.get(`${API_BASE}/admin/approvals/stats`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Get organization details by code
 * GET /api/admin/approvals/:id
 */
export const getOrganizationDetails = async (id) => {
  const response = await axios.get(`${API_BASE}/admin/approvals/${id}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Approve a pending organization
 * POST /api/admin/approvals/approve
 * Body: { organizationCode, approvalRemarks }
 */
export const approveOrganization = async (organizationCode, approvalRemarks) => {
  const response = await axios.post(
    `${API_BASE}/admin/approvals/approve`,
    { organizationCode, approvalRemarks },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

/**
 * Reject a pending organization
 * POST /api/admin/approvals/reject
 * Body: { organizationCode, rejectionReason }
 */
export const rejectOrganization = async (organizationCode, rejectionReason) => {
  const response = await axios.post(
    `${API_BASE}/admin/approvals/reject`,
    { organizationCode, rejectionReason },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

/**
 * Suspend an organization
 * POST /api/admin/approvals/suspend
 * Body: { organizationCode, suspensionReason }
 */
export const suspendOrganization = async (organizationCode, suspensionReason) => {
  const response = await axios.post(
    `${API_BASE}/admin/approvals/suspend`,
    { organizationCode, suspensionReason },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// #region Organization APIs

/**
 * Get all organizations with filters
 * GET /api/auth/org/all
 */
export const getAllOrganizations = async (filters = {}, pagination = {}) => {
  const response = await axios.get(`${API_BASE}/auth/org/all`, {
    headers: getAuthHeaders(),
    params: { ...filters, ...pagination }
  });
  return response.data;
};

/**
 * Get pending organizations
 * GET /api/auth/org/pending
 */
export const getPendingOrganizations = async (filters = {}, pagination = {}) => {
  const response = await axios.get(`${API_BASE}/auth/org/pending`, {
    headers: getAuthHeaders(),
    params: { ...filters, ...pagination }
  });
  return response.data;
};

/**
 * Get organization status by code
 * GET /api/auth/org/status/:organizationCode
 */
export const getOrganizationStatus = async (organizationCode) => {
  const response = await axios.get(`${API_BASE}/auth/org/status/${organizationCode}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};
