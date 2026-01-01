import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// #region AxiosConfig
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// #region TokenInterceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// #region BloodBankRoutes

/**
 * Get all blood banks
 * GET /api/admin/bloodbanks/all
 */
export const getAllBloodBanks = () => api.get("/admin/bloodbanks/all");

/**
 * Get blood bank by ID
 * GET /api/admin/bloodbanks/id/:id
 */
export const getBloodBankById = (id) => api.get(`/admin/bloodbanks/id/${id}`);

/**
 * Get blood bank by organization code
 * GET /api/admin/bloodbanks/code/:organizationCode
 */
export const getBloodBankByCode = (organizationCode) =>
  api.get(`/admin/bloodbanks/code/${organizationCode}`);

/**
 * Get blood banks by status
 * GET /api/admin/bloodbanks/status/:status
 */
export const getBloodBanksByStatus = (status) =>
  api.get(`/admin/bloodbanks/status/${status}`);

/**
 * Get blood stock for a blood bank
 * GET /api/admin/bloodbanks/:id/stock
 */
export const getBloodStock = (id) => api.get(`/admin/bloodbanks/${id}/stock`);

/**
 * Update blood stock
 * PUT /api/admin/bloodbanks/:id/stock
 */
export const updateBloodStock = (id, stockData) =>
  api.put(`/admin/bloodbanks/${id}/stock`, stockData);

/**
 * Update blood bank details
 * PUT /api/admin/bloodbanks/:id
 */
export const updateBloodBank = (id, data) =>
  api.put(`/admin/bloodbanks/${id}`, data);

/**
 * Get location statistics
 * GET /api/admin/bloodbanks/stats/location
 */
export const getLocationStats = () => api.get("/admin/bloodbanks/stats/location");

/**
 * Get verified blood banks (for dropdown selection)
 * GET /api/admin/bloodbanks/status/VERIFIED
 */
export const getVerifiedBloodBanks = () => 
  api.get("/admin/bloodbanks/status/VERIFIED");

// #region OrganizationRoutes

/**
 * Get organization by code
 * GET /api/auth/org/status/:organizationCode
 */
export const getOrganizationByCode = (organizationCode) =>
  api.get(`/auth/org/status/${organizationCode}`);

// #region NgoDrivesRoutes

/**
 * Get all NGO drives
 * GET /api/admin/drives/all
 */
export const getAllNgoDrives = () => api.get("/admin/drives/all");

/**
 * Get NGO drive by ID
 * GET /api/admin/drives/:id
 */
export const getNgoDriveById = (id) => api.get(`/admin/drives/${id}`);

/**
 * Get drives by blood bank
 * GET /api/admin/drives/bloodbank/:bloodBankId
 */
export const getDrivesByBloodBank = (bloodBankId) =>
  api.get(`/admin/drives/bloodbank/${bloodBankId}`);

/**
 * Get drives by NGO
 * GET /api/admin/drives/ngo/:ngoId
 */
export const getDrivesByNgo = (ngoId) => api.get(`/admin/drives/ngo/${ngoId}`);

/**
 * Get drives by status
 * GET /api/admin/drives/status/:status
 */
export const getDrivesByStatus = (status) =>
  api.get(`/admin/drives/status/${status}`);

/**
 * Create new NGO drive
 * POST /api/admin/drives/create
 */
export const createNgoDrive = (driveData) =>
  api.post("/admin/drives/create", driveData);

/**
 * Update NGO drive
 * PUT /api/admin/drives/:id
 */
export const updateNgoDrive = (id, driveData) =>
  api.put(`/admin/drives/${id}`, driveData);

/**
 * Update drive status
 * PATCH /api/admin/drives/:id/status
 */
export const updateDriveStatus = (id, status) =>
  api.patch(`/admin/drives/${id}/status`, { status });

/**
 * Delete NGO drive
 * DELETE /api/admin/drives/:id
 */
export const deleteNgoDrive = (id) => api.delete(`/admin/drives/${id}`);

// #region HospitalRequestsRoutes

/**
 * Get all hospital requests
 * GET /api/admin/requests/all
 */
export const getAllHospitalRequests = () => api.get("/admin/requests/all");

/**
 * Get hospital request by ID
 * GET /api/admin/requests/:id
 */
export const getHospitalRequestById = (id) => api.get(`/admin/requests/${id}`);

/**
 * Get requests by blood bank
 * GET /api/admin/requests/bloodbank/:bloodBankId
 */
export const getRequestsByBloodBank = (bloodBankId) =>
  api.get(`/admin/requests/bloodbank/${bloodBankId}`);

/**
 * Get requests by hospital
 * GET /api/admin/requests/hospital/:hospitalId
 */
export const getRequestsByHospital = (hospitalId) =>
  api.get(`/admin/requests/hospital/${hospitalId}`);

/**
 * Get requests by status
 * GET /api/admin/requests/status/:status
 */
export const getRequestsByStatus = (status) =>
  api.get(`/admin/requests/status/${status}`);

/**
 * Create new hospital request
 * POST /api/admin/requests/create
 */
export const createHospitalRequest = (requestData) =>
  api.post("/admin/requests/create", requestData);

/**
 * Update hospital request
 * PUT /api/admin/requests/:id
 */
export const updateHospitalRequest = (id, requestData) =>
  api.put(`/admin/requests/${id}`, requestData);

/**
 * Update request status
 * PATCH /api/admin/requests/:id/status
 */
export const updateRequestStatus = (id, status, responseNote) =>
  api.patch(`/admin/requests/${id}/status`, { status, responseNote });

/**
 * Delete hospital request
 * DELETE /api/admin/requests/:id
 */
export const deleteHospitalRequest = (id) => api.delete(`/admin/requests/${id}`);

// #region DashboardRoutes

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard/stats
 */
export const getDashboardStats = () => api.get("/admin/dashboard/stats");

/**
 * Get blood bank specific dashboard stats
 * GET /api/admin/dashboard/bloodbank/:bloodBankId
 */
export const getBloodBankDashboardStats = (bloodBankId) =>
  api.get(`/admin/dashboard/bloodbank/${bloodBankId}`);

/**
 * Get recent activities
 * GET /api/admin/dashboard/activities
 */
export const getRecentActivities = () => api.get("/admin/dashboard/activities");

/**
 * Get alerts
 * GET /api/admin/alerts
 */
export const getAlerts = () => api.get("/admin/alerts");

export default api;
