import { useEffect, useMemo, useState } from "react";
import { useNgoData } from "./context";
import { bloodGroups, formatDate } from "./constants";

const initialDonorForm = {
  name: "",
  mobileNumber: "",
  address: "",
  bloodGroup: bloodGroups[0],
  slotId: "",
  donationDate: new Date().toISOString().slice(0, 10),
};

export default function DonorRegistry() {
  const {
    camps,
    registrations,
    slots,
    selectedCampId,
    setSelectedCampId,
    registerDonor,
  } = useNgoData();
  const [bloodFilter, setBloodFilter] = useState("ALL");
  const [donorForm, setDonorForm] = useState(initialDonorForm);
  const [formStatus, setFormStatus] = useState({ type: "", message: "" });

  const slotBreakdown = useMemo(() => {
    return slots.filter((slot) => slot.campId === selectedCampId);
  }, [slots, selectedCampId]);

  useEffect(() => {
    setDonorForm((prev) => ({
      ...prev,
      slotId: slotBreakdown.find((slot) => slot.bookedCount < slot.maxDonors)?._id || "",
    }));
  }, [slotBreakdown]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const matchesCamp = reg.campId === selectedCampId;
      const matchesBlood =
        bloodFilter === "ALL" || reg.bloodGroup === bloodFilter;
      return matchesCamp && matchesBlood;
    });
  }, [registrations, selectedCampId, bloodFilter]);

  const donorsBySlot = useMemo(() => {
    const mapping = {};
    slotBreakdown.forEach((slot) => {
      mapping[slot._id] = filteredRegistrations.filter(
        (donor) => donor.slotId === slot._id
      );
    });
    return mapping;
  }, [slotBreakdown, filteredRegistrations]);

  const handleDonorChange = (event) => {
    const { name, value } = event.target;
    setDonorForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDonorSubmit = (event) => {
    event.preventDefault();
    if (!donorForm.slotId) {
      setFormStatus({
        type: "error",
        message: "Please pick a slot that has available capacity.",
      });
      return;
    }

    const currentSlot = slotBreakdown.find(
      (slot) => slot._id === donorForm.slotId
    );
    const result = registerDonor({
      campId: selectedCampId,
      slotId: donorForm.slotId,
      slotTime: currentSlot?.slotTime || "",
      donationDate: donorForm.donationDate,
      name: donorForm.name,
      mobileNumber: donorForm.mobileNumber,
      address: donorForm.address,
      bloodGroup: donorForm.bloodGroup,
    });

    if (!result.ok) {
      setFormStatus({ type: "error", message: result.error });
      return;
    }

    setFormStatus({
      type: "success",
      message: "Donor registered and slot capacity updated.",
    });
    setDonorForm((prev) => ({
      ...prev,
      name: "",
      mobileNumber: "",
      address: "",
      slotId: slotBreakdown.find(
        (slot) => slot.bookedCount < slot.maxDonors
      )?._id,
    }));
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-[#ffe5ed] bg-white p-8 shadow-[0_35px_90px_rgba(42,8,20,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
              Registered Donors
            </p>
            <h3 className="text-2xl font-semibold text-[#2a0814]">
              Camp-wise Registry
            </h3>
            <p className="text-sm text-[#7a4456]">
              Slot-wise grouping prevents duplicate check-ins and ensures smooth flow.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedCampId}
              onChange={(event) => {
                setSelectedCampId(event.target.value);
                setFormStatus({ type: "", message: "" });
              }}
              className="rounded-full border border-[#ffd1df] bg-[#fff7f9] px-4 py-2 text-xs font-semibold text-[#2a0814]"
            >
              {camps.map((camp) => (
                <option key={camp._id} value={camp._id}>
                  {camp.campName}
                </option>
              ))}
            </select>
            <select
              value={bloodFilter}
              onChange={(event) => setBloodFilter(event.target.value)}
              className="rounded-full border border-[#ffd1df] bg-[#fff7f9] px-4 py-2 text-xs font-semibold text-[#2a0814]"
            >
              <option value="ALL">All Groups</option>
              {bloodGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
            <button className="rounded-full border border-[#ffd1df] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#7a0f25]">
              Export CSV
            </button>
          </div>
        </div>

        <form
          onSubmit={handleDonorSubmit}
          className="mt-6 grid gap-4 rounded-3xl border border-[#ffd1df] bg-[#fff7f9] p-6 md:grid-cols-2"
        >
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a44255]">
            Donor Name
            <input
              required
              name="name"
              value={donorForm.name}
              onChange={handleDonorChange}
              className="mt-2 w-full rounded-2xl border border-[#ffd1df] bg-white px-4 py-3 text-sm text-[#2a0814]"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a44255]">
            Mobile Number
            <input
              required
              name="mobileNumber"
              value={donorForm.mobileNumber}
              onChange={handleDonorChange}
              className="mt-2 w-full rounded-2xl border border-[#ffd1df] bg-white px-4 py-3 text-sm text-[#2a0814]"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a44255] md:col-span-2">
            Address
            <input
              required
              name="address"
              value={donorForm.address}
              onChange={handleDonorChange}
              className="mt-2 w-full rounded-2xl border border-[#ffd1df] bg-white px-4 py-3 text-sm text-[#2a0814]"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a44255]">
            Blood Group
            <select
              name="bloodGroup"
              value={donorForm.bloodGroup}
              onChange={handleDonorChange}
              className="mt-2 w-full rounded-2xl border border-[#ffd1df] bg-white px-4 py-3 text-sm text-[#2a0814]"
            >
              {bloodGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a44255]">
            Donation Date
            <input
              required
              type="date"
              name="donationDate"
              value={donorForm.donationDate}
              onChange={handleDonorChange}
              className="mt-2 w-full rounded-2xl border border-[#ffd1df] bg-white px-4 py-3 text-sm text-[#2a0814]"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a44255] md:col-span-2">
            Slot Selection
            <select
              required
              name="slotId"
              value={donorForm.slotId}
              onChange={handleDonorChange}
              className="mt-2 w-full rounded-2xl border border-[#ffd1df] bg-white px-4 py-3 text-sm text-[#2a0814]"
            >
              <option value="">Select an available slot</option>
              {slotBreakdown.map((slot) => (
                <option
                  key={slot._id}
                  value={slot._id}
                  disabled={slot.bookedCount >= slot.maxDonors}
                >
                  {slot.slotTime} • {slot.bookedCount}/{slot.maxDonors}{" "}
                  {slot.bookedCount >= slot.maxDonors ? " (Full)" : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-full bg-linear-to-r from-[#ff4d6d] to-[#ff7b9c] px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_15px_35px_rgba(255,77,109,0.35)]"
            >
              Register Donor
            </button>
            {formStatus.message && (
              <span
                className={`text-sm font-semibold ${
                  formStatus.type === "error"
                    ? "text-[#d92140]"
                    : "text-[#1f7a3a]"
                }`}
              >
                {formStatus.message}
              </span>
            )}
          </div>
        </form>

        <div className="mt-6 grid gap-3 text-sm md:grid-cols-3">
          {slotBreakdown.map((slot) => {
            const isFull = slot.bookedCount >= slot.maxDonors;
            return (
              <article
                key={slot._id}
                className="rounded-2xl border border-[#ffe0e8] bg-[#fff9fb] p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.4em] text-[#b45a6f]">
                    {slot.slotTime}
                  </p>
                  {isFull ? (
                    <span className="rounded-full bg-[#ffe5e9] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#d92140]">
                      Full
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#ecf8ef] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#1f7a3a]">
                      Available
                    </span>
                  )}
                </div>
                <p className="mt-2 text-2xl font-semibold text-[#2a0814]">
                  {slot.bookedCount}/{slot.maxDonors}
                </p>
                <p className="text-xs text-[#7a4456]">Booked donors</p>
              </article>
            );
          })}
        </div>
      </div>

      <div className="rounded-[32px] border border-[#ffe5ed] bg-white p-8 shadow-[0_35px_90px_rgba(42,8,20,0.08)]">
        {slotBreakdown.length ? (
          <div className="space-y-6">
            {slotBreakdown.map((slot) => {
              const donors = donorsBySlot[slot._id] || [];
              return (
                <article
                  key={slot._id}
                  className="rounded-3xl border border-[#ffe0e8] bg-[#fff9fb] p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.4em] text-[#b45a6f]">
                        {slot.slotTime}
                      </p>
                      <p className="text-xl font-semibold text-[#2a0814]">
                        {donors.length} donor(s)
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#7a4456]">
                      Capacity {slot.bookedCount}/{slot.maxDonors}
                    </p>
                  </div>
                  {donors.length ? (
                    <ul className="mt-4 space-y-3">
                      {donors.map((donor) => (
                        <li
                          key={donor._id}
                          className="rounded-2xl border border-white/60 bg-white/80 p-4 text-sm text-[#2a0814]"
                        >
                          <p className="font-semibold">{donor.name}</p>
                          <p className="text-xs text-[#7a4456]">
                            {donor.mobileNumber} • {donor.address}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs">
                            <span className="rounded-full bg-[#ffe5ed] px-3 py-1 font-semibold text-[#d92140]">
                              {donor.bloodGroup}
                            </span>
                            <span className="rounded-full bg-[#ecf8ef] px-3 py-1 font-semibold text-[#1f7a3a]">
                              {formatDate(donor.donationDate)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm text-[#7a4456]">
                      No donors registered under this slot yet.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[#7a4456]">
            No slots configured for this camp yet. Create slots to start registering donors.
          </p>
        )}
      </div>
    </section>
  );
}
