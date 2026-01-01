import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// #region BloodRequestCrud

/**
 * Create a new blood request
 * POST /api/hospital-blood-requests
 * Hospital creates a request to a blood bank
 * 
 * @param {Object} requestData - { hospitalId, bloodBankId, bloodGroup, units, urgency, purpose, requiredBy }
 * @param {string} token - Hospital JWT token
 */
export const createBloodRequest = (requestData, token) =>
  axios.post(`${API_BASE}/hospital-blood-requests`, requestData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

/**
 * Get blood request by ID
 * GET /api/hospital-blood-requests/:id
 * 
 * @param {string} requestId
 * @param {string} token - Hospital/Blood Bank JWT token
 */
export const getBloodRequestById = (requestId, token) =>
  axios.get(`${API_BASE}/hospital-blood-requests/${requestId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

/**
 * Update blood request
 * PUT /api/hospital-blood-requests/:id
 * Hospital can update their request
 * 
 * @param {string} requestId
 * @param {Object} updateData
 * @param {string} token - Hospital JWT token
 */
export const updateBloodRequest = (requestId, updateData, token) =>
  axios.put(`${API_BASE}/hospital-blood-requests/${requestId}`, updateData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

/**
 * Delete blood request
 * DELETE /api/hospital-blood-requests/:id
 * 
 * @param {string} requestId
 * @param {string} token - Hospital JWT token
 */
export const deleteBloodRequest = (requestId, token) =>
  axios.delete(`${API_BASE}/hospital-blood-requests/${requestId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

// #region HospitalEndpoints

/**
 * Get all blood requests by hospital
 * GET /api/hospital-blood-requests/hospital/:hospitalId?status=PENDING&urgency=CRITICAL&bloodGroup=O+&page=1&limit=10
 * 
 * @param {string} hospitalId
 * @param {Object} filters - { status, urgency, bloodGroup, page, limit }
 * @param {string} token - Hospital JWT token
 */
export const getHospitalBloodRequests = (hospitalId, filters = {}, token) => {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.urgency) params.append('urgency', filters.urgency);
  if (filters.bloodGroup) params.append('bloodGroup', filters.bloodGroup);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);

  return axios.get(
    `${API_BASE}/hospital-blood-requests/hospital/${hospitalId}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
};

/**
 * Get blood request statistics for a hospital
 * GET /api/hospital-blood-requests/hospital/:hospitalId/stats
 * 
 * @param {string} hospitalId
 * @param {string} token - Hospital JWT token
 */
export const getHospitalRequestStats = (hospitalId, token) =>
  axios.get(`${API_BASE}/hospital-blood-requests/hospital/${hospitalId}/stats`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

// #region BloodBankEndpoints

/**
 * Get all blood requests by blood bank
 * GET /api/hospital-blood-requests/bloodbank/:bloodBankId?status=PENDING&urgency=CRITICAL&page=1&limit=10
 * 
 * @param {string} bloodBankId
 * @param {Object} filters - { status, urgency, page, limit }
 * @param {string} token - Blood Bank JWT token
 */
export const getBloodBankRequests = (bloodBankId, filters = {}, token) => {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.urgency) params.append('urgency', filters.urgency);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);

  return axios.get(
    `${API_BASE}/hospital-blood-requests/bloodbank/${bloodBankId}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
};

/**
 * Get blood request statistics for a blood bank
 * GET /api/hospital-blood-requests/bloodbank/:bloodBankId/stats
 * 
 * @param {string} bloodBankId
 * @param {string} token - Blood Bank JWT token
 */
export const getBloodBankRequestStats = (bloodBankId, token) =>
  axios.get(`${API_BASE}/hospital-blood-requests/bloodbank/${bloodBankId}/stats`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

/**
 * Accept blood request (Blood Bank action)
 * POST /api/hospital-blood-requests/:id/accept
 * Changes status from PENDING → ACCEPTED
 * 
 * @param {string} requestId
 * @param {Object} data - { acceptedBy, remarks }
 * @param {string} token - Blood Bank JWT token
 */
export const acceptBloodRequest = (requestId, data, token) =>
  axios.post(`${API_BASE}/hospital-blood-requests/${requestId}/accept`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

/**
 * Reject blood request (Blood Bank action)
 * POST /api/hospital-blood-requests/:id/reject
 * Changes status from PENDING → REJECTED
 * 
 * @param {string} requestId
 * @param {Object} data - { rejectedBy, rejectionReason }
 * @param {string} token - Blood Bank JWT token
 */
export const rejectBloodRequest = (requestId, data, token) =>
  axios.post(`${API_BASE}/hospital-blood-requests/${requestId}/reject`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

/**
 * Complete blood request
 * POST /api/hospital-blood-requests/:id/complete
 * Changes status to COMPLETED
 * 
 * @param {string} requestId
 * @param {Object} data - { completedBy, remarks }
 * @param {string} token - Hospital/Blood Bank JWT token
 */
export const completeBloodRequest = (requestId, data, token) =>
  axios.post(`${API_BASE}/hospital-blood-requests/${requestId}/complete`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

// #region CriticalRequests

/**
 * Get critical/urgent blood requests
 * GET /api/hospital-blood-requests/critical?hospitalId=xxx&bloodBankId=xxx
 * 
 * @param {Object} filters - { hospitalId, bloodBankId }
 * @param {string} token - Hospital/Blood Bank JWT token
 */
export const getCriticalBloodRequests = (filters = {}, token) => {
  const params = new URLSearchParams();
  
  if (filters.hospitalId) params.append('hospitalId', filters.hospitalId);
  if (filters.bloodBankId) params.append('bloodBankId', filters.bloodBankId);

  return axios.get(`${API_BASE}/hospital-blood-requests/critical?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

// #region HelperFunctions

/**
 * Get pending blood requests for a hospital
 */
export const getPendingHospitalRequests = (hospitalId, token) =>
  getHospitalBloodRequests(hospitalId, { status: 'PENDING' }, token);

/**
 * Get accepted blood requests for a hospital
 */
export const getAcceptedHospitalRequests = (hospitalId, token) =>
  getHospitalBloodRequests(hospitalId, { status: 'ACCEPTED' }, token);

/**
 * Get completed blood requests for a hospital
 */
export const getCompletedHospitalRequests = (hospitalId, token) =>
  getHospitalBloodRequests(hospitalId, { status: 'COMPLETED' }, token);

/**
 * Get critical blood requests for a hospital
 */
export const getCriticalHospitalRequests = (hospitalId, token) =>
  getHospitalBloodRequests(hospitalId, { urgency: 'CRITICAL' }, token);
