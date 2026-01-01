import { useState, useEffect } from "react";
import { getHospitalById, updateHospital } from "../../services/hospitalApi";
import { jsPDF } from "jspdf";

export default function HospitalProfile() {
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [updating, setUpdating] = useState(false);

  // Get organizationId from localStorage
  const organizationId = localStorage.getItem('organizationId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchHospitalProfile();
  }, []);

  const fetchHospitalProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getHospitalById(organizationId);
      setHospital(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching hospital profile:', err);
      setError(err.response?.data?.message || 'Failed to load hospital profile');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'VERIFIED': 'text-[#1f7a3a]',
      'PENDING': 'text-[#b05f09]',
      'REJECTED': 'text-[#9e121c]',
      'SUSPENDED': 'text-[#d1661c]'
    };
    return colors[status] || 'text-[#7a4c4c]';
  };

  // Handle Edit Click
  const handleEditClick = () => {
    setFormData({
      name: hospital.name,
      phone: hospital.phone,
      address: hospital.location?.address || hospital.address || "",
      city: hospital.location?.city || hospital.city || "",
      state: hospital.location?.state || "",
      pincode: hospital.location?.pincode || "",
      registrationNumber: hospital.registrationNumber, // Usually read-only but shown
    });
    setIsEditModalOpen(true);
  };

  // Handle Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle Update Submit
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      
      // Filter out registrationNumber if it's not supposed to be editable on this view, 
      // or verification checks prevent it. For now, assuming standard profile updates.
      // Ideally, reg number changes might trigger re-verification.
      
      const updatePayload = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
        // Exclude specific sensitivity fields if needed
      };

      await updateHospital(organizationId, updatePayload, token);
      
      // Refresh data
      await fetchHospitalProfile();
      
      setIsEditModalOpen(false);
      setUpdating(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error('Error updating profile:', err);
      alert(err.response?.data?.message || 'Failed to update profile');
      setUpdating(false);
    }
  };

  // Handle SOP Pack Download
  const handleDownloadSOPPack = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;
    let yPosition = 20;

    // Helper function to add new page if needed
    const checkPageBreak = (space = 10) => {
      if (yPosition + space > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper function to add text with word wrap
    const addText = (text, size = 10, style = 'normal', color = [0, 0, 0], indent = 0) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      doc.setTextColor(...color);
      const maxWidth = pageWidth - 2 * margin - indent;
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach(line => {
        checkPageBreak(lineHeight);
        doc.text(line, margin + indent, yPosition);
        yPosition += lineHeight;
      });
    };

    const addSectionTitle = (text) => {
      checkPageBreak(18);
      yPosition += 3;
      doc.setFillColor(143, 15, 26);
      doc.roundedRect(margin, yPosition - 6, pageWidth - 2 * margin, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(text, margin + 3, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 12;
    };

    const addBullet = (text, size = 10) => {
      checkPageBreak(lineHeight);
      doc.setFontSize(size);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('•', margin + 5, yPosition);
      const maxWidth = pageWidth - 2 * margin - 12;
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line, index) => {
        if (index > 0) checkPageBreak(lineHeight);
        doc.text(line, margin + 12, yPosition);
        yPosition += lineHeight;
      });
    };

    const addSubheading = (text) => {
      checkPageBreak(10);
      yPosition += 2;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(143, 15, 26);
      doc.text(text, margin + 3, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 8;
    };

    // Title Page
    doc.setFillColor(143, 15, 26);
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('SEBN HOSPITAL', pageWidth / 2, 22, { align: 'center' });
    
    doc.setFontSize(18);
    doc.text('Standard Operating Procedures', pageWidth / 2, 35, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Blood Donation & Management System', pageWidth / 2, 48, { align: 'center' });
    
    yPosition = 70;
    doc.setTextColor(0, 0, 0);

    // Hospital Info Box with better padding
    const boxHeight = 50;
    doc.setFillColor(255, 249, 246);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, boxHeight, 3, 3, 'F');
    doc.setDrawColor(143, 15, 26);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, boxHeight, 3, 3);
    
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(143, 15, 26);
    doc.text('Hospital Details', margin + 5, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Name: ${hospital.name}`, margin + 5, yPosition);
    yPosition += 6;
    doc.text(`Code: ${hospital.hospitalCode || 'N/A'}`, margin + 5, yPosition);
    yPosition += 6;
    doc.text(`Registration: ${hospital.registrationNumber}`, margin + 5, yPosition);
    yPosition += 6;
    doc.text(`Status: ${hospital.verificationStatus}`, margin + 5, yPosition);
    yPosition += 6;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, margin + 5, yPosition);
    doc.setTextColor(0, 0, 0);

    yPosition += 15;

    // 1. Blood Donation Drive Procedures
    addSectionTitle('1. BLOOD DONATION DRIVE PROCEDURES');
    addSubheading('1.1 Organizing Blood Donation Camps');
    addBullet('Coordinate with registered NGOs through SEBN platform');
    addBullet('Schedule camps minimum 7 days in advance');
    addBullet('Ensure adequate medical staff and equipment');
    addBullet('Arrange donor registration and screening facilities');
    yPosition += 2;

    addSubheading('1.2 Donor Screening Guidelines');
    addBullet('Age: 18-65 years | Weight: Minimum 50 kg');
    addBullet('Hemoglobin: Minimum 12.5 g/dL');
    addBullet('Blood Pressure: 120/80 mmHg (±20)');
    addBullet('No recent illness or medication');
    addBullet('Minimum 3 months gap between donations');
    yPosition += 2;

    addSubheading('1.3 Safety Protocols');
    addBullet('Use sterile, disposable needles and equipment');
    addBullet('Maintain proper sanitization of donation area');
    addBullet('Have emergency medical kit ready');
    addBullet('Monitor donors for 15 minutes post-donation');
    addBullet('Provide refreshments and rest area');

    // 2. Blood Request Guidelines
    addSectionTitle('2. BLOOD REQUEST GUIDELINES');
    addSubheading('2.1 Regular Blood Requests');
    addBullet('Login to SEBN Hospital Portal');
    addBullet('Navigate to Blood Request section');
    addBullet('Select blood group and quantity required');
    addBullet('Choose preferred blood bank from list');
    addBullet('Submit request with patient details');
    yPosition += 2;

    addSubheading('2.2 Emergency Requests');
    addBullet('Mark request as "URGENT" priority');
    addBullet('Contact blood bank emergency helpline');
    addBullet('Provide patient critical information');
    addBullet('Arrange immediate transport');
    addBullet('Follow up within 30 minutes');
    yPosition += 2;

    addSubheading('2.3 Documentation Required');
    addBullet('Patient admission details');
    addBullet('Doctor\'s prescription');
    addBullet('Blood requirement justification');
    addBullet('Patient blood group report');
    addBullet('Hospital identification');

    // 3. Hospital Compliance
    addSectionTitle('3. HOSPITAL COMPLIANCE & DOCUMENTATION');
    addSubheading('3.1 Registration Requirements');
    addBullet('Valid hospital registration certificate');
    addBullet('Medical license verification');
    addBullet('Contact person authorization');
    addBullet('Facility infrastructure details');
    yPosition += 2;

    addSubheading('3.2 Record-Keeping Standards');
    addBullet('Maintain digital records of all blood requests');
    addBullet('Log all donation camps organized');
    addBullet('Track blood units received and utilized');
    addBullet('Update inventory status regularly');
    addBullet('Generate monthly usage reports');
    yPosition += 2;

    addSubheading('3.3 Reporting Obligations');
    addBullet('Monthly usage statistics to SEBN');
    addBullet('Adverse event reporting within 24 hours');
    addBullet('Quarterly compliance audits');
    addBullet('Annual license renewal');

    // 4. Safety & Quality Protocols
    addSectionTitle('4. SAFETY & QUALITY PROTOCOLS');
    addSubheading('4.1 Blood Handling Procedures');
    addBullet('Verify blood group matching before transfusion');
    addBullet('Check expiry date and seal integrity');
    addBullet('Cross-match testing mandatory');
    addBullet('Double verification by two staff members');
    yPosition += 2;

    addSubheading('4.2 Storage Guidelines');
    addBullet('Whole Blood: 2-6°C | Plasma: -20°C');
    addBullet('Regular temperature monitoring');
    addBullet('Backup power supply mandatory');
    addBullet('Alarm systems for temperature deviation');
    yPosition += 2;

    addSubheading('4.3 Infection Control Measures');
    addBullet('Universal precautions at all times');
    addBullet('Proper disposal of medical waste');
    addBullet('Staff vaccination compliance');
    addBullet('Regular equipment sterilization');

    // 5. Emergency Procedures
    addSectionTitle('5. EMERGENCY PROCEDURES');
    addSubheading('5.1 Critical Shortage Protocols');
    addBullet('Activate emergency contact list');
    addBullet('Contact multiple blood banks simultaneously');
    addBullet('Request inter-hospital transfer if available');
    addBullet('Notify SEBN emergency coordination desk');
    yPosition += 2;

    addSubheading('5.2 Mass Casualty Events');
    addBullet('Activate hospital disaster management plan');
    addBullet('Coordinate with state blood bank authority');
    addBullet('Broadcast urgent donor appeal');
    addBullet('Set up emergency donation centers');
    yPosition += 2;

    addSubheading('5.3 Emergency Contacts');
    addBullet('SEBN Emergency Helpline: 1800-XXX-XXXX');
    addBullet('Contact via SEBN portal for updates');

    // 6. Forms & Templates
    addSectionTitle('6. FORMS & TEMPLATES');
    yPosition += 2;
    addText('All forms are available in SEBN Hospital Portal:', 10, 'normal', [0, 0, 0], 3);
    yPosition += 2;
    addBullet('Blood Request Form: Dashboard → Blood Requests → New Request');
    addBullet('Donor Consent Form: Dashboard → Donation Camps → Forms');
    addBullet('Incident Report: Dashboard → Reports → Incident Report');
    addBullet('Monthly Usage Report: Auto-generated in Reports section');

    // 7. Contact Information
    addSectionTitle('7. CONTACT INFORMATION');
    yPosition += 2;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(143, 15, 26);
    doc.text('SEBN Support', margin + 3, yPosition);
    yPosition += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    addBullet('Email: support@sebn.org');
    addBullet('Phone: 1800-XXX-XXXX');
    addBullet('Portal: https://sebn.org/hospital');
    yPosition += 3;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(143, 15, 26);
    doc.text('Your Hospital Details', margin + 3, yPosition);
    yPosition += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    addBullet(`Name: ${hospital.name}`);
    addBullet(`Email: ${hospital.email}`);
    addBullet(`Phone: ${hospital.phone}`);
    addBullet(`Address: ${hospital.location?.address || hospital.address}`);
    addBullet(`City: ${hospital.location?.city || hospital.city}`);

    // Footer with box
    checkPageBreak(25);
    yPosition += 5;
    
    doc.setFillColor(249, 249, 246);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 20, 2, 2, 'F');
    doc.setDrawColor(143, 15, 26);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 20, 2, 2);
    
    yPosition += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Important: This SOP pack is for reference only. Always comply with local regulations.', margin + 3, yPosition);
    yPosition += 6;
    doc.text('For queries, contact SEBN at support@sebn.org', margin + 3, yPosition);

    // Save PDF
    doc.save(`SEBN_SOP_Pack_${hospital.hospitalCode || hospital.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-700 font-medium">Loading profile...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-6 text-center">
          <p className="text-lg font-bold text-red-900">Error Loading Profile</p>
          <p className="mt-2 text-sm text-red-700 font-medium">{error}</p>
          <button
            onClick={fetchHospitalProfile}
            className="mt-4 rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white hover:bg-red-700 shadow-lg transition"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (!hospital) {
    return null;
  }

  return (
    <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-red-700 font-bold">
            Profile & Settings
          </p>
          <h3 className="text-2xl font-bold text-gray-900">
            Hospital Identity
          </h3>
          <p className="text-sm text-gray-600">
            Maintain licensed information synced with SEBN compliance desk.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleEditClick}
            className="rounded-full border-2 border-red-200 bg-white px-5 py-2 text-xs font-semibold text-red-700 transition hover:border-red-700 hover:shadow-md"
          >
            Update Details
          </button>
          <button 
            onClick={handleDownloadSOPPack}
            className="rounded-full bg-gradient-to-r from-[#8f0f1a] to-[#c62832] px-5 py-2 text-xs font-semibold text-white shadow-lg transition hover:scale-105"
          >
            Download SOP Pack
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md">
          <p className="text-xs uppercase tracking-wider text-orange-700 font-bold">
            Registration Details
          </p>
          <dl className="mt-4 space-y-3 text-sm text-gray-700">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <dt>Hospital Name</dt>
              <dd className="font-bold text-gray-900">
                {hospital.name}
              </dd>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <dt>Hospital Code</dt>
              <dd className="font-bold text-gray-900">
                {hospital.hospitalCode || "N/A"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <dt>Registration Number</dt>
              <dd className="font-bold text-gray-900">
                {hospital.registrationNumber}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Verification Status</dt>
              <dd className={`font-semibold ${getStatusColor(hospital.verificationStatus)}`}>
                {hospital.verificationStatus}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md">
          <p className="text-xs uppercase tracking-wider text-orange-700 font-bold">
            Contact
          </p>
          <dl className="mt-4 space-y-3 text-sm text-gray-700">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <dt>Email</dt>
              <dd className="font-bold text-gray-900">
                {hospital.email}
              </dd>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <dt>Phone</dt>
              <dd className="font-bold text-gray-900">
                {hospital.phone}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>City</dt>
              <dd className="font-bold text-gray-900">
                {hospital.location?.city || hospital.city || "N/A"}
              </dd>
            </div>
          </dl>
        </article>
      </div>

      <article className="rounded-2xl border border-[#f6ddd4] bg-[#fff9f6] p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-[#b05f09]">
          Facility Footprint
        </p>
        <p className="mt-3 text-sm text-[#6a3a3a]">{hospital.location?.address || hospital.address}</p>
        
        <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
          {hospital.location?.city && (
            <div>
              <strong className="text-[#8f0f1a]">City:</strong>
              <p className="text-[#6a3a3a]">{hospital.location.city}</p>
            </div>
          )}
          {hospital.location?.state && (
            <div>
              <strong className="text-[#8f0f1a]">State:</strong>
              <p className="text-[#6a3a3a]">{hospital.location.state}</p>
            </div>
          )}
          {hospital.location?.pincode && (
            <div>
              <strong className="text-[#8f0f1a]">Pincode:</strong>
              <p className="text-[#6a3a3a]">{hospital.location.pincode}</p>
            </div>
          )}
        </div>
        
        {hospital.location && hospital.location.coordinates && (
          <div className="mt-3 text-xs text-[#8b6161]">
            <strong>Coordinates:</strong> {hospital.location.coordinates[1]}, {hospital.location.coordinates[0]}
          </div>
        )}

        {hospital.specialties && hospital.specialties.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#8f0f1a]">
            {hospital.specialties.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#f3c9c0] bg-white px-4 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>

      {/* Additional Information */}
      <article className="rounded-2xl border border-[#f6ddd4] bg-[#fff9f6] p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-[#b05f09]">
          System Information
        </p>
        <dl className="mt-4 grid gap-3 text-sm text-[#553334] md:grid-cols-2">
          <div className="flex justify-between border-b border-[#f6ddd4] pb-2">
            <dt>Account Status</dt>
            <dd className="font-semibold text-[#2f1012]">
              {hospital.isActive ? "Active" : "Inactive"}
            </dd>
          </div>
          <div className="flex justify-between border-b border-[#f6ddd4] pb-2">
            <dt>Registered On</dt>
            <dd className="font-semibold text-[#2f1012]">
              {new Date(hospital.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </dd>
          </div>
          <div className="flex justify-between border-b border-[#f6ddd4] pb-2">
            <dt>Last Updated</dt>
            <dd className="font-semibold text-[#2f1012]">
              {new Date(hospital.updatedAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </dd>
          </div>
          {hospital.verifiedAt && (
            <div className="flex justify-between border-b border-[#f6ddd4] pb-2">
              <dt>Verified On</dt>
              <dd className="font-semibold text-[#1f7a3a]">
                {new Date(hospital.verifiedAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </dd>
            </div>
          )}
        </dl>
      </article>

      {/* Verification Status Alert */}
      {hospital.verificationStatus === 'PENDING' && (
        <div className="rounded-2xl border border-[#f0c18c] bg-[#fff3e4] p-4">
          <p className="text-sm font-semibold text-[#b05f09]">
            ⏳ Verification Pending
          </p>
          <p className="mt-1 text-xs text-[#8b6161]">
            Your hospital registration is under review by the SEBN admin team. 
            Some features may be limited until verification is complete.
          </p>
        </div>
      )}

      {hospital.verificationStatus === 'SUSPENDED' && (
        <div className="rounded-2xl border border-[#f5a5ad] bg-[#fde4e4] p-4">
          <p className="text-sm font-semibold text-[#9e121c]">
            🚫 Account Suspended
          </p>
          <p className="mt-1 text-xs text-[#8b6161]">
            Your hospital account has been suspended. Please contact the SEBN admin team for more information.
          </p>
        </div>
      )}

      {hospital.verificationStatus === 'VERIFIED' && (
        <div className="rounded-2xl border border-[#a2d8b3] bg-[#ecf8ef] p-4">
          <p className="text-sm font-semibold text-[#1f7a3a]">
            ✓ Verified Hospital
          </p>
          <p className="mt-1 text-xs text-[#6b3c3c]">
            Your hospital is verified and has full access to all SEBN features.
          </p>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-[#2f1012]">Update Profile</h2>
            <p className="text-xs text-[#7a4c4c] mb-6">Modify your hospital's contact and location details.</p>
            
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#8f0f1a]">
                  Hospital Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-[#f3c9c0] bg-[#fff9f6] px-4 py-3 text-sm text-[#2f1012] placeholder-[#a67c7c] focus:border-[#8f0f1a] focus:outline-none focus:ring-1 focus:ring-[#8f0f1a]"
                  required
                />
              </div>

               <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#8f0f1a]">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-[#f3c9c0] bg-[#fff9f6] px-4 py-3 text-sm text-[#2f1012] placeholder-[#a67c7c] focus:border-[#8f0f1a] focus:outline-none focus:ring-1 focus:ring-[#8f0f1a]"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#8f0f1a]">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full rounded-xl border border-[#f3c9c0] bg-[#fff9f6] px-4 py-3 text-sm text-[#2f1012] placeholder-[#a67c7c] focus:border-[#8f0f1a] focus:outline-none focus:ring-1 focus:ring-[#8f0f1a]"
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#8f0f1a]">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-[#f3c9c0] bg-[#fff9f6] px-4 py-3 text-sm text-[#2f1012] placeholder-[#a67c7c] focus:border-[#8f0f1a] focus:outline-none focus:ring-1 focus:ring-[#8f0f1a]"
                    required
                  />
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#8f0f1a]">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-[#f3c9c0] bg-[#fff9f6] px-4 py-3 text-sm text-[#2f1012] placeholder-[#a67c7c] focus:border-[#8f0f1a] focus:outline-none focus:ring-1 focus:ring-[#8f0f1a]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#8f0f1a]">
                  Pincode
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-[#f3c9c0] bg-[#fff9f6] px-4 py-3 text-sm text-[#2f1012] placeholder-[#a67c7c] focus:border-[#8f0f1a] focus:outline-none focus:ring-1 focus:ring-[#8f0f1a]"
                />
              </div>

              <div className="mt-6 flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 rounded-xl border border-[#f3c9c0] bg-white py-3 text-sm font-semibold text-[#7a4c4c] transition hover:bg-[#fff9f6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#8f0f1a] to-[#c62832] py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] disabled:opacity-70"
                >
                  {updating ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
