import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LandingPage from "./pages/LandingPage";
import OrganizationPage from "./pages/OrganizationPage";
import Login from "./pages/Login";
import DonorRegistration from "./pages/DonorRegistration";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import Register from "./pages/Register";
import OrganizationRegistration from "./pages/OrganizationRegistration";
import RegistrationStatus from "./pages/RegistrationStatus";
import BloodBankLayout from "./layouts/BloodBankLayout";
import DashboardOverview from "./pages/bloodbank/DashboardOverview";
import HospitalRequests from "./pages/bloodbank/HospitalRequests";
import NgoDrives from "./pages/bloodbank/NgoDrives";
import BloodStock from "./pages/bloodbank/BloodStock";
import AdminMessages from "./pages/bloodbank/AdminMessages";
import ProfileSettings from "./pages/bloodbank/ProfileSettings";
import HospitalLayout from "./layouts/HospitalLayout";
import HospitalOverview from "./pages/hospital/Overview";
import HospitalBloodRequests from "./pages/hospital/BloodRequests";
import HospitalNgoDrives from "./pages/hospital/NgoDrives";
import HospitalAdminVerification from "./pages/hospital/AdminVerification";
import HospitalProfile from "./pages/hospital/Profile";
import NgoLayout from "./layouts/NgoLayout";
import NgoOverview from "./pages/ngo/NgoDashboard";
import NgoCamps from "./pages/ngo/CampManagement";
import NgoSlots from "./pages/ngo/SlotManagement";
import NgoDonors from "./pages/ngo/DonorRegistry";
import NgoConnectivity from "./pages/ngo/ConnectivityGrid";
import ProtectedRoute from "./components/ProtectedRoute";

// #region RoutesManager
export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/organization" element={<OrganizationPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/donor-registration" element={<DonorRegistration />} />
        <Route path="/superadmin-login" element={<SuperAdminLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/organization-registration" element={<OrganizationRegistration />} />
        <Route path="/registration-status" element={<RegistrationStatus />} />

        {/* Blood Bank Dashboard - Protected Routes */}
        <Route
          path="/bloodbank"
          element={
            <ProtectedRoute allowedRoles={["bloodbank", "BLOODBANK","ADMIN"]}>
              <BloodBankLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/bloodbank/overview" replace />} />
          <Route path="overview" element={<DashboardOverview />} />
          <Route path="hospital-requests" element={<HospitalRequests />} />
          <Route path="ngo-drives" element={<NgoDrives />} />
          <Route path="blood-stock" element={<BloodStock />} />
          <Route path="admin-messages" element={<AdminMessages />} />
          <Route path="profile-settings" element={<ProfileSettings />} />
        </Route>

        {/* Hospital Dashboard - Protected Routes */}
        <Route
          path="/hospital"
          element={
            <ProtectedRoute allowedRoles={["hospital", "HOSPITAL","ADMIN","Doctor"]}>
              <HospitalLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/hospital/overview" replace />} />
          <Route path="overview" element={<HospitalOverview />} />
          <Route path="blood-requests" element={<HospitalBloodRequests />} />
          <Route path="ngo-drives" element={<HospitalNgoDrives />} />
          <Route path="admin" element={<HospitalAdminVerification />} />
          <Route path="profile" element={<HospitalProfile />} />
        </Route>

        {/* NGO Dashboard - Protected Routes */}
        <Route
          path="/ngo/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ngo", "NGO","ADMIN"]}>
              <NgoLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/ngo/dashboard/overview" replace />} />
          <Route path="overview" element={<NgoOverview />} />
          <Route path="camps" element={<NgoCamps />} />
          <Route path="slots" element={<NgoSlots />} />
          <Route path="donors" element={<NgoDonors />} />
          <Route path="connectivity" element={<NgoConnectivity />} />
        </Route>

        {/* Superadmin Dashboard - Placeholder */}
        <Route
          path="/superadmin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
              <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-gray-800 mb-4">Superadmin Dashboard</h1>
                  <p className="text-gray-600">Coming soon...</p>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
