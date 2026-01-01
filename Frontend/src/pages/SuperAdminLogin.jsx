import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      // Validate inputs
      if (!formData.email.trim()) {
        setErrors(["Email is required"]);
        setLoading(false);
        return;
      }
      if (!formData.password) {
        setErrors(["Password is required"]);
        setLoading(false);
        return;
      }

      // Call superadmin login API
      const res = await axios.post("http://localhost:5000/api/superadmin/auth/login", formData);

      // Backend returns: { success, message, data: { token, admin: { email, adminCode, name, permissions, ... } } }
      if (res.data.success) {
        const { token, admin } = res.data.data;

        // ✅ SAVE AUTH DATA using AuthContext
        const adminData = {
          ...admin,
          role: "SUPERADMIN", // Mark as superadmin
          isSuperAdmin: true
        };
        login(adminData, token);

        toast.success("Superadmin login successful! Redirecting...");

        // 🔀 REDIRECT TO ADMIN DASHBOARD
        setTimeout(() => {
          navigate("/superadmin/dashboard");
        }, 500);
      }

    } catch (err) {
      console.error("Admin login error:", err);
      
      // Handle validation errors from backend
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        setErrors(err.response.data.errors);
      } else {
        setErrors([err.response?.data?.message || "Login failed. Please try again."]);
      }
      
      toast.error(err.response?.data?.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 to-purple-900 p-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-purple-600 text-white p-3 rounded-full">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
              Superadmin Login
            </h1>
            <p className="text-center text-gray-600 text-sm">
              Global administrator access to manage all organizations
            </p>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  {errors.map((error, idx) => (
                    <p key={idx} className="text-red-600 text-sm font-medium">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="admin@platform.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 8 characters for security
              </p>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg mt-6"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Logging in...</span>
                </div>
              ) : (
                "Login as Superadmin"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Organization user?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-purple-600 font-semibold hover:text-purple-700 hover:underline transition"
              >
                Login here
              </button>
            </p>
          </div>

          {/* Security Info Box */}
          <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex gap-2">
              <svg className="w-5 h-5 text-purple-700 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-purple-700">
                <strong>Secure Area:</strong> This account has global access to all organizations. Keep credentials safe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
