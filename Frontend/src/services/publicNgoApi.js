import axios from "axios";

const API_BASE = "http://localhost:5000/api";

/**
 * Get all NGOs
 * GET /api/public-ngos
 * 
 * @param {Object} filters - { verificationStatus, city, state, page, limit }
 */
export const getAllNgos = (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.verificationStatus) params.append('verificationStatus', filters.verificationStatus);
    if (filters.city) params.append('city', filters.city);
    if (filters.state) params.append('state', filters.state);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    return axios.get(`${API_BASE}/public-ngos?${params.toString()}`);
};

/**
 * Get all VERIFIED/APPROVED NGOs (for dropdown selection)
 * GET /api/public-ngos/verified
 */
export const getVerifiedNgos = () => {
    return axios.get(`${API_BASE}/public-ngos/verified`);
};

/**
 * Get NGO by ID
 * GET /api/public-ngos/:id
 * 
 * @param {string} ngoId
 */
export const getNgoById = (ngoId) => {
    return axios.get(`${API_BASE}/public-ngos/${ngoId}`);
};
