import { useState } from "react";
import { registerOrganization } from "../services/organizationApi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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
      pincode: ""
    },
    licenseNumber: "",
    contactPerson: "",
    adminName: "",
    adminEmail: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes("location.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const validateStep = () => {
    const newErrors = [];

    if (step === 1) {
      if (!formData.organizationName.trim()) newErrors.push("Organization name is required");
      if (!formData.type) newErrors.push("Organization type is required");
      if (!formData.email.trim()) newErrors.push("Organization email is required");
      if (!formData.phone.trim()) newErrors.push("Phone number is required");
      if (!formData.location.city.trim()) newErrors.push("City is required");
      if (!formData.location.state.trim()) newErrors.push("State is required");
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.email && !emailRegex.test(formData.email)) {
        newErrors.push("Invalid email format");
      }
    } else if (step === 2) {
      if (!formData.licenseNumber.trim()) newErrors.push("License number is required");
      if (!formData.contactPerson.trim()) newErrors.push("Contact person name is required");
    } else if (step === 3) {
      if (!formData.adminName.trim()) newErrors.push("Admin name is required");
      if (!formData.adminEmail.trim()) newErrors.push("Admin email is required");
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.adminEmail && !emailRegex.test(formData.adminEmail)) {
        newErrors.push("Invalid admin email format");
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
    setErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep()) {
      return;
    }

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
        adminEmail: formData.adminEmail
      };

      const res = await registerOrganization(submitData);

      if (res.data.success) {
        setSuccessData(res.data.data);
        toast.success("Organization registered successfully!");
        setStep(4);
      }
    } catch (err) {
      console.error("Registration error:", err);
      const errorMsg = err.response?.data?.message || "Registration failed. Please try again.";
      setErrors([errorMsg]);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 p-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Organization Registration</h1>
          <p className="text-green-100">Register your organization and get approved by superadmin</p>
        </div>

        {/* Success State */}
        {step === 4 && successData ? (
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <div className="text-center">
              <div className="mb-6">
                <svg className="w-20 h-20 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Registration Submitted!</h2>
              <p className="text-gray-600 mb-6">Your registration is pending superadmin approval.</p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-left">
                <p className="text-sm text-gray-600 mb-2"><strong>Organization Code:</strong></p>
                <p className="text-2xl font-bold text-green-600 font-mono break-all mb-4">{successData.organizationCode}</p>
                
                <p className="text-xs text-gray-500 mb-4">Save this code! You'll need it to check your registration status and login once approved.</p>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(successData.organizationCode);
                    toast.success("Code copied to clipboard!");
                  }}
                  className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition"
                >
                  Copy Code
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Next Steps:</strong>
                  <br />1. Save your organization code
                  <br />2. Wait for superadmin approval (usually 24-48 hours)
                  <br />3. Check status at: <span className="font-mono text-blue-600">/registration-status</span>
                  <br />4. Once approved, login with your admin credentials
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => navigate("/registration-status")}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Check Status
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Form */
          <div className="bg-white rounded-lg shadow-2xl p-8">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                        step >= i
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {i}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {i === 1 ? "Organization" : i === 2 ? "License" : "Admin"}
                    </p>
                  </div>
                ))}
              </div>
              <div className="w-full bg-gray-200 h-2 rounded">
                <div
                  className="bg-green-600 h-2 rounded transition-all"
                  style={{ width: `${((step - 1) / 2) * 100}%` }}
                />
              </div>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                {errors.map((error, idx) => (
                  <p key={idx} className="text-red-600 text-sm font-medium">
                    • {error}
                  </p>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Step 1: Organization Details */}
              {step === 1 && (
                <div className="space-y-5">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Organization Details</h3>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      name="organizationName"
                      value={formData.organizationName}
                      onChange={handleChange}
                      placeholder="e.g., Delhi Central Hospital"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Organization Type
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="hospital">Hospital</option>
                      <option value="bloodbank">Blood Bank</option>
                      <option value="ngo">NGO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Organization Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="organization@example.com"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        name="location.city"
                        value={formData.location.city}
                        onChange={handleChange}
                        placeholder="Delhi"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        name="location.state"
                        value={formData.location.state}
                        onChange={handleChange}
                        placeholder="Delhi"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address (Optional)
                    </label>
                    <input
                      type="text"
                      name="location.address"
                      value={formData.location.address}
                      onChange={handleChange}
                      placeholder="123 Medical Lane"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pincode (Optional)
                    </label>
                    <input
                      type="text"
                      name="location.pincode"
                      value={formData.location.pincode}
                      onChange={handleChange}
                      placeholder="110001"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: License Information */}
              {step === 2 && (
                <div className="space-y-5">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">License & Contact Information</h3>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      License Number
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      placeholder="LIC-2024-001"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Government or regulatory license number</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Primary Contact Person
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      placeholder="Full name of contact person"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Admin Details */}
              {step === 3 && (
                <div className="space-y-5">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Admin Account Details</h3>
                  <p className="text-sm text-gray-600 mb-4">This admin account will be created once your organization is approved</p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">
                      <strong>📝 Note:</strong> Your password will be auto-generated as <strong>admin123</strong> by the system and sent to your admin email after approval.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Admin Name
                    </label>
                    <input
                      type="text"
                      name="adminName"
                      value={formData.adminName}
                      onChange={handleChange}
                      placeholder="Full name"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      name="adminEmail"
                      value={formData.adminEmail}
                      onChange={handleChange}
                      placeholder="admin@organization.com"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4 mt-8">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
                  >
                    Previous
                  </button>
                )}
                {step < 3 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    Next
                  </button>
                )}
                {step === 3 && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {loading ? "Submitting..." : "Submit Registration"}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
