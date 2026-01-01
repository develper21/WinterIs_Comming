import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

export default function DonorRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [campsLoading, setCampsLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [camps, setCamps] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    bloodGroup: "",
    mobileNumber: "",
    city: "",
    address: "",
    email: "",
    donationDate: "",
    donationTime: "",
    campId: "",
    slotId: "",
  });

  const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
  const genders = ["Male", "Female", "Other"];

  // Fetch available camps
  useEffect(() => {
    const fetchCamps = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/public/camps");
        if (response.data.success && response.data.camps) {
          setCamps(response.data.camps);
        }
      } catch (error) {
        console.error("Error fetching camps:", error);
        toast.error("Failed to load available camps");
      } finally {
        setCampsLoading(false);
      }
    };
    fetchCamps();
  }, []);

  // Fetch slots when camp is selected
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedCamp) {
        setSlots([]);
        setSelectedSlot(null);
        return;
      }

      setSlotsLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:5000/api/public/camps/${selectedCamp._id}/slots`
        );
        if (response.data.success && response.data.slots) {
          setSlots(response.data.slots);
          setSelectedSlot(null); // Reset selected slot when camp changes
        } else {
          setSlots([]);
          toast.info("No time slots available for this camp");
        }
      } catch (error) {
        console.error("Error fetching slots:", error);
        toast.error("Failed to load time slots");
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [selectedCamp]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCampSelection = (camp) => {
    setSelectedCamp(camp);
    setFormData((prev) => ({
      ...prev,
      campId: camp._id.toString(),
    }));
  };

  const handleSlotSelection = (slot) => {
    setSelectedSlot(slot);
    setFormData((prev) => ({
      ...prev,
      slotId: slot._id.toString(),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.age || !formData.gender || !formData.bloodGroup || !formData.mobileNumber || !formData.city || !formData.donationDate || !selectedCamp || !selectedSlot) {
      toast.error("Please fill in all required fields including camp and time slot selection");
      return;
    }

    // Validate age
    if (formData.age < 18 || formData.age > 65) {
      toast.error("Age must be between 18 and 65 years");
      return;
    }

    // Validate mobile number
    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      toast.error("Mobile number must be 10 digits");
      return;
    }

    // Validate donation date is not in the past
    const selectedDate = new Date(formData.donationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error("Please select a future date for donation");
      return;
    }

    setLoading(true);

    try {
      // Calculate next donation eligibility date (90 days after selected donation date)
      const nextDonationDate = new Date(formData.donationDate);
      nextDonationDate.setDate(nextDonationDate.getDate() + 90);

      // Register donor with camp registration
      const response = await axios.post("http://localhost:5000/api/donor/register", {
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        mobileNumber: formData.mobileNumber,
        city: formData.city,
        address: formData.address,
        email: formData.email,
        donationDate: formData.donationDate,
        donationTime: selectedSlot.slotTime,
        nextDonationDate: nextDonationDate.toISOString().split('T')[0],
        campId: formData.campId,
        slotId: formData.slotId,
        campName: selectedCamp.campName,
        campLocation: selectedCamp.location,
      });

      toast.success("Registration successful! You are now registered as a blood donor.");
      
      // Reset form
      setFormData({
        name: "",
        age: "",
        gender: "",
        bloodGroup: "",
        mobileNumber: "",
        city: "",
        address: "",
        email: "",
        donationDate: "",
        donationTime: "",
        campId: "",
        slotId: "",
      });
      setSelectedCamp(null);
      setSelectedSlot(null);

      // Redirect to landing page after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <span className="text-2xl">←</span>
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🩸</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
              BloodLink
            </span>
          </div>
          <div className="w-12"></div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="w-full max-w-2xl">
            {/* Form Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                  Become a Blood Donor
                </span>
              </h1>
              <p className="text-gray-300">Join our community and save lives with your donation</p>
            </div>

            {/* Form Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-gray-700">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all"
                    required
                  />
                </div>

                {/* Age and Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      placeholder="18-65 years"
                      min="18"
                      max="65"
                      className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Gender *
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all"
                      required
                    >
                      <option value="">Select Gender</option>
                      {genders.map((g) => (
                        <option key={g} value={g} className="bg-slate-900">
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Blood Group *
                  </label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all"
                    required
                  >
                    <option value="">Select Blood Group</option>
                    {bloodGroups.map((bg) => (
                      <option key={bg} value={bg} className="bg-slate-900">
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mobile and City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      placeholder="10 digit number"
                      pattern="\d{10}"
                      className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Your city"
                      className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Address (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Address (Optional)
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Your street address"
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all resize-none"
                  ></textarea>
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all"
                  />
                </div>

                {/* Camp Selection Dropdown */}
                <div className="border-t border-gray-700 pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">🏥 Select Blood Donation Camp *</h3>
                  
                  {campsLoading ? (
                    <div className="text-center py-4">
                      <p className="text-gray-300">Loading camps...</p>
                    </div>
                  ) : camps.length === 0 ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <p className="text-yellow-300">No camps available at the moment. Please check back later.</p>
                    </div>
                  ) : (
                    <select
                      value={selectedCamp ? selectedCamp._id.toString() : ""}
                      onChange={(e) => {
                        const campId = e.target.value;
                        const camp = camps.find(c => c._id.toString() === campId);
                        if (camp) {
                          handleCampSelection(camp);
                        }
                      }}
                      className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all"
                      required
                    >
                      <option value="">-- Select a Camp --</option>
                      {camps.map((camp) => (
                        <option key={camp._id} value={camp._id.toString()} className="bg-slate-900">
                          {camp.campName} - {camp.location} ({new Date(camp.startDate).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  )}

                  {selectedCamp && (
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-green-300 text-sm">
                        ✓ Selected: <strong>{selectedCamp.campName}</strong> - {selectedCamp.location}
                      </p>
                    </div>
                  )}

                  {/* Donation Date and Time Slot */}
                  <div className="border-t border-gray-700 pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-white mb-4">🩸 Donation Details</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Preferred Donation Date *
                        </label>
                        <input
                          type="date"
                          name="donationDate"
                          value={formData.donationDate}
                          onChange={handleChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all"
                          required
                        />
                        {formData.donationDate && (
                          <p className="text-xs text-green-400 mt-2">
                            ✅ Next eligible donation: {new Date(new Date(formData.donationDate).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Preferred Time Slot *
                        </label>
                        {!selectedCamp ? (
                          <div className="p-4 bg-gray-700/50 border border-gray-600 rounded-lg">
                            <p className="text-gray-300 text-sm">Please select a camp first to see available time slots</p>
                          </div>
                        ) : slotsLoading ? (
                          <div className="p-4 bg-gray-700/50 border border-gray-600 rounded-lg">
                            <p className="text-gray-300 text-sm">Loading time slots...</p>
                          </div>
                        ) : slots.length === 0 ? (
                          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                            <p className="text-yellow-300 text-sm">No available time slots for this camp</p>
                          </div>
                        ) : (
                          <select
                            value={selectedSlot ? selectedSlot._id.toString() : ""}
                            onChange={(e) => {
                              const slotId = e.target.value;
                              const slot = slots.find(s => s._id.toString() === slotId);
                              if (slot) {
                                handleSlotSelection(slot);
                              }
                            }}
                            className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/50 transition-all"
                            required
                          >
                            <option value="">-- Select a Time Slot --</option>
                            {slots.map((slot) => (
                              <option 
                                key={slot._id} 
                                value={slot._id.toString()} 
                                className="bg-slate-900"
                                disabled={slot.availableSpots <= 0}
                              >
                                {slot.slotTime} ({slot.availableSpots} spots available)
                              </option>
                            ))}
                          </select>
                        )}
                        {selectedSlot && (
                          <p className="text-xs text-green-400 mt-2">
                            ✅ Selected Slot: {selectedSlot.slotTime}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-6">
                  <p className="text-sm text-red-300 mb-2">
                    ℹ️ <strong>Requirements:</strong> You must be 18-65 years old and in good health to donate blood. A valid ID will be required at the time of donation.
                  </p>
                  <p className="text-sm text-green-300">
                    ✅ <strong>90-Day Rule:</strong> After each donation, you must wait 90 days before your next donation to ensure your health and safety.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/50 transform hover:scale-105"
                >
                  {loading ? "Registering..." : "Complete Registration"}
                </button>

                {/* Secondary Action */}
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="w-full text-center text-gray-300 hover:text-white transition-colors py-2"
                >
                  Cancel
                </button>
              </form>
            </div>

            {/* Footer Info */}
            <div className="text-center mt-8 text-gray-400 text-sm">
              <p>Your information is secure and will only be used for donation coordination</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
