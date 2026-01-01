# Login Pages Setup - Superadmin vs Organization Users

## Two Separate Login Flows

Your application has two distinct login flows based on user type:

---

## 1️⃣ SUPERADMIN LOGIN (`/admin-login`)

**File:** `src/pages/AdminLogin.jsx`

### Purpose
Global administrator access to manage ALL organizations (Bloodbanks, NGOs, Hospitals)

### Required Fields
- **Email** - Superadmin email
- **Password** - Superadmin password (min 8 characters)

### API Endpoint
```
POST /api/admin/login
```

### Request Body
```json
{
  "email": "admin@platform.com",
  "password": "securePassword123"
}
```

### Response
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "admin": {
      "email": "admin@platform.com",
      "adminCode": "ADMIN-001",
      "name": "John Admin",
      "permissions": ["manage_all_orgs", "manage_users", ...],
      "_id": "admin_id"
    }
  }
}
```

### After Login
- Redirects to: `/admin/dashboard`
- Has access to: All organizations, users, blood stocks, etc.

### UI Theme
- **Color:** Purple gradient (distinct from organization users)
- **Icon:** Lock/Admin icon
- **Security Note:** Displayed to emphasize secure access

---

## 2️⃣ ORGANIZATION USER LOGIN (`/login`)

**File:** `src/pages/Login.jsx`

### Purpose
Login for organization-specific users (Admin or Staff within an organization)

### Required Fields
- **Organization Code** - Which organization they belong to (e.g., HOSP-DEL-001)
- **Email** - User email
- **Password** - User password (min 6 characters)

### API Endpoint
```
POST /api/auth/login
```

### Request Body
```json
{
  "organizationCode": "HOSP-DEL-001",
  "email": "doctor@hospital.com",
  "password": "password123"
}
```

### Response
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "userCode": "USER-001",
    "name": "Dr. Smith",
    "email": "doctor@hospital.com",
    "role": "ADMIN",
    "organizationCode": "HOSP-DEL-001",
    "organizationName": "Delhi Hospital",
    "organizationType": "HOSPITAL"
  }
}
```

### After Login
- Redirects based on role:
  - **ADMIN** → `/admin` (within organization)
  - **STAFF** → `/dashboard` (limited access)
  - **HOSPITAL** → `/hospital`
  - **NGO** → `/ngo/dashboard`
  - **BLOODBANK** → `/bloodbank`
- Has access to: Only their organization's data

### UI Theme
- **Color:** Blue gradient (standard user access)
- **Fields:** Three fields (org code + email + password)
- **Flexibility:** Links to organization registration

---

## Comparison Table

| Feature | Superadmin | Organization User |
|---------|-----------|-------------------|
| **Login Page** | `/admin-login` | `/login` |
| **File** | `AdminLogin.jsx` | `Login.jsx` |
| **Fields** | Email + Password | Org Code + Email + Password |
| **Min Password** | 8 characters | 6 characters |
| **API Endpoint** | `/api/admin/login` | `/api/auth/login` |
| **Access Level** | All organizations globally | Single organization only |
| **Role** | SUPERADMIN | ADMIN / STAFF |
| **Redirect** | `/admin/dashboard` | Org-specific dashboard |
| **Color Theme** | Purple | Blue |

---

## Implementation Checklist

- [x] Superadmin Login Page Created (`AdminLogin.jsx`)
- [x] Organization User Login Page Created (`Login.jsx`)
- [ ] Update Router to include both pages:
  ```jsx
  <Route path="/login" element={<Login />} />
  <Route path="/admin-login" element={<AdminLogin />} />
  ```
- [ ] Create login selection/home page linking to both
- [ ] Setup role-based routing/guards
- [ ] Test both login flows with backend

---

## Next Steps

1. **Update App.jsx or Router** to include the `/admin-login` route
2. **Create a landing/login selection page** that shows:
   - "Login as Organization User" → `/login`
   - "Superadmin Login" → `/admin-login`
3. **Setup AuthContext** to handle both superadmin and organization user tokens
4. **Create protected routes** that verify user type before allowing access
