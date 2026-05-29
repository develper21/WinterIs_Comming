import { useState } from "react";
import { registerOrganization } from "../services/organizationApi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Building2,
  BadgeCheck,
  ClipboardList,
  ShieldCheck,
  FileText,
  MapPin,
  Mail,
  Phone,
  User2,
  Sparkles,
  Clock3,
  CheckCircle2,
  Copy,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
} from "lucide-react";

export default function OrganizationRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [successData, setSuccessData] = useState(null);

  const [formData, setFormData] = useState({
    organizationName: "",
    type: "hospital",
    email: "",
    phone: "",
    location: {
      city: "",
      state: "",
      address: "",
      pincode: "",
    },
    licenseNumber: "",
    contactPerson: "",
    adminName: "",
    adminEmail: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes("location.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors.length > 0) setErrors([]);
  };

  const validateStep = () => {
    const newErrors = [];

    if (step === 1) {
      if (!formData.organizationName.trim())
        newErrors.push("Organization name is required");
      if (!formData.type) newErrors.push("Organization type is required");
      if (!formData.email.trim())
        newErrors.push("Organization email is required");
      if (!formData.phone.trim()) newErrors.push("Phone number is required");
      if (!formData.location.city.trim()) newErrors.push("City is required");
      if (!formData.location.state.trim()) newErrors.push("State is required");

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.email && !emailRegex.test(formData.email)) {
        newErrors.push("Invalid email format");
      }
    } else if (step === 2) {
      if (!formData.licenseNumber.trim())
        newErrors.push("License number is required");
      if (!formData.contactPerson.trim())
        newErrors.push("Contact person name is required");
    } else if (step === 3) {
      if (!formData.adminName.trim()) newErrors.push("Admin name is required");
      if (!formData.adminEmail.trim())
        newErrors.push("Admin email is required");

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.adminEmail && !emailRegex.test(formData.adminEmail)) {
        newErrors.push("Invalid admin email format");
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(step - 1);
    setErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep()) return;

    setLoading(true);
    setErrors([]);

    try {
      const submitData = {
        organizationName: formData.organizationName,
        type: formData.type,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        licenseNumber: formData.licenseNumber,
        contactPerson: formData.contactPerson,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
      };

      const res = await registerOrganization(submitData);

      if (res.data.success) {
        setSuccessData(res.data.data);
        toast.success("Organization registered successfully!");
        setStep(4);
      }
    } catch (err) {
      console.error("Registration error:", err);
      const errorMsg =
        err.response?.data?.message || "Registration failed. Please try again.";
      setErrors([errorMsg]);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const stages = [
    { label: "Organization", icon: Building2 },
    { label: "License", icon: FileText },
    { label: "Admin", icon: User2 },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#04110b] text-white relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 h-[420px] w-[420px] rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute top-20 right-0 h-[420px] w-[420px] rounded-full bg-lime-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Top Bar */}
          <div className="mb-8 flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-3 group"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-xl" />
                <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              </div>

              <div className="text-left leading-tight">
                <span className="block text-lg sm:text-xl font-extrabold tracking-tight text-white">
                  BloodBridge
                </span>
                <span className="block text-xs sm:text-sm text-gray-400">
                  Organization registration portal
                </span>
              </div>
            </button>

            <button
              onClick={() => navigate("/organization")}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              Back to Portal
            </button>
          </div>

          {/* Success State */}
          {step === 4 && successData ? (
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[36px] border border-white/10 bg-white/5 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Registration submitted
                </div>

                <h1 className="mt-6 text-4xl sm:text-5xl font-black leading-tight text-white">
                  Your organization is now in the approval queue
                </h1>

                <p className="mt-4 max-w-2xl text-lg text-gray-400 leading-relaxed">
                  The organization has been successfully registered and is
                  awaiting superadmin review. Keep the organization code safe.
                </p>

                <div className="mt-10 rounded-[28px] border border-emerald-500/15 bg-emerald-500/10 p-6">
                  <p className="text-sm font-medium text-emerald-200">
                    Organization Code
                  </p>

                  <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="font-mono text-2xl sm:text-3xl font-black tracking-wider text-white break-all">
                      {successData.organizationCode}
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          successData.organizationCode,
                        );
                        toast.success("Code copied to clipboard!");
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Code
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="text-xs text-gray-400">Status</div>
                    <div className="mt-1 font-semibold text-white">
                      Pending Review
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="text-xs text-gray-400">Approval Time</div>
                    <div className="mt-1 font-semibold text-white">
                      24–48 Hours
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="text-xs text-gray-400">Next Step</div>
                    <div className="mt-1 font-semibold text-white">
                      Status Check
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[36px] border border-white/10 bg-white/5 p-8 sm:p-10 backdrop-blur-2xl">
                <h2 className="text-3xl font-black text-white">
                  What happens next
                </h2>
                <p className="mt-3 text-gray-400">
                  Use your organization code to track status and complete access
                  after approval.
                </p>

                <div className="mt-8 space-y-4">
                  <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                      <Sparkles className="h-5 w-5 text-emerald-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Save your code</p>
                      <p className="text-sm text-gray-400">
                        You will need it for status tracking and future login.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
                      <Clock3 className="h-5 w-5 text-violet-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        Wait for approval
                      </p>
                      <p className="text-sm text-gray-400">
                        The superadmin team will review your submission.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15">
                      <ShieldCheck className="h-5 w-5 text-teal-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        Access the dashboard
                      </p>
                      <p className="text-sm text-gray-400">
                        Once approved, use the admin credentials to log in.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigate("/registration-status")}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 font-bold text-white transition hover:scale-[1.02]"
                  >
                    Check Status
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-bold text-white transition hover:bg-white/10"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              {/* Left panel */}
              <div className="rounded-[36px] border border-white/10 bg-white/5 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
                  <BadgeCheck className="h-4 w-4" />
                  Guided registration
                </div>

                <h1 className="mt-6 text-4xl sm:text-5xl font-black leading-tight text-white">
                  Register your organization in a secure 3-step flow
                </h1>

                <p className="mt-4 text-lg text-gray-400 leading-relaxed">
                  Enter organization details, add verification information, and
                  define the admin account in a clean onboarding journey built
                  for hospitals, blood banks, and NGOs.
                </p>

                <div className="mt-8 space-y-4">
                  <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15">
                      <Building2 className="h-5 w-5 text-emerald-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        Step 1: Organization details
                      </p>
                      <p className="text-sm text-gray-400">
                        Name, type, email, phone, and location.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15">
                      <ClipboardList className="h-5 w-5 text-violet-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        Step 2: License verification
                      </p>
                      <p className="text-sm text-gray-400">
                        Add license number and primary contact person.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/15">
                      <User2 className="h-5 w-5 text-teal-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        Step 3: Admin access
                      </p>
                      <p className="text-sm text-gray-400">
                        Create the admin account that will access the dashboard
                        after approval.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 rounded-[28px] border border-white/10 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 p-5">
                  <p className="text-sm font-semibold text-white">
                    Why this works
                  </p>
                  <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                    The flow reduces friction, keeps approval data organized,
                    and gives every organization a clear onboarding path.
                  </p>
                </div>
              </div>

              {/* Form panel */}
              <div className="rounded-[36px] border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
                {/* Stepper */}
                <div className="mb-8">
                  <div className="grid grid-cols-3 gap-3">
                    {stages.map((item, i) => {
                      const Icon = item.icon;
                      const active = step >= i + 1;
                      return (
                        <div key={item.label} className="text-center">
                          <div
                            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border transition-all ${
                              active
                                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                                : "border-white/10 bg-white/5 text-gray-400"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <p className="mt-2 text-xs sm:text-sm text-gray-300">
                            {item.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                      style={{ width: `${((step - 1) / 2) * 100}%` }}
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-gray-300">
                    {step === 1 && "Organization details"}
                    {step === 2 && "License and contact information"}
                    {step === 3 && "Admin account details"}
                  </div>
                </div>

                {errors.length > 0 && (
                  <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                    {errors.map((error, idx) => (
                      <p key={idx} className="text-sm font-medium text-red-200">
                        • {error}
                      </p>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Step 1 */}
                  {step === 1 && (
                    <div className="space-y-5">
                      <h3 className="text-2xl font-black text-white">
                        Organization Details
                      </h3>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          Organization Name
                        </label>
                        <input
                          type="text"
                          name="organizationName"
                          value={formData.organizationName}
                          onChange={handleChange}
                          placeholder="e.g., Delhi Central Hospital"
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-500 outline-none transition focus:border-emerald-500 focus:bg-white/10"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          Organization Type
                        </label>
                        <div className="relative">
                          <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-5 py-4 pr-12 text-white outline-none transition focus:border-emerald-500 focus:bg-white/10"
                          >
                            <option value="hospital" className="bg-slate-950">
                              Hospital
                            </option>
                            <option value="bloodbank" className="bg-slate-950">
                              Blood Bank
                            </option>
                            <option value="ngo" className="bg-slate-950">
                              NGO
                            </option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          Organization Email
                        </label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="organization@example.com"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-5 text-white placeholder:text-gray-500 outline-none transition focus:border-emerald-500 focus:bg-white/10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="9876543210"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-5 text-white placeholder:text-gray-500 outline-none transition focus:border-emerald-500 focus:bg-white/10"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-300">
                            City
                          </label>
                          <div className="relative">
                            <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                            <input
                              type="text"
                              name="location.city"
                              value={formData.location.city}
                              onChange={handleChange}
                              placeholder="Delhi"
                              className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-5 text-white placeholder:text-gray-500 outline-none transition focus:border-emerald-500 focus:bg-white/10"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-300">
                            State
                          </label>
                          <input
                            type="text"
                            name="location.state"
                            value={formData.location.state}
                            onChange={handleChange}
                            placeholder="Delhi"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-500 outline-none transition focus:border-emerald-500 focus:bg-white/10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          Address (Optional)
                        </label>
                        <input
                          type="text"
                          name="location.address"
                          value={formData.location.address}
                          onChange={handleChange}
                          placeholder="123 Medical Lane"
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-500 outline-none transition focus:border-emerald-500 focus:bg-white/10"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          Pincode (Optional)
                        </label>
                        <input
                          type="text"
                          name="location.pincode"
                          value={formData.location.pincode}
                          onChange={handleChange}
                          placeholder="110001"
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-500 outline-none transition focus:border-emerald-500 focus:bg-white/10"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2 */}
                  {step === 2 && (
                    <div className="space-y-5">
                      <h3 className="text-2xl font-black text-white">
                        License & Contact Information
                      </h3>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          License Number
                        </label>
                        <div className="relative">
                          <FileText className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                          <input
                            type="text"
                            name="licenseNumber"
                            value={formData.licenseNumber}
                            onChange={handleChange}
                            placeholder="LIC-2024-001"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-5 text-white placeholder:text-gray-500 outline-none transition focus:border-emerald-500 focus:bg-white/10"
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          Government or regulatory license number
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          Primary Contact Person
                        </label>
                        <div className="relative">
                          <User2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                          <input
                            type="text"
                            name="contactPerson"
                            value={formData.contactPerson}
                            onChange={handleChange}
                            placeholder="Full name of contact person"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-5 text-white placeholder:text-gray-500 outline-none transition focus:border-emerald-500 focus:bg-white/10"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3 */}
                  {step === 3 && (
                    <div className="space-y-5">
                      <h3 className="text-2xl font-black text-white">
                        Admin Account Details
                      </h3>

                      <p className="text-sm text-gray-400">
                        This admin account will be created once your
                        organization is approved.
                      </p>

                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                        <p className="text-sm text-emerald-100">
                          <strong>Note:</strong> Your password will be
                          auto-generated as <strong>admin123</strong> by the
                          system and sent to your admin email after approval.
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          Admin Name
                        </label>
                        <div className="relative">
                          <User2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                          <input
                            type="text"
                            name="adminName"
                            value={formData.adminName}
                            onChange={handleChange}
                            placeholder="Full name"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-5 text-white placeholder:text-gray-500 outline-none transition focus:border-emerald-500 focus:bg-white/10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">
                          Admin Email
                        </label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                          <input
                            type="email"
                            name="adminEmail"
                            value={formData.adminEmail}
                            onChange={handleChange}
                            placeholder="admin@organization.com"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-5 text-white placeholder:text-gray-500 outline-none transition focus:border-emerald-500 focus:bg-white/10"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div
                    className={`mt-8 flex gap-4 ${step === 1 ? "justify-end" : ""}`}
                  >
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={handlePrevious}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-semibold text-white transition hover:bg-white/10"
                      >
                        <ChevronLeft className="h-5 w-5" />
                        Previous
                      </button>
                    )}

                    {step < 3 && (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02]"
                      >
                        Next
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    )}

                    {step === 3 && (
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-5 py-4 font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? "Submitting..." : "Submit Registration"}
                        {!loading && <ArrowRight className="h-5 w-5" />}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
