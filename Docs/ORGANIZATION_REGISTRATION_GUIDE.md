# Organization Registration Flow - Frontend Setup Guide

## 📋 Complete Registration Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. ORGANIZATION REGISTRATION PAGE                               │
│    ├── Hospital/Blood Bank/NGO submits:                         │
│    │   ├── Organization Name                                    │
│    │   ├── Type (Hospital/Blood Bank/NGO)                      │
│    │   ├── Email & Phone                                        │
│    │   ├── Location (City, State)                              │
│    │   ├── License Number                                       │
│    │   ├── Admin Name & Email & Password                       │
│    │   └── Contact Person                                       │
│    └── Generates: organizationCode, registrationCode           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. STATUS: PENDING (Awaiting Superadmin Approval)              │
│    ├── Organization can check status with organizationCode     │
│    └── Superadmin reviews all pending applications             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. SUPERADMIN APPROVES (via Admin Dashboard)                    │
│    ├── Creates admin user account                               │
│    ├── Status changes to APPROVED                               │
│    └── Organization can now login                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. ORGANIZATION CAN LOGIN & ACCESS DASHBOARD                    │
│    └── Using organizationCode + admin credentials               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Frontend Folder Structure

Create this file structure in your Frontend:

```
Frontend/src/
├── pages/
│   ├── Login.jsx                              (existing)
│   ├── SuperAdminLogin.jsx                   (existing)
│   ├── Register.jsx                          (existing)
│   ├── OrganizationRegistration.jsx          ← CREATE THIS
│   ├── RegistrationStatus.jsx                ← CREATE THIS
│   ├── bloodbank/                            (existing)
│   ├── hospital/                             (existing)
│   └── ngo/                                  (existing)
└── services/
    ├── authApi.jsx                           (existing)
    └── organizationApi.jsx                   ← CREATE THIS
```

---

## 🔗 Backend API Endpoints

### 1. Organization Registration (Public)
```
POST /api/auth/org/register
Content-Type: application/json

{
  "organizationName": "Delhi Central Hospital",
  "type": "hospital",                        // hospital, bloodbank, or ngo
  "email": "hospital@example.com",
  "phone": "9876543210",
  "location": {
    "city": "Delhi",
    "state": "Delhi",
    "address": "123 Medical Lane",
    "pincode": "110001"
  },
  "licenseNumber": "LIC-2024-001",
  "contactPerson": "Dr. Singh",
  "adminName": "Admin User",
  "adminEmail": "admin@hospital.com",
  "adminPassword": "SecurePass123"            // Min 8 characters
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Organization registered successfully",
  "data": {
    "organizationCode": "HOSP-DEL-001",      // ← Save this!
    "registrationCode": "REG-2024-001",      // ← Save this!
    "name": "Delhi Central Hospital",
    "type": "hospital",
    "email": "hospital@example.com",
    "status": "PENDING"
  }
}
```

### 2. Check Registration Status (Public)
```
GET /api/auth/org/status/:organizationCode

Example: /api/auth/org/status/HOSP-DEL-001
```

**Response:**
```json
{
  "success": true,
  "message": "Status retrieved",
  "data": {
    "organizationCode": "HOSP-DEL-001",
    "name": "Delhi Central Hospital",
    "status": "PENDING",           // or "APPROVED" or "REJECTED"
    "registrationDate": "2024-12-29",
    "approvalDate": null
  }
}
```

### 3. Get Pending Organizations (Admin Only)
```
GET /api/auth/org/pending
Authorization: Bearer <superadmin_token>
```

### 4. Get All Organizations (Admin Only)
```
GET /api/auth/org/all
Authorization: Bearer <superadmin_token>
```

---

## 📝 Step 1: Create OrganizationApi Service

**File:** `Frontend/src/services/organizationApi.jsx`

```jsx
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// Register new organization
export const registerOrganization = (data) => 
  API_BASE.post(`${API_BASE}/auth/org/register`, data);

// Check registration status
export const checkRegistrationStatus = (organizationCode) =>
  axios.get(`${API_BASE}/auth/org/status/${organizationCode}`);

// Get pending organizations (Admin only)
export const getPendingOrganizations = (token) =>
  axios.get(`${API_BASE}/auth/org/pending`, {
    headers: { Authorization: `Bearer ${token}` }
  });

// Get all organizations (Admin only)
export const getAllOrganizations = (token) =>
  axios.get(`${API_BASE}/auth/org/all`, {
    headers: { Authorization: `Bearer ${token}` }
  });
```

---

## 🎨 Step 2: Create Organization Registration Page

**File:** `Frontend/src/pages/OrganizationRegistration.jsx`

- Multi-step form with 3 sections:
  1. **Organization Details** - Name, Type, Email, Phone, Location
  2. **License Information** - License Number
  3. **Admin Details** - Name, Email, Password

- Features:
  - Form validation
  - Error handling
  - Success notification with organizationCode
  - Option to check status

---

## 🔍 Step 3: Create Registration Status Checker Page

**File:** `Frontend/src/pages/RegistrationStatus.jsx`

- Input field for organizationCode
- Display current status: PENDING / APPROVED / REJECTED
- Show registration date and approval date (if approved)
- Allow checking status multiple times

---

## 🛣️ Step 4: Update App.jsx Routes

Add these routes:

```jsx
<Route path="/organization-registration" element={<OrganizationRegistration />} />
<Route path="/registration-status" element={<RegistrationStatus />} />
```

---

## 🔄 User Journey

### For Organizations:
```
1. Visit /organization-registration
2. Fill form (Organization + Admin details)
3. Submit → Get organizationCode
4. Save organizationCode
5. Visit /registration-status
6. Enter organizationCode to check status
7. Wait for Superadmin approval
8. Once APPROVED → Can login at /login with:
   - organizationCode
   - admin email
   - admin password
```

### For Superadmin:
```
1. Login at /superadmin-login
2. Go to Superadmin Dashboard
3. View pending organizations
4. Approve/Reject
5. On approval:
   - Admin user account created
   - Organization status → APPROVED
   - Organization can now login
```

---

## 📊 Data Flow

```
Organization Registration Form
    ↓
POST /api/auth/org/register
    ↓
Backend validates & creates org (status: PENDING)
    ↓
Returns organizationCode + registrationCode
    ↓
Organization saves codes
    ↓
Organization checks status via /api/auth/org/status/:code
    ↓
Superadmin approves (in dashboard)
    ↓
Status becomes APPROVED
    ↓
Organization can login at /login
```

---

## 📂 Required Frontend Files to Create

1. **`Frontend/src/pages/OrganizationRegistration.jsx`** - Registration form
2. **`Frontend/src/pages/RegistrationStatus.jsx`** - Status checker
3. **`Frontend/src/services/organizationApi.jsx`** - API service
4. Update **`Frontend/src/App.jsx`** - Add routes

---

## ✅ Implementation Checklist

- [ ] Create organizationApi.jsx service
- [ ] Create OrganizationRegistration.jsx component
- [ ] Create RegistrationStatus.jsx component
- [ ] Update App.jsx with new routes
- [ ] Test organization registration
- [ ] Test status checking
- [ ] Test superadmin approval workflow
- [ ] Verify organization can login after approval
