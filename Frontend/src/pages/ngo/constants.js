export const initialCamps = [
  {
    _id: "66c1f0a12a9b0c1234567890",
    campName: "Mega Blood Donation Camp",
    description: "Emergency blood donation drive for city hospitals",
    location: "Civil Hospital Campus",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380001",
    startDate: "2025-02-10",
    endDate: "2025-02-10",
    contactPersonName: "Rahul Patel",
    contactMobile: "9876543210",
    expectedDonors: 120,
    registeredDonors: 86,
    status: "active",
    totalSlots: 5,
  },
  {
    _id: "66c1f0a12a9b0c1234567891",
    campName: "City Connect Blood Drive",
    description: "City-wide donor mobilisation for trauma centres",
    location: "Riverfront Arena",
    city: "Vadodara",
    state: "Gujarat",
    pincode: "390001",
    startDate: "2025-03-14",
    endDate: "2025-03-15",
    contactPersonName: "Priya Bhatt",
    contactMobile: "9876501234",
    expectedDonors: 80,
    registeredDonors: 48,
    status: "approved",
    totalSlots: 4,
  },
  {
    _id: "66c1f0a12a9b0c1234567892",
    campName: "Rapid Response Camp",
    description: "Closed loop camp for neonatal units",
    location: "Lotus Mall Atrium",
    city: "Surat",
    state: "Gujarat",
    pincode: "395003",
    startDate: "2024-12-01",
    endDate: "2024-12-01",
    contactPersonName: "Meera Jain",
    contactMobile: "9123098765",
    expectedDonors: 60,
    registeredDonors: 60,
    status: "completed",
    totalSlots: 3,
  },
];

export const initialSlots = [
  {
    _id: "66c1f3b2a9b0c1234567891",
    campId: "66c1f0a12a9b0c1234567890",
    slotTime: "09:00 - 10:00",
    maxDonors: 20,
    bookedCount: 14,
  },
  {
    _id: "66c1f3b2a9b0c1234567892",
    campId: "66c1f0a12a9b0c1234567890",
    slotTime: "10:00 - 11:00",
    maxDonors: 20,
    bookedCount: 20,
  },
  {
    _id: "66c1f3b2a9b0c1234567810",
    campId: "66c1f0a12a9b0c1234567891",
    slotTime: "11:00 - 12:00",
    maxDonors: 18,
    bookedCount: 9,
  },
  {
    _id: "66c1f3b2a9b0c1234567820",
    campId: "66c1f0a12a9b0c1234567892",
    slotTime: "13:00 - 14:00",
    maxDonors: 16,
    bookedCount: 16,
  },
];

export const initialRegistrations = [
  {
    _id: "66c1f5d4a9b0c1234567892",
    campId: "66c1f0a12a9b0c1234567890",
    slotId: "66c1f3b2a9b0c1234567891",
    name: "Amit Shah",
    mobileNumber: "9123456789",
    address: "Satellite, Ahmedabad",
    bloodGroup: "O+",
    donationDate: "2025-02-10",
    slotTime: "09:00 - 10:00",
  },
  {
    _id: "66c1f5d4a9b0c1234567893",
    campId: "66c1f0a12a9b0c1234567890",
    slotId: "66c1f3b2a9b0c1234567892",
    name: "Krupa Desai",
    mobileNumber: "9356741289",
    address: "Navrangpura, Ahmedabad",
    bloodGroup: "A+",
    donationDate: "2025-02-10",
    slotTime: "10:00 - 11:00",
  },
  {
    _id: "66c1f5d4a9b0c1234567800",
    campId: "66c1f0a12a9b0c1234567891",
    slotId: "66c1f3b2a9b0c1234567810",
    name: "Viren Shah",
    mobileNumber: "9012456789",
    address: "Alkapuri, Vadodara",
    bloodGroup: "B+",
    donationDate: "2025-03-14",
    slotTime: "11:00 - 12:00",
  },
];

export const statusBadges = {
  pending: "bg-[#fff3e4] text-[#f4a259] border-[#f3c08e]",
  approved: "bg-[#f3f8ff] text-[#6b8ffb] border-[#c5d5ff]",
  active: "bg-[#ecf8ef] text-[#1f7a3a] border-[#a6dbba]",
  completed: "bg-[#e8e1ff] text-[#5b3dc4] border-[#c8bcff]",
  cancelled: "bg-[#ffe5e9] text-[#d92140] border-[#ff9caf]",
};

export const connectivityTiles = [
  {
    label: "Donor Connectivity",
    description:
      "Monitor slot utilization, detect duplicates, and nudge high-priority donors in one place.",
    meta: "Live sync · 412 engaged donors",
    accent: "from-[#f72585] via-[#b5179e] to-[#7209b7]",
  },
  {
    label: "Hospital Coordination",
    description:
      "View emergency pulls from trauma centres and commit camp capacity instantly.",
    meta: "5 active requests",
    accent: "from-[#ff4d6d] via-[#e5383b] to-[#ba181b]",
  },
  {
    label: "Blood Bank Pairing",
    description:
      "Link confirmed donors to partner blood banks with verified cold-chain logistics.",
    meta: "3 verified partners",
    accent: "from-[#ffb703] via-[#fb8500] to-[#f94144]",
  },
  {
    label: "Admin Channel",
    description:
      "Track approvals, audit remarks, and compliance locks before each mega drive.",
    meta: "Verified · Last synced 2h ago",
    accent: "from-[#4361ee] via-[#3a0ca3] to-[#480ca8]",
  },
];

export const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export const formatDate = (iso) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(iso));
