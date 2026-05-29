import { useState } from "react";
import { registerUser } from "../services/authApi";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    organizationName: "",
    registrationNumber: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await registerUser(form);
      toast.success(res.data.message || "Registration successful!");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/20 blur-3xl rounded-full"></div>

        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/20 blur-3xl rounded-full"></div>

        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-pink-500/10 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        {/* LEFT SIDE - REGISTER FORM */}
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

            {/* Register Card */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl p-8 sm:p-10">
              {/* Glow Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

              <div className="relative z-10">
                {/* Heading */}
                <div className="mb-8">
                  <h2 className="text-4xl font-bold text-white mb-3">
                    Create Account
                  </h2>

                  <p className="text-gray-400">
                    Join the BloodBridge healthcare network
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>

                    <input
                      name="name"
                      placeholder="Enter your full name"
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-500 outline-none transition-all duration-300 focus:border-red-500 focus:bg-white/10"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>

                    <input
                      name="email"
                      placeholder="your.email@organization.com"
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-500 outline-none transition-all duration-300 focus:border-red-500 focus:bg-white/10"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password
                    </label>

                    <div className="relative">
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a secure password"
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-500 outline-none transition-all duration-300 focus:border-red-500 focus:bg-white/10"
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
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Role
                    </label>

                    <div className="relative">
                      <select
                        name="role"
                        onChange={handleChange}
                        className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-5 py-4 pr-14 text-white outline-none transition-all duration-300 focus:border-red-500 focus:bg-white/10"
                      >
                        <option value="user" className="bg-slate-900">
                          User
                        </option>

                        <option value="ngo" className="bg-slate-900">
                          NGO
                        </option>

                        <option value="bloodbank" className="bg-slate-900">
                          Blood Bank
                        </option>

                        <option value="hospital" className="bg-slate-900">
                          Hospital
                        </option>

                        <option value="admin" className="bg-slate-900">
                          Admin
                        </option>
                      </select>

                      {/* Custom Arrow */}
                      <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-gray-400">
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Conditional Inputs */}
                  {form.role !== "user" && form.role !== "admin" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Organization Name
                        </label>

                        <input
                          name="organizationName"
                          placeholder="Enter organization name"
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-500 outline-none transition-all duration-300 focus:border-red-500 focus:bg-white/10"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Registration Number
                        </label>

                        <input
                          name="registrationNumber"
                          placeholder="Enter registration number"
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-500 outline-none transition-all duration-300 focus:border-red-500 focus:bg-white/10"
                        />
                      </div>
                    </>
                  )}

                  {/* Button */}
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 py-4 font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-500/30"
                  >
                    Create Account
                  </button>
                </form>

                {/* Bottom Login */}
                <div className="mt-8 border-t border-white/10 pt-6">
                  <p className="text-center text-sm text-gray-400">
                    Already have an account?{" "}
                    <button
                      onClick={() => navigate("/login")}
                      className="font-semibold text-red-400 hover:text-red-300 transition-colors"
                    >
                      Login
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - CONTENT */}
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

          {/* Main Heading */}
          <h1 className="text-6xl xl:text-7xl font-black leading-tight">
            <span className="text-white">Join The</span>

            <br />

            <span className="bg-gradient-to-r from-red-400 via-pink-400 to-red-300 bg-clip-text text-transparent">
              Future
            </span>

            <br />

            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Of Healthcare
            </span>
          </h1>

          {/* Description */}
          <p className="mt-8 text-xl leading-relaxed text-gray-400 max-w-xl">
            Become part of a modern healthcare coordination ecosystem that
            connects donors, hospitals, NGOs, and blood banks through one
            intelligent platform built for emergency response and impact.
          </p>

          {/* Feature Cards */}
          <div className="mt-12 grid grid-cols-2 gap-5 max-w-2xl">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
              <div className="text-2xl font-bold text-white">Real-Time</div>

              <div className="text-sm text-gray-400 mt-2">
                Emergency blood coordination
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
              <div className="text-2xl font-bold text-white">Secure</div>

              <div className="text-sm text-gray-400 mt-2">
                Verified healthcare network
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
              <div className="text-2xl font-bold text-white">Scalable</div>

              <div className="text-sm text-gray-400 mt-2">
                Startup-ready infrastructure
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
              <div className="text-2xl font-bold text-white">Connected</div>

              <div className="text-sm text-gray-400 mt-2">
                Unified healthcare operations
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
