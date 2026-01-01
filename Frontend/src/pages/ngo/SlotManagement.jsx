import { useEffect, useMemo, useState } from "react";
import { useNgoData } from "./context";

export default function SlotManagement() {
  const {
    camps,
    slots,
    campLookup,
    selectedCampId,
    setSelectedCampId,
    createSlot,
    loading,
    error,
  } = useNgoData();

  const [slotForm, setSlotForm] = useState({
    campId: selectedCampId,
    slotTime: "",
    maxDonors: "",
  });

  useEffect(() => {
    setSlotForm((prev) => ({
      ...prev,
      campId: selectedCampId || camps[0]?._id || "",
    }));
  }, [selectedCampId, camps]);

  const filteredSlots = useMemo(() => {
    if (!selectedCampId) return slots;
    const filtered = slots.filter((slot) => {
      const slotCampId = typeof slot.campId === 'object' && slot.campId._id ? slot.campId._id : slot.campId;
      const match = slotCampId === selectedCampId;
      console.log(`[SLOT_FILTER] Checking slot: campId=${slotCampId} vs selectedCampId=${selectedCampId} => ${match}`);
      return match;
    });
    console.log(`[SLOT_FILTER] Filtered ${filtered.length} slots from ${slots.length} total`);
    return filtered;
  }, [slots, selectedCampId]);

  const aggregate = useMemo(() => {
    const totalCapacity = filteredSlots.reduce(
      (acc, slot) => acc + slot.maxDonors,
      0
    );
    const totalBooked = filteredSlots.reduce(
      (acc, slot) => acc + slot.bookedCount,
      0
    );
    return {
      totalSlots: filteredSlots.length,
      totalCapacity,
      totalBooked,
    };
  }, [filteredSlots]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSlotForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!slotForm.campId) return;
    const result = await createSlot(slotForm);
    if (result) {
      setSlotForm((prev) => ({ ...prev, slotTime: "", maxDonors: "" }));
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-[#ffe5ed] bg-white p-8 shadow-[0_35px_90px_rgba(42,8,20,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
              Slot Management
            </p>
            <h3 className="text-2xl font-semibold text-[#2a0814]">
              Donation Slots
            </h3>
            <p className="text-sm text-[#7a4456]">
              Auto-lock slots once max donors is reached to prevent overbooking.
            </p>
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex flex-wrap gap-3 rounded-3xl border border-[#ffd1df] bg-[#fff7f9] p-4"
          >
            {error && (
              <div className="w-full rounded-2xl bg-red-50 border border-red-200 p-3 mb-2">
                <p className="text-xs text-red-700 font-semibold">{error}</p>
              </div>
            )}
            <select
              required
              name="campId"
              value={slotForm.campId}
              onChange={handleChange}
              className="rounded-full border border-[#ffccd9] bg-white px-4 py-2 text-sm font-semibold text-[#2a0814]"
            >
              {camps.map((camp) => (
                <option key={camp._id} value={camp._id}>
                  {camp.campName}
                </option>
              ))}
            </select>
            <input
              required
              type="text"
              name="slotTime"
              placeholder="09:00 - 10:00"
              value={slotForm.slotTime}
              onChange={handleChange}
              className="rounded-full border border-[#ffccd9] bg-white px-4 py-2 text-sm text-[#2a0814]"
            />
            <input
              required
              type="number"
              name="maxDonors"
              placeholder="Max Donors"
              value={slotForm.maxDonors}
              onChange={handleChange}
              className="w-32 rounded-full border border-[#ffccd9] bg-white px-4 py-2 text-sm text-[#2a0814]"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-linear-to-r from-[#ff4d6d] to-[#ff7b9c] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Adding..." : "Add Slot"}
            </button>
          </form>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          {[
            { label: "Total Slots", value: aggregate.totalSlots },
            { label: "Capacity", value: `${aggregate.totalCapacity} donors` },
            { label: "Booked", value: `${aggregate.totalBooked} donors` },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-[#ffe0e8] bg-[#fff9fb] px-5 py-3 text-sm text-[#2a0814]"
            >
              <p className="text-[11px] uppercase tracking-[0.4em] text-[#b45a6f]">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-semibold">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold">
          <label className="flex items-center gap-2 text-[#7a4456]">
            Focus Camp
            <select
              value={selectedCampId}
              onChange={(event) => setSelectedCampId(event.target.value)}
              className="rounded-full border border-[#ffd1df] bg-[#fff7f9] px-4 py-2 text-[#2a0814]"
            >
              {camps.map((camp) => (
                <option key={camp._id} value={camp._id}>
                  {camp.campName}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredSlots.map((slot) => {
          const availability = Math.max(slot.maxDonors - slot.bookedCount, 0);
          const fillRatio = slot.maxDonors
            ? Math.min(100, Math.round((slot.bookedCount / slot.maxDonors) * 100))
            : 0;
          return (
            <article
              key={slot._id}
              className="rounded-3xl border border-[#ffe0e8] bg-[#fff9fb] p-5 shadow-[0_20px_45px_rgba(42,8,20,0.08)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[#b45a6f]">
                    {campLookup[slot.campId]?.campName}
                  </p>
                  <h4 className="mt-2 text-xl font-semibold text-[#2a0814]">
                    {slot.slotTime}
                  </h4>
                </div>
                <p className="text-sm font-semibold text-[#2a0814]">
                  {slot.bookedCount}/{slot.maxDonors} booked
                </p>
              </div>
              <div className="mt-4 h-2 rounded-full bg-[#ffe6ef]">
                <div
                  className={`h-full rounded-full ${
                    fillRatio === 100
                      ? "bg-[#d92140]"
                      : "bg-linear-to-r from-[#ff4d6d] to-[#ff7b9c]"
                  }`}
                  style={{ width: `${fillRatio}%` }}
                />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-[#7a4456]">
                <p>Booked: {slot.bookedCount}</p>
                <p>Available: {availability}</p>
              </div>
            </article>
          );
        })}
        {!filteredSlots.length && (
          <div className="rounded-3xl border border-dashed border-[#ffd1df] bg-white/60 p-10 text-center text-sm text-[#7a4456]">
            No slots found for the selected camp. Create one to start scheduling donors.
          </div>
        )}
      </div>
    </section>
  );
}
