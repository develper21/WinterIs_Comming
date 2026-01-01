import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// #region NgoDriveCrud

/**
 * Create a new donation drive request
 * POST /api/hospital-ngo-drives
 * Hospital creates a request to an NGO for a donation drive
 * 
 * @param {Object} driveData - { hospitalId, ngoId, driveName, driveDate, expectedDonors, purpose }
 * @param {string} token - Hospital JWT token
 */
export const createNgoDrive = (driveData, token) =>
  axios.post(`${API_BASE}/hospital-ngo-drives`, driveData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

/**
 * Get NGO drive by ID
 * GET /api/hospital-ngo-drives/:id
 * 
 * @param {string} driveId
 * @param {string} token - Hospital/NGO JWT token
 */
export const getNgoDriveById = (driveId, token) =>
  axios.get(`${API_BASE}/hospital-ngo-drives/${driveId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

/**
 * Update NGO drive
 * PUT /api/hospital-ngo-drives/:id
 * Hospital can update their drive request
 * 
 * @param {string} driveId
 * @param {Object} updateData
 * @param {string} token - Hospital JWT token
 */
export const updateNgoDrive = (driveId, updateData, token) =>
  axios.put(`${API_BASE}/hospital-ngo-drives/${driveId}`, updateData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

/**
 * Delete NGO drive
 * DELETE /api/hospital-ngo-drives/:id
 * 
 * @param {string} driveId
 * @param {string} token - Hospital JWT token
 */
export const deleteNgoDrive = (driveId, token) =>
  axios.delete(`${API_BASE}/hospital-ngo-drives/${driveId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

// #region HospitalEndpoints

/**
 * Get all NGO drives by hospital
 * GET /api/hospital-ngo-drives/hospital/:hospitalId?status=PENDING&page=1&limit=10
 * 
 * @param {string} hospitalId
 * @param {Object} filters - { status, page, limit }
 * @param {string} token - Hospital JWT token
 */
export const getHospitalNgoDrives = (hospitalId, filters = {}, token) => {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);

  return axios.get(
    `${API_BASE}/hospital-ngo-drives/hospital/${hospitalId}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
};

/**
 * Get upcoming NGO drives for a hospital
 * GET /api/hospital-ngo-drives/hospital/:hospitalId/upcoming
 * 
 * @param {string} hospitalId
 * @param {string} token - Hospital JWT token
 */
export const getUpcomingHospitalDrives = (hospitalId, token) =>
  axios.get(`${API_BASE}/hospital-ngo-drives/hospital/${hospitalId}/upcoming`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

/**
 * Get NGO drive statistics for a hospital
 * GET /api/hospital-ngo-drives/hospital/:hospitalId/stats
 * 
 * @param {string} hospitalId
 * @param {string} token - Hospital JWT token
 */
export const getHospitalDriveStats = (hospitalId, token) =>
  axios.get(`${API_BASE}/hospital-ngo-drives/hospital/${hospitalId}/stats`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

// #region NgoEndpoints

/**
 * Get all drives by NGO
 * GET /api/hospital-ngo-drives/ngo/:ngoId?status=PENDING&page=1&limit=10
 * 
 * @param {string} ngoId
 * @param {Object} filters - { status, page, limit }
 * @param {string} token - NGO JWT token
 */
export const getNgoDrives = (ngoId, filters = {}, token) => {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);

  return axios.get(
    `${API_BASE}/hospital-ngo-drives/ngo/${ngoId}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
};

/**
 * Get NGO drive statistics for an NGO
 * GET /api/hospital-ngo-drives/ngo/:ngoId/stats
 * 
 * @param {string} ngoId
 * @param {string} token - NGO JWT token
 */
export const getNgoDriveStats = (ngoId, token) =>
  axios.get(`${API_BASE}/hospital-ngo-drives/ngo/${ngoId}/stats`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

/**
 * Accept drive (NGO action)
 * POST /api/hospital-ngo-drives/:id/accept
 * Changes status from PENDING → ACCEPTED
 * 
 * @param {string} driveId
 * @param {Object} data - { acceptedBy, remarks }
 * @param {string} token - NGO JWT token
 */
export const acceptNgoDrive = (driveId, data, token) =>
  axios.post(`${API_BASE}/hospital-ngo-drives/${driveId}/accept`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

/**
 * Reject drive (NGO action)
 * POST /api/hospital-ngo-drives/:id/reject
 * Changes status from PENDING → REJECTED
 * 
 * @param {string} driveId
 * @param {Object} data - { rejectedBy, rejectionReason }
 * @param {string} token - NGO JWT token
 */
export const rejectNgoDrive = (driveId, data, token) =>
  axios.post(`${API_BASE}/hospital-ngo-drives/${driveId}/reject`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

/**
 * Complete drive
 * POST /api/hospital-ngo-drives/:id/complete
 * Changes status to COMPLETED
 * 
 * @param {string} driveId
 * @param {Object} data - { completedBy, actualDonors, remarks }
 * @param {string} token - Hospital/NGO JWT token
 */
export const completeNgoDrive = (driveId, data, token) =>
  axios.post(`${API_BASE}/hospital-ngo-drives/${driveId}/complete`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

// #region HelperFunctions

/**
 * Get pending NGO drives for a hospital
 */
export const getPendingHospitalDrives = (hospitalId, token) =>
  getHospitalNgoDrives(hospitalId, { status: 'PENDING' }, token);

/**
 * Get accepted NGO drives for a hospital
 */
export const getAcceptedHospitalDrives = (hospitalId, token) =>
  getHospitalNgoDrives(hospitalId, { status: 'ACCEPTED' }, token);

/**
 * Get completed NGO drives for a hospital
 */
export const getCompletedHospitalDrives = (hospitalId, token) =>
  getHospitalNgoDrives(hospitalId, { status: 'COMPLETED' }, token);

/**
 * Get pending drives for an NGO (for NGO approval queue)
 */
export const getPendingNgoDrives = (ngoId, token) =>
  getNgoDrives(ngoId, { status: 'PENDING' }, token);

/**
 * Get accepted drives for an NGO
 */
export const getAcceptedNgoDrives = (ngoId, token) =>
  getNgoDrives(ngoId, { status: 'ACCEPTED' }, token);
