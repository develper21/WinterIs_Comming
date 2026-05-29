import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Crown,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Clock3,
} from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      const res = await axios.post(
        "http://localhost:5000/api/superadmin/auth/login",
        formData,
      );

      // Backend returns: { success, message, data: { token, admin: { email, adminCode, name, permissions, ... } } }
      if (res.data.success) {
        const { token, admin } = res.data.data;

        // ✅ SAVE AUTH DATA using AuthContext
        const adminData = {
          ...admin,
          role: "SUPERADMIN", // Mark as superadmin
          isSuperAdmin: true,
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
    <div className="min-h-screen overflow-hidden bg-[#070816] text-white relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 h-[420px] w-[420px] rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute top-20 right-0 h-[420px] w-[420px] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        {/* LEFT SIDE */}
        <div className="hidden lg:flex flex-col justify-center px-16 xl:px-24">
          <div className="flex items-center gap-4 mb-10">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-violet-500/30 blur-2xl" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-2xl shadow-violet-500/20">
                <Crown className="h-7 w-7 text-white" />
              </div>
            </div>

            <div className="leading-tight">
              <h2 className="text-3xl font-black tracking-tight text-white">
                BloodBridge
              </h2>
              <p className="text-sm text-gray-400">Superadmin control center</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-300 w-fit mb-8">
            <Sparkles className="h-4 w-4" />
            Restricted administrative access
          </div>

          <h1 className="text-6xl xl:text-7xl font-black leading-tight">
            <span className="text-white">Global</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              Superadmin
            </span>
            <br />
            <span className="text-white">Dashboard</span>
          </h1>

          <p className="mt-8 max-w-xl text-xl leading-relaxed text-gray-400">
            Manage organizations, review approvals, monitor platform activity,
            and keep the BloodBridge ecosystem secure from one centralized admin
            gateway.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-5 max-w-2xl">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="text-3xl font-black text-white">Secure</div>
              <div className="mt-2 text-sm text-gray-400">Admin access</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="text-3xl font-black text-white">Live</div>
              <div className="mt-2 text-sm text-gray-400">Oversight tools</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="text-3xl font-black text-white">24/7</div>
              <div className="mt-2 text-sm text-gray-400">Platform control</div>
            </div>
          </div>

          <div className="mt-10 space-y-4 max-w-2xl">
            <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15">
                <ShieldCheck className="h-6 w-6 text-violet-300" />
              </div>
              <div>
                <p className="font-semibold text-white">
                  Organization oversight
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Approve or reject new organization registrations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-500/15">
                <Clock3 className="h-6 w-6 text-fuchsia-300" />
              </div>
              <div>
                <p className="font-semibold text-white">Live monitoring</p>
                <p className="mt-1 text-sm text-gray-400">
                  Track platform activity and operational status in real time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden flex flex-col items-center mb-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-2xl shadow-violet-500/20 mb-4">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-black text-white">BloodBridge</h2>
              <p className="text-sm text-gray-400 mt-1">
                Superadmin control center
              </p>
            </div>

            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl p-8 sm:p-10">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15">
                    <ShieldAlert className="h-7 w-7 text-violet-300" />
                  </div>
                  <h1 className="text-4xl font-black text-white mb-3">
                    Superadmin Login
                  </h1>
                  <p className="text-gray-400">
                    Global administrator access to manage all organizations
                  </p>
                </div>

                {errors.length > 0 && (
                  <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20">
                        <span className="text-[10px] font-bold text-red-200">
                          !
                        </span>
                      </div>
                      <div className="space-y-1">
                        {errors.map((error, idx) => (
                          <p
                            key={idx}
                            className="text-sm font-medium text-red-200"
                          >
                            {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
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
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-500 outline-none transition-all duration-300 focus:border-violet-500 focus:bg-white/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Password
                    </label>

                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 pr-14 text-white placeholder:text-gray-500 outline-none transition-all duration-300 focus:border-violet-500 focus:bg-white/10"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-4 flex items-center text-gray-400 transition-colors hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      Minimum 8 characters for security
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 w-full rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 py-4 font-bold text-white shadow-lg shadow-violet-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Logging in...</span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center justify-center gap-2">
                        Login as Superadmin
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    )}
                  </button>
                </form>

                <div className="mt-8 border-t border-white/10 pt-6">
                  <p className="text-center text-sm text-gray-400">
                    Organization user?{" "}
                    <button
                      onClick={() => navigate("/login")}
                      className="font-semibold text-violet-300 transition-colors hover:text-white"
                    >
                      Login here
                    </button>
                  </p>
                </div>

                <div className="mt-6 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15">
                      <LockKeyhole className="h-4 w-4 text-violet-200" />
                    </div>
                    <p className="text-xs leading-relaxed text-violet-100">
                      <strong>Secure Area:</strong> This account has global
                      access to all organizations. Keep credentials safe.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-xs text-gray-400">Access Level</p>
                    <p className="mt-1 font-semibold text-white">Superadmin</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-xs text-gray-400">Area</p>
                    <p className="mt-1 font-semibold text-white">Restricted</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
