import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { getOrganizationByCode, updateBloodBank } from "../../services/bloodBankApi";
import toast from "react-hot-toast";

export default function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [bloodBankData, setBloodBankData] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    licenseNumber: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    verificationStatus: "",
    establishedYear: "",
    capacity: "",
  });

  useEffect(() => {
    fetchBloodBankProfile();
  }, []);

  const fetchBloodBankProfile = async () => {
    try {
      setLoading(true);
      
      // Get organization code from logged-in user
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const organizationCode = user.organizationCode;

      if (!organizationCode) {
        toast.error("Organization code not found");
        return;
      }

      console.log("Fetching organization:", organizationCode);

      // Fetch from organizations collection using organization code
      const response = await getOrganizationByCode(organizationCode);
      
      console.log("Organization response:", response.data);

      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        setBloodBankData(data);
        
        console.log("Organization data:", data);
        
        // Set form data with correct organization collection structure
        setFormData({
          name: data.name || "",
          licenseNumber: data.licenseNumber || "",
          email: data.email || "",
          phone: data.phone || "",
          city: data.address?.city || "",
          address: data.address?.street 
            ? `${data.address.street}, ${data.address.city || ""}, ${data.address.state || ""} ${data.address.pincode || ""}`.trim()
            : "",
          verificationStatus: data.verificationStatus?.status || data.status || "PENDING",
          establishedYear: data.licenseIssuedDate 
            ? new Date(data.licenseIssuedDate).getFullYear().toString() 
            : "",
          capacity: data.storageCapacity ? `${data.storageCapacity} units` : "",
        });
      } else {
        toast.error("Organization profile not found");
      }
    } catch (error) {
      console.error("Error fetching organization profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCompliance = () => {
    if (!bloodBankData) {
      toast.error("Profile data missing. Please refresh and try again.");
      return;
    }

    try {
      const doc = new jsPDF();
      const lineHeight = 10;
      let cursorY = 20;

      doc.setFontSize(18);
      doc.text("SEBN Compliance Certificate", 20, cursorY);

      cursorY += lineHeight * 1.5;
      doc.setFontSize(12);
      doc.text(`Blood Bank: ${formData.name || "N/A"}`, 20, cursorY);
      cursorY += lineHeight;
      doc.text(`License Number: ${formData.licenseNumber || "N/A"}`, 20, cursorY);
      cursorY += lineHeight;
      doc.text(`Verification Status: ${formData.verificationStatus || "PENDING"}`, 20, cursorY);
      cursorY += lineHeight;
      doc.text(`Contact Email: ${formData.email || "N/A"}`, 20, cursorY);
      cursorY += lineHeight;
      doc.text(`Phone: ${formData.phone || "N/A"}`, 20, cursorY);
      cursorY += lineHeight;
      doc.text(`City: ${formData.city || "N/A"}`, 20, cursorY);
      cursorY += lineHeight;
      doc.text("Address:", 20, cursorY);
      cursorY += lineHeight;

      const addressText = formData.address || "N/A";
      doc.text(doc.splitTextToSize(addressText, 170), 20, cursorY);
      cursorY += lineHeight * 2;

      doc.text(
        `Issued On: ${new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}`,
        20,
        cursorY
      );

      doc.save(
        `${(formData.name || "bloodbank")
          .toLowerCase()
          .replace(/\s+/g, "_")}_compliance.pdf`
      );
      toast.success("Compliance PDF downloaded");
    } catch (error) {
      console.error("Failed to generate compliance PDF:", error);
      toast.error("Could not generate PDF. Please try again.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      if (!bloodBankData?._id) {
        toast.error("Blood bank ID not found");
        return;
      }

      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        establishedYear: formData.establishedYear,
      };

      const response = await updateBloodBank(bloodBankData._id, updateData);
      
      if (response.data?.success) {
        toast.success("Profile updated successfully");
        setIsEditing(false);
        // Refresh data
        fetchBloodBankProfile();
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleCancel = () => {
    // Reset form data to original blood bank data
    if (bloodBankData) {
      setFormData({
        name: bloodBankData.name || "",
        licenseNumber: bloodBankData.licenseNumber || "",
        email: bloodBankData.email || "",
        phone: bloodBankData.phone || "",
        city: bloodBankData.address?.city || "",
        address: bloodBankData.address?.street 
          ? `${bloodBankData.address.street}, ${bloodBankData.address.city || ""}, ${bloodBankData.address.state || ""} ${bloodBankData.address.pincode || ""}`.trim()
          : "",
        verificationStatus: bloodBankData.verificationStatus?.status || bloodBankData.status || "PENDING",
        establishedYear: bloodBankData.licenseIssuedDate 
          ? new Date(bloodBankData.licenseIssuedDate).getFullYear().toString() 
          : "",
        capacity: bloodBankData.storageCapacity ? `${bloodBankData.storageCapacity} units` : "",
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff4d6d] mx-auto"></div>
          <p className="mt-4 text-[#7c4a5e]">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-white/60 bg-white p-6 shadow-[0_25px_60px_rgba(255,154,187,0.2)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
            Profile & Settings
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
            Blood Bank Identity
          </h3>
          <p className="mt-1 text-sm text-[#7c4a5e]">
            Ensure contact and license details stay current.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-2xl border border-pink-100 bg-white px-4 py-2 text-sm font-semibold text-[#ff4d6d] transition hover:border-[#ff4d6d]"
          >
            Edit Profile
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#7c4a5e] mb-2">
                Blood Bank Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm text-[#31101e] focus:border-[#ff4d6d] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#7c4a5e] mb-2">
                License Number
              </label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                disabled
                className="w-full rounded-2xl border border-pink-100 bg-pink-50/40 px-4 py-3 text-sm text-[#7c4a5e] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#7c4a5e] mb-2">
                Contact Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm text-[#31101e] focus:border-[#ff4d6d] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#7c4a5e] mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm text-[#31101e] focus:border-[#ff4d6d] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#7c4a5e] mb-2">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm text-[#31101e] focus:border-[#ff4d6d] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#7c4a5e] mb-2">
                Established Year
              </label>
              <input
                type="text"
                name="establishedYear"
                value={formData.establishedYear}
                onChange={handleChange}
                className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm text-[#31101e] focus:border-[#ff4d6d] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#7c4a5e] mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm text-[#31101e] focus:border-[#ff4d6d] focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 rounded-2xl bg-gradient-to-r from-[#ff4d6d] to-[#ff8fa3] px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(255,77,109,0.35)] transition hover:scale-[1.02]"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm font-semibold text-[#ff4d6d] transition hover:border-[#ff4d6d]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <dl className="space-y-4 border-t border-pink-50 pt-4 text-sm">
            <div className="flex justify-between border-b border-pink-50 pb-3">
              <dt className="text-[#7c4a5e]">Blood Bank Name</dt>
              <dd className="font-semibold text-[#31101e]">
                {formData.name || "N/A"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-pink-50 pb-3">
              <dt className="text-[#7c4a5e]">License Number</dt>
              <dd className="font-semibold text-[#31101e]">
                {formData.licenseNumber || "N/A"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-pink-50 pb-3">
              <dt className="text-[#7c4a5e]">Contact Email</dt>
              <dd className="font-semibold text-[#31101e]">
                {formData.email || "N/A"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-pink-50 pb-3">
              <dt className="text-[#7c4a5e]">Phone</dt>
              <dd className="font-semibold text-[#31101e]">
                {formData.phone || "N/A"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-pink-50 pb-3">
              <dt className="text-[#7c4a5e]">City</dt>
              <dd className="font-semibold text-[#31101e]">
                {formData.city || "N/A"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-pink-50 pb-3">
              <dt className="text-[#7c4a5e]">Address</dt>
              <dd className="font-semibold text-[#31101e] text-right max-w-md">
                {formData.address || "N/A"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-pink-50 pb-3">
              <dt className="text-[#7c4a5e]">Established Year</dt>
              <dd className="font-semibold text-[#31101e]">
                {formData.establishedYear || "N/A"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-pink-50 pb-3">
              <dt className="text-[#7c4a5e]">Verification Status</dt>
              <dd className="font-semibold text-[#31101e]">
                <span className={`inline-block px-3 py-1 rounded-full text-xs ${
                  formData.verificationStatus === "VERIFIED" 
                    ? "bg-green-100 text-green-700" 
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {formData.verificationStatus || "PENDING"}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#7c4a5e]">Storage Capacity</dt>
              <dd className="font-semibold text-[#31101e]">
                {formData.capacity || "N/A"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleDownloadCompliance}
              className="flex-1 rounded-2xl bg-gradient-to-r from-[#ff4d6d] to-[#ff8fa3] px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(255,77,109,0.35)] transition hover:scale-[1.02]"
            >
              Download Compliance PDF
            </button>
            <button className="flex-1 rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm font-semibold text-[#ff4d6d] transition hover:border-[#ff4d6d]">
              Change Password
            </button>
          </div>
        </>
      )}

      <div className="mt-6 rounded-2xl border border-pink-100 bg-gradient-to-br from-[#ffe5ec] to-[#fff5f9] p-5">
        <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]/70">
          Account Security
        </p>
        <p className="mt-3 text-sm text-[#31101e]">
          Keep your account secure by regularly updating your password and ensuring your contact information is current. Any changes to license information must be verified by the admin team.
        </p>
      </div>
    </section>
  );
}
