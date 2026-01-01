import { useState, useEffect } from "react";
import { getAllNgos } from "../services/publicNgoApi";
import { createNgoDrive } from "../services/hospitalNgoDriveApi";

const DRIVE_TYPES = ["SCHEDULED", "EMERGENCY", "CORPORATE", "EDUCATIONAL"];

export default function CreateDriveRequestModal({ isOpen, onClose, onSuccess, hospitalId }) {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    ngoId: "",
    driveTitle: "",
    driveType: "SCHEDULED",
    driveDate: "",
    startTime: "09:00",
    endTime: "17:00",
    expectedDonors: "",
    venueName: "",
    city: "",
    hospitalNotes: ""
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (isOpen) {
      fetchNgos();
    }
  }, [isOpen]);

  const fetchNgos = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch verified/approved NGOs
      const response = await getAllNgos({ verificationStatus: 'APPROVED' });
      setNgos(response.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching NGOs:', err);
      setError('Failed to load NGOs');
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
    
    // Validation
    if (!formData.ngoId) {
      setError('Please select an NGO');
      return;
    }
    if (!formData.driveTitle) {
      setError('Please enter a drive title');
      return;
    }
    if (!formData.driveDate) {
      setError('Please select a date');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const requestData = {
        hospitalId: hospitalId,
        ngoId: formData.ngoId,
        driveTitle: formData.driveTitle,
        driveType: formData.driveType,
        driveDate: formData.driveDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        expectedDonors: parseInt(formData.expectedDonors) || 0,
        location: {
            venueName: formData.venueName,
            city: formData.city,
            // Add default or empty fields for others if needed by backend, 
            // though model seems to handle optional fields via object destructuring in controller if written well,
            // checking model again: venueName, address, city, state, pinCode.
            // keeping it simple for now.
        },
        hospitalNotes: formData.hospitalNotes
      };

      await createNgoDrive(requestData, token);
      
      // Reset form
      setFormData({
        ngoId: "",
        driveTitle: "",
        driveType: "SCHEDULED",
        driveDate: "",
        startTime: "09:00",
        endTime: "17:00",
        expectedDonors: "",
        venueName: "",
        city: "",
        hospitalNotes: ""
      });

      setSubmitting(false);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating drive request:', err);
      setError(err.response?.data?.message || 'Failed to create drive request');
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
            New Connection
          </p>
          <h2 className="text-3xl font-bold text-[#2f1012]">
            Organize Donation Drive
          </h2>
          <p className="mt-2 text-sm text-[#7a4c4c]">
            Partner with an NGO to organize a blood collection drive
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
              <p className="mt-4 text-sm text-[#7a4c4c]">Loading verified NGOs...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* NGO Selection */}
            <div>
              <label className="block text-sm font-semibold text-[#2f1012] mb-2">
                Select Partner NGO *
              </label>
              <select
                name="ngoId"
                value={formData.ngoId}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-[#f3c9c0] bg-white px-4 py-3 text-[#2f1012] focus:border-[#8f0f1a] focus:outline-none focus:ring-2 focus:ring-[#8f0f1a]/20"
              >
                <option value="">-- Choose an NGO --</option>
                {ngos.map((ngo) => (
                  <option key={ngo._id} value={ngo._id}>
                    {ngo.name} - {ngo.city}, {ngo.state}
                  </option>
                ))}
              </select>
              {ngos.length === 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  No verified NGOs available. Please try again later.
                </p>
              )}
            </div>

            {/* Drive Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Title */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-[#2f1012] mb-2">
                        Drive Title *
                    </label>
                    <input
                        type="text"
                        name="driveTitle"
                        value={formData.driveTitle}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Summer Blood Drive 2024"
                        className="w-full rounded-xl border border-[#f3c9c0] bg-white px-4 py-3 text-[#2f1012] focus:border-[#8f0f1a] focus:outline-none focus:ring-2 focus:ring-[#8f0f1a]/20"
                    />
                </div>

                {/* Drive Type */}
                <div>
                    <label className="block text-sm font-semibold text-[#2f1012] mb-2">
                        Drive Type
                    </label>
                    <select
                        name="driveType"
                        value={formData.driveType}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-[#f3c9c0] bg-white px-4 py-3 text-[#2f1012] focus:border-[#8f0f1a] focus:outline-none focus:ring-2 focus:ring-[#8f0f1a]/20"
                    >
                        {DRIVE_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                {/* Date */}
                <div>
                   <label className="block text-sm font-semibold text-[#2f1012] mb-2">
                        Drive Date *
                    </label>
                    <input
                        type="date"
                        name="driveDate"
                        value={formData.driveDate}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-[#f3c9c0] bg-white px-4 py-3 text-[#2f1012] focus:border-[#8f0f1a] focus:outline-none focus:ring-2 focus:ring-[#8f0f1a]/20"
                    />
                </div>

                {/* Start Time */}
                <div>
                   <label className="block text-sm font-semibold text-[#2f1012] mb-2">
                        Start Time
                    </label>
                    <input
                        type="time"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-[#f3c9c0] bg-white px-4 py-3 text-[#2f1012] focus:border-[#8f0f1a] focus:outline-none focus:ring-2 focus:ring-[#8f0f1a]/20"
                    />
                </div>

                {/* End Time */}
                <div>
                   <label className="block text-sm font-semibold text-[#2f1012] mb-2">
                        End Time
                    </label>
                    <input
                        type="time"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-[#f3c9c0] bg-white px-4 py-3 text-[#2f1012] focus:border-[#8f0f1a] focus:outline-none focus:ring-2 focus:ring-[#8f0f1a]/20"
                    />
                </div>

                {/* Expected Donors */}
                <div>
                   <label className="block text-sm font-semibold text-[#2f1012] mb-2">
                        Expected Donors
                    </label>
                    <input
                        type="number"
                        name="expectedDonors"
                        value={formData.expectedDonors}
                        onChange={handleChange}
                        min="0"
                        placeholder="0"
                        className="w-full rounded-xl border border-[#f3c9c0] bg-white px-4 py-3 text-[#2f1012] focus:border-[#8f0f1a] focus:outline-none focus:ring-2 focus:ring-[#8f0f1a]/20"
                    />
                </div>
                 {/* City */}
                 <div>
                   <label className="block text-sm font-semibold text-[#2f1012] mb-2">
                        Target City
                    </label>
                    <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="City"
                        className="w-full rounded-xl border border-[#f3c9c0] bg-white px-4 py-3 text-[#2f1012] focus:border-[#8f0f1a] focus:outline-none focus:ring-2 focus:ring-[#8f0f1a]/20"
                    />
                </div>

                 {/* Venue */}
                 <div className="md:col-span-2">
                   <label className="block text-sm font-semibold text-[#2f1012] mb-2">
                        Venue / Location Details
                    </label>
                    <input
                        type="text"
                        name="venueName"
                        value={formData.venueName}
                        onChange={handleChange}
                        placeholder="e.g. City Community Hall, Main Street"
                        className="w-full rounded-xl border border-[#f3c9c0] bg-white px-4 py-3 text-[#2f1012] focus:border-[#8f0f1a] focus:outline-none focus:ring-2 focus:ring-[#8f0f1a]/20"
                    />
                </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-[#2f1012] mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                name="hospitalNotes"
                value={formData.hospitalNotes}
                onChange={handleChange}
                rows="3"
                placeholder="Specific requirements for the NGO..."
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
                {submitting ? "Processing..." : "Create Drive Request"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
