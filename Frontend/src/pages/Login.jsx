import { useState } from "react";
import { loginUser } from "../services/authApi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    organizationCode: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
        // Redirect based on organization type user belongs to
        setTimeout(() => {
          const orgType = user.organizationType
            ? user.organizationType.toLowerCase()
            : "";
          console.log("Redirecting based on organization type:", orgType);

          if (orgType === "hospital") {
            navigate("/hospital");
          } else if (orgType === "blood_bank" || orgType === "bloodbank") {
            navigate("/bloodbank");
          } else if (orgType === "ngo") {
            navigate("/ngo/dashboard");
          } else {
            console.log("Unknown organization type:", orgType);
            navigate("/login");
          }
        }, 500);
      }
    } catch (err) {
      console.error("Login error:", err);

      // Handle validation errors from backend
      if (
        err.response?.data?.errors &&
        Array.isArray(err.response.data.errors)
      ) {
        setErrors(err.response.data.errors);
      } else {
        setErrors([
          err.response?.data?.message || "Login failed. Please try again.",
        ]);
      }

      toast.error(err.response?.data?.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-500/20 blur-3xl rounded-full"></div>

        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/20 blur-3xl rounded-full"></div>

        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-pink-500/10 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        {/* LEFT SIDE */}
        <div className="hidden lg:flex flex-col justify-center px-16 xl:px-24">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-10">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/40 blur-2xl rounded-full"></div>

              <img
                src="./public/favicon_io/favicon.ico"
                alt="BloodBridge"
                className="relative w-16 h-16 object-contain"
              />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-white">BloodBridge</h2>

              <p className="text-gray-400">Connect. Donate. Save lives.</p>
            </div>
          </div>

          {/* Big Heading */}
          <h1 className="text-6xl xl:text-7xl font-black leading-tight">
            <span className="bg-gradient-to-r from-red-400 via-pink-400 to-red-300 bg-clip-text text-transparent">
              Smarter
            </span>

            <br />

            <span className="text-white">Healthcare</span>

            <br />

            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Coordination
            </span>
          </h1>

          {/* Description */}
          <p className="mt-8 text-xl leading-relaxed text-gray-400 max-w-xl">
            Manage blood requests, donor coordination, emergency response, and
            healthcare collaboration through one modern platform built for
            hospitals, NGOs, and blood banks.
          </p>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
              <div className="text-3xl font-bold text-white">50K+</div>

              <div className="text-sm text-gray-400 mt-2">Active Donors</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
              <div className="text-3xl font-bold text-white">1K+</div>

              <div className="text-sm text-gray-400 mt-2">Organizations</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
              <div className="text-3xl font-bold text-white">24/7</div>

              <div className="text-sm text-gray-400 mt-2">Emergency Access</div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex flex-col items-center mb-10">
              <img
                src="./public/favicon_io/favicon.ico"
                alt="BloodBridge"
                className="w-16 h-16 mb-4"
              />

              <h2 className="text-3xl font-bold text-white">BloodBridge</h2>
            </div>

            {/* Login Card */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl p-8 sm:p-10">
              {/* Card Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

              <div className="relative z-10">
                {/* Heading */}
                <div className="mb-8">
                  <h2 className="text-4xl font-bold text-white mb-3">
                    Welcome Back
                  </h2>

                  <p className="text-gray-400">
                    Login to access your organization dashboard
                  </p>
                </div>

                {/* Errors */}
                {errors.length > 0 && (
                  <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                    {errors.map((error, idx) => (
                      <p key={idx} className="text-sm text-red-300">
                        {error}
                      </p>
                    ))}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Organization Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Organization Code
                    </label>

                    <input
                      type="text"
                      name="organizationCode"
                      placeholder="e.g. HOSP-DEL-001"
                      value={formData.organizationCode}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-500 outline-none transition-all duration-300 focus:border-red-500 focus:bg-white/10"
                    />

                    <p className="mt-2 text-xs text-gray-500">
                      Your unique organization identifier
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>

                    <input
                      type="email"
                      name="email"
                      placeholder="your.email@organization.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-500 outline-none transition-all duration-300 focus:border-red-500 focus:bg-white/10"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <lable className="block text-sm font-medium text-gray-300 mb-2">
                      <div className="relative">
                        <input
                          types={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={handleChange}
                          disabled={loading}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-5 pr-14 text-white placeholder:text-gray-500 outline-none transition-all duration-300 focus:border-red-500 focus:bg-white/10"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-white transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        Minimum 6 characters
                      </p>
                    </lable>
                  </div>

                  {/* Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 py-4 font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-500/30 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                        Logging in...
                      </div>
                    ) : (
                      "Login"
                    )}
                  </button>
                </form>

                {/* Register */}
                <div className="mt-8 border-t border-white/10 pt-6">
                  <p className="text-center text-sm text-gray-400">
                    Don't have an account?{" "}
                    <button
                      onClick={() => navigate("/register")}
                      className="font-semibold text-red-400 hover:text-red-300 transition-colors"
                    >
                      Register here
                    </button>
                  </p>
                </div>

                {/* Bottom Note */}
                <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                  <p className="text-xs leading-relaxed text-blue-200">
                    <strong>Note:</strong> Use the organization code provided by
                    your administrator along with your credentials to login.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
