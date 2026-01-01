import { useState } from "react";
import { loginUser } from "../services/authApi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    organizationCode: "",
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
      if (!formData.organizationCode.trim()) {
        setErrors(["Organization code is required"]);
        setLoading(false);
        return;
      }
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

      // Call login API with organization code, email, and password
      const res = await loginUser(formData);

      // Backend returns: { success, message, token, user: { userCode, role, email, name, organizationCode, organizationType, ... } }
      if (res.data.success) {
        const { token, user } = res.data;

        // ✅ SAVE AUTH DATA using AuthContext
        login(user, token);

        toast.success("Login successful! Redirecting...");

        // 🔀 ORGANIZATION TYPE REDIRECT
        // Redirect based on the organization type the user belongs to
        setTimeout(() => {
          const orgType = user.organizationType ? user.organizationType.toLowerCase() : "";
          if (orgType === "hospital") {
            navigate("/hospital");
          } else if (orgType === "bloodbank") {
            navigate("/bloodbank");
          } else if (orgType === "ngo") {
            navigate("/ngo/dashboard");
          } else {
            navigate("/login");
          }
        }, 500);
      }

    } catch (err) {
      console.error("Login error:", err);
      
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
              Organization Login
            </h1>
            <p className="text-center text-gray-600 text-sm">
              Login to access your organization dashboard
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
            
            {/* Organization Code Input */}
            <div>
              <label htmlFor="organizationCode" className="block text-sm font-semibold text-gray-700 mb-2">
                Organization Code
              </label>
              <input
                id="organizationCode"
                type="text"
                name="organizationCode"
                placeholder="e.g., HOSP-DEL-001"
                value={formData.organizationCode}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your unique organization identifier
              </p>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="your.email@organization.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 6 characters
              </p>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg mt-6"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Logging in...</span>
                </div>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition"
              >
                Register here
              </button>
            </p>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> Use the organization code provided by your administrator along with your credentials to login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
