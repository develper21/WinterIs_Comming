import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  HeartPulse,
  ShieldCheck,
  CalendarDays,
  MapPin,
  Phone,
  Mail,
  UserRound,
  Droplets,
  Building2,
  ChevronDown,
  BadgeCheck,
  Users2,
} from "lucide-react";

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

  useEffect(() => {
    const fetchCamps = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/public/camps",
        );
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
          `http://localhost:5000/api/public/camps/${selectedCamp._id}/slots`,
        );

        if (response.data.success && response.data.slots) {
          setSlots(response.data.slots);
          setSelectedSlot(null);
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
      slotId: "",
    }));
  };

  const handleSlotSelection = (slot) => {
    setSelectedSlot(slot);
    setFormData((prev) => ({
      ...prev,
      slotId: slot._id.toString(),
      donationTime: slot.slotTime,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.age ||
      !formData.gender ||
      !formData.bloodGroup ||
      !formData.mobileNumber ||
      !formData.city ||
      !formData.donationDate ||
      !selectedCamp ||
      !selectedSlot
    ) {
      toast.error(
        "Please fill in all required fields including camp and time slot selection",
      );
      return;
    }

    if (formData.age < 18 || formData.age > 65) {
      toast.error("Age must be between 18 and 65 years");
      return;
    }

    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      toast.error("Mobile number must be 10 digits");
      return;
    }

    const selectedDate = new Date(formData.donationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast.error("Please select a future date for donation");
      return;
    }

    setLoading(true);

    try {
      const nextDonationDate = new Date(formData.donationDate);
      nextDonationDate.setDate(nextDonationDate.getDate() + 90);

      await axios.post("http://localhost:5000/api/donor/register", {
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
        nextDonationDate: nextDonationDate.toISOString().split("T")[0],
        campId: formData.campId,
        slotId: formData.slotId,
        campName: selectedCamp.campName,
        campLocation: selectedCamp.location,
      });

      toast.success(
        "Registration successful! You are now registered as a blood donor.",
      );

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
      setSlots([]);

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error.response?.data?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#050816] text-white relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 h-[420px] w-[420px] rounded-full bg-rose-500/20 blur-3xl" />
        <div className="absolute top-20 right-0 h-[420px] w-[420px] rounded-full bg-pink-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-3 text-gray-300 transition hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>

              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-3 group"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-rose-500/30 blur-2xl" />
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/20">
                    <HeartPulse className="h-6 w-6 text-white" />
                  </div>
                </div>

                <div className="text-left leading-tight">
                  <span className="block text-lg sm:text-xl font-extrabold tracking-tight text-white">
                    BloodBridge
                  </span>
                  <span className="block text-xs sm:text-sm text-gray-400">
                    Donor registration portal
                  </span>
                </div>
              </button>

              <div className="w-16" />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          {/* Hero */}
          <section className="text-center max-w-4xl mx-auto pt-4 pb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
              <Sparkles className="h-4 w-4" />
              Join the donor network
            </div>

            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-black leading-tight">
              <span className="block text-white">Become a</span>
              <span className="block bg-gradient-to-r from-rose-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                Blood Donor
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-400 leading-relaxed">
              Register once, choose a camp, select a time slot, and help save
              lives through a secure and guided donation flow.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
                <div className="text-2xl font-black text-white">18–65</div>
                <div className="mt-1 text-sm text-gray-400">Eligible age</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
                <div className="text-2xl font-black text-white">90 Days</div>
                <div className="mt-1 text-sm text-gray-400">
                  Between donations
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
                <div className="text-2xl font-black text-white">Secure</div>
                <div className="mt-1 text-sm text-gray-400">
                  Private details
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            {/* Left side info */}
            <div className="rounded-[36px] border border-white/10 bg-white/5 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
                <BadgeCheck className="h-4 w-4" />
                Donation readiness guide
              </div>

              <h2 className="mt-6 text-3xl sm:text-4xl font-black leading-tight text-white">
                Simple, guided registration
              </h2>

              <p className="mt-4 text-gray-400 leading-relaxed">
                Fill in your donor details, pick a camp, choose an available
                slot, and complete registration in one clean workflow.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/15">
                    <Users2 className="h-5 w-5 text-rose-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Donor profile</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Name, age, blood group, phone number, and location.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15">
                    <Building2 className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Camp selection</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Choose a verified donation camp with available slots.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15">
                    <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Safe donation</p>
                    <p className="mt-1 text-sm text-gray-400">
                      A 90-day eligibility rule helps protect donor health.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 rounded-[28px] border border-white/10 bg-gradient-to-r from-rose-500/10 via-pink-500/5 to-red-500/10 p-5">
                <p className="text-sm font-semibold text-white">
                  Before you begin
                </p>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                  Make sure your phone number is valid and your donation date is
                  in the future. The selected camp determines the time slots
                  available for booking.
                </p>
              </div>
            </div>

            {/* Form side */}
            <div className="rounded-[36px] border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-400">Step-by-step form</p>
                  <h2 className="mt-2 text-3xl font-black text-white">
                    Register as a donor
                  </h2>
                </div>

                <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15">
                  <Droplets className="h-7 w-7 text-rose-300" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Donor details */}
                <div className="grid gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-5 text-white placeholder:text-gray-500 outline-none transition focus:border-rose-500 focus:bg-white/10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
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
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-500 outline-none transition focus:border-rose-500 focus:bg-white/10"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Gender *
                      </label>
                      <div className="relative">
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-5 py-4 pr-12 text-white outline-none transition focus:border-rose-500 focus:bg-white/10"
                          required
                        >
                          <option value="" className="bg-slate-950">
                            Select Gender
                          </option>
                          {genders.map((g) => (
                            <option key={g} value={g} className="bg-slate-950">
                              {g}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Blood Group *
                    </label>
                    <div className="relative">
                      <Droplets className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                      <select
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleChange}
                        className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-12 text-white outline-none transition focus:border-rose-500 focus:bg-white/10"
                        required
                      >
                        <option value="" className="bg-slate-950">
                          Select Blood Group
                        </option>
                        {bloodGroups.map((bg) => (
                          <option key={bg} value={bg} className="bg-slate-950">
                            {bg}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Mobile Number *
                      </label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                        <input
                          type="tel"
                          name="mobileNumber"
                          value={formData.mobileNumber}
                          onChange={handleChange}
                          placeholder="10 digit number"
                          pattern="\d{10}"
                          className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-5 text-white placeholder:text-gray-500 outline-none transition focus:border-rose-500 focus:bg-white/10"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        City *
                      </label>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Your city"
                          className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-5 text-white placeholder:text-gray-500 outline-none transition focus:border-rose-500 focus:bg-white/10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Address (Optional)
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Your street address"
                      rows={3}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-500 outline-none transition focus:border-rose-500 focus:bg-white/10 resize-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Email (Optional)
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-5 text-white placeholder:text-gray-500 outline-none transition focus:border-rose-500 focus:bg-white/10"
                      />
                    </div>
                  </div>
                </div>

                {/* Camp selection */}
                <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-5 sm:p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/15">
                      <Building2 className="h-5 w-5 text-rose-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Select Blood Donation Camp *
                      </h3>
                      <p className="text-sm text-gray-400">
                        Choose a verified camp with available slots.
                      </p>
                    </div>
                  </div>

                  {campsLoading ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-gray-300">Loading camps...</p>
                    </div>
                  ) : camps.length === 0 ? (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                      <p className="text-sm text-amber-200">
                        No camps available at the moment. Please check back
                        later.
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedCamp ? selectedCamp._id.toString() : ""}
                        onChange={(e) => {
                          const campId = e.target.value;
                          const camp = camps.find(
                            (c) => c._id.toString() === campId,
                          );
                          if (camp) handleCampSelection(camp);
                        }}
                        className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-5 py-4 pr-12 text-white outline-none transition focus:border-rose-500 focus:bg-white/10"
                        required
                      >
                        <option value="" className="bg-slate-950">
                          -- Select a Camp --
                        </option>
                        {camps.map((camp) => (
                          <option
                            key={camp._id}
                            value={camp._id.toString()}
                            className="bg-slate-950"
                          >
                            {camp.campName} - {camp.location} (
                            {new Date(camp.startDate).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                    </div>
                  )}

                  {selectedCamp && (
                    <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                      <p className="text-sm text-emerald-200">
                        <strong>Selected:</strong> {selectedCamp.campName} -{" "}
                        {selectedCamp.location}
                      </p>
                    </div>
                  )}
                </div>

                {/* Donation details */}
                <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-5 sm:p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15">
                      <CalendarDays className="h-5 w-5 text-cyan-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Donation Details *
                      </h3>
                      <p className="text-sm text-gray-400">
                        Pick your preferred date and available time slot.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Preferred Donation Date
                      </label>
                      <input
                        type="date"
                        name="donationDate"
                        value={formData.donationDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none transition focus:border-rose-500 focus:bg-white/10"
                        required
                      />
                      {formData.donationDate && (
                        <p className="mt-2 text-xs text-emerald-300">
                          Next eligible donation:{" "}
                          {new Date(
                            new Date(formData.donationDate).getTime() +
                              90 * 24 * 60 * 60 * 1000,
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Preferred Time Slot
                      </label>

                      {!selectedCamp ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-sm text-gray-400">
                            Please select a camp first to see available slots.
                          </p>
                        </div>
                      ) : slotsLoading ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-sm text-gray-400">
                            Loading time slots...
                          </p>
                        </div>
                      ) : slots.length === 0 ? (
                        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                          <p className="text-sm text-amber-200">
                            No available time slots for this camp.
                          </p>
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            value={
                              selectedSlot ? selectedSlot._id.toString() : ""
                            }
                            onChange={(e) => {
                              const slotId = e.target.value;
                              const slot = slots.find(
                                (s) => s._id.toString() === slotId,
                              );
                              if (slot) handleSlotSelection(slot);
                            }}
                            className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-5 py-4 pr-12 text-white outline-none transition focus:border-rose-500 focus:bg-white/10"
                            required
                          >
                            <option value="" className="bg-slate-950">
                              -- Select a Time Slot --
                            </option>
                            {slots.map((slot) => (
                              <option
                                key={slot._id}
                                value={slot._id.toString()}
                                className="bg-slate-950"
                                disabled={slot.availableSpots <= 0}
                              >
                                {slot.slotTime} ({slot.availableSpots} spots
                                available)
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                        </div>
                      )}

                      {selectedSlot && (
                        <p className="mt-2 text-xs text-emerald-300">
                          Selected Slot: {selectedSlot.slotTime}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info box */}
                <div className="rounded-[28px] border border-rose-500/20 bg-rose-500/10 p-5">
                  <p className="text-sm text-rose-100 leading-relaxed">
                    <strong>Requirements:</strong> You must be 18–65 years old
                    and in good health to donate blood. A valid ID will be
                    required at the time of donation.
                  </p>
                  <p className="mt-3 text-sm text-emerald-100 leading-relaxed">
                    <strong>90-Day Rule:</strong> After each donation, you must
                    wait 90 days before donating again to keep the process safe
                    for your health.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 px-6 py-4 font-bold text-white shadow-lg shadow-rose-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Registering...
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2">
                      Complete Registration
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-semibold text-white transition hover:bg-white/10"
                >
                  Cancel
                </button>
              </form>
            </div>
          </section>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 px-6 py-5 text-center text-sm text-gray-400 backdrop-blur-xl">
            Your information is secure and will only be used for donation
            coordination.
          </div>
        </main>
      </div>
    </div>
  );
}
