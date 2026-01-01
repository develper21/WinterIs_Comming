import { useState } from "react";
import { checkRegistrationStatus } from "../services/organizationApi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function RegistrationStatus() {
  const navigate = useNavigate();
  const [organizationCode, setOrganizationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState(null);
  const [error, setError] = useState("");

  const handleCheckStatus = async (e) => {
    e.preventDefault();
    
    if (!organizationCode.trim()) {
      setError("Organization code is required");
      return;
    }

    setLoading(true);
    setError("");
    setStatusData(null);

    try {
      const res = await checkRegistrationStatus(organizationCode);
      
      if (res.data.success) {
        setStatusData(res.data.data);
        toast.success("Status retrieved!");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to check status";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 border-green-300 text-green-800";
      case "PENDING":
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 border-red-300 text-red-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "APPROVED":
        return (
          <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case "PENDING":
        return (
          <svg className="w-12 h-12 text-yellow-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case "REJECTED":
        return (
          <svg className="w-12 h-12 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 p-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Registration Status</h1>
          <p className="text-blue-100">Check your organization registration status</p>
        </div>

        {/* Status Check Form */}
        <div className="bg-white rounded-lg shadow-2xl p-8 mb-8">
          <form onSubmit={handleCheckStatus} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Organization Code
              </label>
              <input
                type="text"
                value={organizationCode}
                onChange={(e) => {
                  setOrganizationCode(e.target.value);
                  setError("");
                }}
                placeholder="e.g., HOSP-DEL-001"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                You received this code when you registered
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Checking..." : "Check Status"}
            </button>
          </form>
        </div>

        {/* Status Display */}
        {statusData && (
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                {getStatusIcon(statusData.status)}
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {statusData.name}
              </h2>
              <p className={`inline-block px-6 py-2 rounded-full border-2 font-semibold text-lg ${getStatusColor(statusData.status)}`}>
                {statusData.status}
              </p>
            </div>

            {/* Status Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-xs text-gray-600 uppercase font-semibold mb-1">
                  Organization Code
                </p>
                <p className="text-lg font-bold text-gray-800 font-mono">
                  {statusData.organizationCode}
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-xs text-gray-600 uppercase font-semibold mb-1">
                  Registration Date
                </p>
                <p className="text-lg font-bold text-gray-800">
                  {new Date(statusData.registrationDate).toLocaleDateString()}
                </p>
              </div>

              {statusData.approvalDate && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-xs text-gray-600 uppercase font-semibold mb-1">
                    Approval Date
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    {new Date(statusData.approvalDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Status-Specific Messages */}
            {statusData.status === "APPROVED" && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-green-800 mb-2">
                  ✅ Congratulations! Your registration has been approved!
                </h3>
                <p className="text-green-700 mb-4">
                  Your organization is now active and ready to use the system. You can now login with your admin credentials.
                </p>
                <div className="bg-white rounded p-3 text-sm text-gray-700">
                  <p><strong>Login Instructions:</strong></p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Visit the login page</li>
                    <li>Organization Code: {statusData.organizationCode}</li>
                    <li>Use the admin email you provided during registration</li>
                    <li>Use the admin password you set</li>
                  </ul>
                </div>
              </div>
            )}

            {statusData.status === "PENDING" && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-yellow-800 mb-2">
                  ⏳ Your registration is pending review
                </h3>
                <p className="text-yellow-700">
                  Our superadmin team is reviewing your application. This typically takes 24-48 hours. Please check back later or refresh this page to see updates.
                </p>
              </div>
            )}

            {statusData.status === "REJECTED" && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-red-800 mb-2">
                  ❌ Your registration has been rejected
                </h3>
                <p className="text-red-700 mb-4">
                  Please contact the superadmin team for more information about why your application was rejected.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(statusData.organizationCode);
                  toast.success("Organization code copied!");
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Copy Code
              </button>
              {statusData.status === "APPROVED" && (
                <button
                  onClick={() => navigate("/login")}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Go to Login
                </button>
              )}
              <button
                onClick={() => {
                  setOrganizationCode("");
                  setStatusData(null);
                  setError("");
                }}
                className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Check Another Code
              </button>
            </div>
          </div>
        )}

        {/* Help Section */}
        {!statusData && (
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Need Help?</h3>
            <div className="space-y-4 text-gray-700">
              <div>
                <p className="font-semibold text-gray-800">Where to find your code:</p>
                <p>You received your Organization Code when you completed the registration form.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Registration Timeline:</p>
                <p>Applications are typically reviewed within 24-48 hours. You'll receive an email notification when your status changes.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Can't find your code?</p>
                <p>Contact our support team for assistance.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
