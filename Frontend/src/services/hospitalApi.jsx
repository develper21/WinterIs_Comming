import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// #region HospitalCrud

/**
 * Create a new hospital
 * POST /api/hospitals
 * Public endpoint - no authentication required (initial registration)
 * Status will be PENDING until admin verifies
 */
export const createHospital = (hospitalData) =>
  axios.post(`${API_BASE}/hospitals`, hospitalData);

/**
 * Get hospital by ID
 * GET /api/hospitals/:id
 * Public endpoint
 */
export const getHospitalById = (hospitalId) =>
  axios.get(`${API_BASE}/hospitals/${hospitalId}`);

/**
 * Get all hospitals with filters
 * GET /api/hospitals?verificationStatus=VERIFIED&city=Delhi&page=1&limit=10
 * Public endpoint
 * 
 * @param {Object} filters - { verificationStatus, city, isActive, page, limit }
 */
export const getAllHospitals = (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.verificationStatus) params.append('verificationStatus', filters.verificationStatus);
  if (filters.city) params.append('city', filters.city);
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);

  return axios.get(`${API_BASE}/hospitals?${params.toString()}`);
};

/**
 * Get nearby hospitals (geospatial query)
 * GET /api/hospitals/nearby?longitude=77.2090&latitude=28.6139&maxDistance=5000
 * Public endpoint
 * 
 * @param {number} longitude
 * @param {number} latitude
 * @param {number} maxDistance - in meters (default 5000m = 5km)
 */
export const getNearbyHospitals = (longitude, latitude, maxDistance = 5000) =>
  axios.get(`${API_BASE}/hospitals/nearby`, {
    params: { longitude, latitude, maxDistance }
  });

/**
 * Update hospital
 * PUT /api/hospitals/:id
 * Protected - requires hospital admin authentication
 * Cannot update verificationStatus (admin-only action)
 */
export const updateHospital = (hospitalId, updateData, token) =>
  axios.put(`${API_BASE}/hospitals/${hospitalId}`, updateData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

/**
 * Delete hospital
 * DELETE /api/hospitals/:id
 * Protected - requires admin authentication
 */
export const deleteHospital = (hospitalId, token) =>
  axios.delete(`${API_BASE}/hospitals/${hospitalId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

// #region AdminActions

/**
 * Verify hospital (Admin only)
 * POST /api/hospitals/:id/verify
 * Changes status from PENDING → VERIFIED
 * Creates audit log in HospitalAdminAction collection
 * 
 * @param {string} hospitalId
 * @param {string} adminId
 * @param {string} reason - Optional verification remarks
 * @param {string} token - Admin JWT token
 */
export const verifyHospital = (hospitalId, adminId, reason, token) =>
  axios.post(
    `${API_BASE}/hospitals/${hospitalId}/verify`,
    { adminId, reason },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );

/**
 * Reject hospital (Admin only)
 * POST /api/hospitals/:id/reject
 * Changes status from PENDING → REJECTED
 * Creates audit log in HospitalAdminAction collection
 * 
 * @param {string} hospitalId
 * @param {string} adminId
 * @param {string} reason - Required rejection reason
 * @param {string} token - Admin JWT token
 */
export const rejectHospital = (hospitalId, adminId, reason, token) =>
  axios.post(
    `${API_BASE}/hospitals/${hospitalId}/reject`,
    { adminId, reason },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );

/**
 * Suspend hospital (Admin only)
 * POST /api/hospitals/:id/suspend
 * Changes status from VERIFIED → SUSPENDED
 * Creates audit log in HospitalAdminAction collection
 * 
 * @param {string} hospitalId
 * @param {string} adminId
 * @param {string} reason - Required suspension reason
 * @param {string} token - Admin JWT token
 */
export const suspendHospital = (hospitalId, adminId, reason, token) =>
  axios.post(
    `${API_BASE}/hospitals/${hospitalId}/suspend`,
    { adminId, reason },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );

/**
 * Get hospital admin actions (audit log)
 * GET /api/hospitals/:id/actions?page=1&limit=10
 * Protected - requires admin authentication
 * Returns all admin actions for a specific hospital
 */
export const getHospitalActions = (hospitalId, page = 1, limit = 10, token) =>
  axios.get(`${API_BASE}/hospitals/${hospitalId}/actions`, {
    params: { page, limit },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

// #region Statistics

/**
 * Get hospital statistics
 * GET /api/hospitals/stats
 * Protected - requires admin authentication
 * Returns overall hospital statistics (total, verified, pending, etc.)
 */
export const getHospitalStats = (token) =>
  axios.get(`${API_BASE}/hospitals/stats`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

/**
 * Get hospitals count by city (Statistics)
 * GET /api/hospitals/stats/by-city
 * Protected - requires admin authentication
 * Returns hospital distribution by location
 */
export const getHospitalStatsByCity = (token) =>
  axios.get(`${API_BASE}/hospitals/stats/by-city`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

// #region HelperFunctions

/**
 * Get hospitals by verification status
 * Wrapper for getAllHospitals with status filter
 */
export const getHospitalsByStatus = (status, page = 1, limit = 10) =>
  getAllHospitals({ verificationStatus: status, page, limit });

/**
 * Get verified hospitals only
 * Commonly used for public-facing hospital lists
 */
export const getVerifiedHospitals = (page = 1, limit = 10) =>
  getHospitalsByStatus('VERIFIED', page, limit);

/**
 * Get pending hospitals (for admin approval queue)
 */
export const getPendingHospitals = (page = 1, limit = 10) =>
  getHospitalsByStatus('PENDING', page, limit);

/**
 * Get hospitals by city
 * Wrapper for getAllHospitals with city filter
 */
export const getHospitalsByCity = (city, page = 1, limit = 10) =>
  getAllHospitals({ city, page, limit });
