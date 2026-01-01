import { useState, useEffect } from "react";
import { getVerifiedBloodBanks } from "../services/bloodBankApi";
import { createBloodRequest } from "../services/hospitalBloodRequestApi";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const URGENCY_LEVELS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export default function CreateBloodRequestModal({ isOpen, onClose, onSuccess, hospitalId }) {
  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    bloodBankId: "",
    bloodGroup: "",
    unitsRequired: "",
    urgency: "MEDIUM",
    notes: ""
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (isOpen) {
      fetchBloodBanks();
    }
  }, [isOpen]);

  const fetchBloodBanks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getVerifiedBloodBanks();
      setBloodBanks(response.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching blood banks:', err);
      setError('Failed to load blood banks');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Handling submit...', formData);
    
    // Validation
    if (!formData.bloodBankId) {
      setError('Please select a blood bank');
      return;
    }
    if (!formData.bloodGroup) {
      setError('Please select a blood group');
      return;
    }
    if (!formData.unitsRequired || formData.unitsRequired <= 0) {
      setError('Please enter valid number of units');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const requestData = {
        hospitalId: hospitalId,
        bloodBankId: formData.bloodBankId,
        bloodGroup: formData.bloodGroup,
        unitsRequired: parseInt(formData.unitsRequired),
        urgency: formData.urgency,
        notes: formData.notes
      };

      await createBloodRequest(requestData, token);
      
      // Reset form
      setFormData({
        bloodBankId: "",
        bloodGroup: "",
        unitsRequired: "",
        urgency: "MEDIUM",
        notes: ""
      });

      setSubmitting(false);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating blood request:', err);
      setError(err.response?.data?.message || 'Failed to create blood request');
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/80 bg-white p-8 shadow-[0_25px_60px_rgba(77,10,15,0.25)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-2xl text-[#8b6161] hover:text-[#8f0f1a] transition"
        >
          ×
        </button>

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#8f0f1a]">
            New Request
          </p>
          <h2 className="text-3xl font-bold text-[#2f1012]">
            Create Blood Request
          </h2>
          <p className="mt-2 text-sm text-[#7a4c4c]">
            Submit an emergency blood request to a verified blood bank
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#8f0f1a] border-r-transparent"></div>
              <p className="mt-4 text-sm text-[#7a4c4c]">Loading blood banks...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Blood Bank Selection */}
            <div>
              <label className="block text-sm font-semibold text-[#2f1012] mb-2">
                Select Blood Bank *
              </label>
              <select
                name="bloodBankId"
                value={formData.bloodBankId}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-[#f3c9c0] bg-white px-4 py-3 text-[#2f1012] focus:border-[#8f0f1a] focus:outline-none focus:ring-2 focus:ring-[#8f0f1a]/20"
              >
                <option value="">-- Choose a Blood Bank --</option>
                {bloodBanks.map((bank) => (
                  <option key={bank._id} value={bank._id}>
                    {bank.name} - {bank.city}, {bank.state}
                  </option>
                ))}
              </select>
              {bloodBanks.length === 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  No verified blood banks available. Please try again later.
                </p>
              )}
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-sm font-semibold text-[#2f1012] mb-2">
                Blood Group *
              </label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-[#f3c9c0] bg-white px-4 py-3 text-[#2f1012] focus:border-[#8f0f1a] focus:outline-none focus:ring-2 focus:ring-[#8f0f1a]/20"
              >
                <option value="">-- Select Blood Group --</option>
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            {/* Units Required */}
            <div>
              <label className="block text-sm font-semibold text-[#2f1012] mb-2">
                Units Required *
              </label>
              <input
                type="number"
                name="unitsRequired"
                value={formData.unitsRequired}
                onChange={handleChange}
                min="1"
                max="50"
                required
                placeholder="Enter number of units"
                className="w-full rounded-xl border border-[#f3c9c0] bg-white px-4 py-3 text-[#2f1012] focus:border-[#8f0f1a] focus:outline-none focus:ring-2 focus:ring-[#8f0f1a]/20"
              />
            </div>

            {/* Urgency Level */}
            <div>
              <label className="block text-sm font-semibold text-[#2f1012] mb-2">
                Urgency Level *
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {URGENCY_LEVELS.map((level) => (
                  <label
                    key={level}
                    className={`flex items-center justify-center cursor-pointer rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                      formData.urgency === level
                        ? level === "CRITICAL"
                          ? "border-[#c62832] bg-[#fff1ed] text-[#8f0f1a]"
                          : level === "HIGH"
                          ? "border-[#f0c18c] bg-[#fff3e4] text-[#b05f09]"
                          : level === "MEDIUM"
                          ? "border-[#f3e3a2] bg-[#fef6e0] text-[#9d7b08]"
                          : "border-[#b6d8f2] bg-[#e7f3ff] text-[#185a9d]"
                        : "border-[#f3c9c0] bg-white text-[#7a4c4c] hover:border-[#8f0f1a]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value={level}
                      checked={formData.urgency === level}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    {level}
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-[#2f1012] mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                placeholder="e.g., Emergency surgery, patient condition details..."
                className="w-full rounded-xl border border-[#f3c9c0] bg-white px-4 py-3 text-[#2f1012] focus:border-[#8f0f1a] focus:outline-none focus:ring-2 focus:ring-[#8f0f1a]/20"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border-2 border-[#f3c9c0] px-6 py-3 font-semibold text-[#7a4c4c] transition hover:border-[#8f0f1a] hover:text-[#8f0f1a]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-full bg-gradient-to-r from-[#8f0f1a] to-[#c62832] px-6 py-3 font-semibold text-white shadow-[0_15px_35px_rgba(143,15,26,0.25)] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                {submitting ? "Creating..." : "Create Request"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
