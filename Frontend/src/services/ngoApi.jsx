import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// #region AuthToken
const getAuthToken = () => {
  const token = localStorage.getItem("token");
  console.log("[NGO_API] Token from localStorage:", token ? "Found" : "Not found");
  return token;
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  if (!token) {
    console.warn("[NGO_API] No token available, requests will fail");
  }
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json"
    }
  };
};

// #region CampEndpoints

/**
 * Create a new camp
 * POST /api/ngo/camp
 * Protected - requires NGO token
 */
export const createCamp = (campData) => {
  return axios.post(`${API_BASE}/ngo/camp`, campData, getAuthHeaders());
};

/**
 * Get all camps for NGO
 * GET /api/ngo/camp
 * Protected - requires NGO token
 */
export const getMyCamps = () => {
  return axios.get(`${API_BASE}/ngo/camp`, getAuthHeaders());
};

/**
 * Update a camp
 * PUT /api/ngo/camp/:campId
 * Protected - requires NGO token
 */
export const updateCamp = (campId, campData) => {
  return axios.put(`${API_BASE}/ngo/camp/${campId}`, campData, getAuthHeaders());
};

/**
 * Delete a camp
 * DELETE /api/ngo/camp/:campId
 * Protected - requires NGO token
 */
export const deleteCamp = (campId) => {
  return axios.delete(`${API_BASE}/ngo/camp/${campId}`, getAuthHeaders());
};

// #region SlotEndpoints

/**
 * Create a new slot
 * POST /api/ngo/slot
 * Protected - requires NGO or ADMIN token
 */
export const createSlot = (slotData) => {
  return axios.post(`${API_BASE}/ngo/slot`, slotData, getAuthHeaders());
};

/**
 * Get all slots for a camp
 * GET /api/ngo/camp/:campId/slots
 * Protected - requires token
 */
export const getCampSlots = (campId) => {
  return axios.get(`${API_BASE}/ngo/camp/${campId}/slots`, getAuthHeaders());
};

/**
 * Update a slot
 * PUT /api/ngo/slot/:slotId
 * Protected - requires NGO or ADMIN token
 */
export const updateSlot = (slotId, slotData) => {
  return axios.put(`${API_BASE}/ngo/slot/${slotId}`, slotData, getAuthHeaders());
};

/**
 * Delete a slot
 * DELETE /api/ngo/slot/:slotId
 * Protected - requires NGO or ADMIN token
 */
export const deleteSlot = (slotId) => {
  return axios.delete(`${API_BASE}/ngo/slot/${slotId}`, getAuthHeaders());
};

/**
 * Get all donors registered in camps
 * GET /api/ngo/donors
 * Protected - requires NGO token
 */
export const getNgoDonors = () => {
  return axios.get(`${API_BASE}/ngo/donors`, getAuthHeaders());
};
