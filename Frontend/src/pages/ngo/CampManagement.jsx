import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNgoData } from "./context";
import { statusBadges, formatDate } from "./constants";

const formFields = [
  { label: "Camp Name", name: "campName", type: "text" },
  { label: "Description", name: "description", type: "textarea" },
  { label: "Location", name: "location", type: "text" },
  { label: "City", name: "city", type: "text" },
  { label: "State", name: "state", type: "text" },
  { label: "Pincode", name: "pincode", type: "text" },
  { label: "Start Date", name: "startDate", type: "date" },
  { label: "End Date", name: "endDate", type: "date" },
  { label: "Contact Person", name: "contactPersonName", type: "text" },
  { label: "Contact Mobile", name: "contactMobile", type: "tel" },
  { label: "Expected Donors", name: "expectedDonors", type: "number" },
];

const initialFormState = {
  campName: "",
  description: "",
  location: "",
  city: "",
  state: "",
  pincode: "",
  startDate: "",
  endDate: "",
  contactPersonName: "",
  contactMobile: "",
  expectedDonors: "",
};

export default function CampManagement() {
  const navigate = useNavigate();
  const { camps, createCamp, updateCamp, deleteCamp, setSelectedCampId, loading, error } =
    useNgoData();
  const [campForm, setCampForm] = useState(initialFormState);
  const [modalCampId, setModalCampId] = useState(null);
  const [modalMode, setModalMode] = useState(null); // "view" | "edit" | null
  const [editForm, setEditForm] = useState(initialFormState);
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  const activeCamp = useMemo(
    () => camps.find((camp) => camp._id === modalCampId),
    [modalCampId, camps]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCampForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextCamp = await createCamp(campForm);
    if (nextCamp) {
      setCampForm(initialFormState);
      navigate("/ngo/dashboard/slots");
    }
  };

  const openModal = (campId, mode) => {
    setModalCampId(campId);
    setModalMode(mode);
    const targetCamp = camps.find((camp) => camp._id === campId);
    if (mode === "edit" && targetCamp) {
      setEditForm({
        campName: targetCamp.campName,
        description: targetCamp.description,
        location: targetCamp.location,
        city: targetCamp.city,
        state: targetCamp.state,
        pincode: targetCamp.pincode,
        startDate: targetCamp.startDate,
        endDate: targetCamp.endDate,
        contactPersonName: targetCamp.contactPersonName,
        contactMobile: targetCamp.contactMobile,
        expectedDonors: targetCamp.expectedDonors,
      });
    }
  };

  const closeModal = () => {
    setModalCampId(null);
    setModalMode(null);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!modalCampId) return;
    const result = await updateCamp(modalCampId, {
      ...editForm,
      expectedDonors: Number(editForm.expectedDonors || 0),
    });
    if (result) {
      closeModal();
    }
  };

  const handleDelete = (campId) => {
    setConfirmingDelete(campId);
  };

  const confirmDelete = async () => {
    if (confirmingDelete) {
      const result = await deleteCamp(confirmingDelete);
      if (result && modalCampId === confirmingDelete) {
        closeModal();
      }
      setConfirmingDelete(null);
    }
  };

  const cancelDelete = () => setConfirmingDelete(null);

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <article className="rounded-[28px] border border-[#ffdbe4] bg-white p-6 shadow-[0_30px_70px_rgba(255,122,149,0.15)]">
        <header>
          <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
            Create Camp
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-[#2a0814]">
            New Blood Donation Camp
          </h3>
        </header>

        {error && (
          <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700 font-semibold">{error}</p>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {formFields.map((field) => (
            <label
              key={field.name}
              className="block text-xs font-semibold uppercase tracking-[0.3em] text-[#a44255]"
            >
              {field.label}
              {field.type === "textarea" ? (
                <textarea
                  required
                  name={field.name}
                  value={campForm[field.name]}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-[#ffd1df] bg-[#fff7f9] px-4 py-3 text-sm text-[#2a0814] focus:border-[#ff4d6d] focus:outline-none"
                />
              ) : (
                <input
                  required
                  type={field.type}
                  name={field.name}
                  value={campForm[field.name]}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-[#ffd1df] bg-[#fff7f9] px-4 py-3 text-sm text-[#2a0814] focus:border-[#ff4d6d] focus:outline-none"
                />
              )}
            </label>
          ))}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full bg-linear-to-r from-[#ff4d6d] to-[#ff7b9c] px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_18px_45px_rgba(255,77,109,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Submit Camp"}
            </button>
            <button
              type="button"
              onClick={() => setCampForm(initialFormState)}
              className="rounded-full border border-[#ffccd9] px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#a44255]"
            >
              Reset
            </button>
          </div>
        </form>
      </article>

      <article className="rounded-[28px] border border-[#ffe4ec] bg-white p-6 shadow-[0_30px_70px_rgba(66,7,18,0.08)]">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">My Camps</p>
            <h3 className="text-2xl font-semibold text-[#2a0814]">
              Camp Portfolio
            </h3>
            <p className="text-sm text-[#7a4456]">
              Manage approvals, slots, donors, and lifecycle states in one view.
            </p>
          </div>
          <button
            onClick={() => navigate("/ngo/dashboard/donors")}
            className="rounded-full border border-[#ffd1df] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#7a0f25]"
          >
            View Donors
          </button>
        </header>

        <div className="mt-6 space-y-4">
          {camps.map((camp) => (
            <article
              key={camp._id}
              className="rounded-3xl border border-[#ffe0e8] bg-[#fff9fb] p-5 shadow-[0_20px_50px_rgba(42,8,20,0.08)]"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h4 className="text-xl font-semibold text-[#2a0814]">
                    {camp.campName}
                  </h4>
                  <p className="text-sm text-[#7a4456]">
                    {camp.city}, {camp.state} • {formatDate(camp.startDate)} → {" "}
                    {formatDate(camp.endDate)}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-4 py-1 text-xs font-semibold capitalize ${
                    statusBadges[camp.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {camp.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-[#502332]">{camp.description}</p>
              <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
                <div className="rounded-2xl border border-white/60 bg-white/80 p-4">
                  <p className="text-[11px] uppercase tracking-[0.4em] text-[#b45a6f]">
                    Contact
                  </p>
                  <p className="mt-2 font-semibold text-[#2a0814]">
                    {camp.contactPersonName}
                  </p>
                  <p className="text-[#7a4456]">{camp.contactMobile}</p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/80 p-4">
                  <p className="text-[11px] uppercase tracking-[0.4em] text-[#b45a6f]">
                    Slots
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[#2a0814]">
                    {camp.totalSlots}
                  </p>
                  <p className="text-[#7a4456]">Total slots</p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/80 p-4">
                  <p className="text-[11px] uppercase tracking-[0.4em] text-[#b45a6f]">
                    Donors
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[#2a0814]">
                    {camp.registeredDonors}
                  </p>
                  <p className="text-[#7a4456]">
                    Expected {camp.expectedDonors}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
                <button
                  onClick={() => navigate("/ngo/dashboard/slots")}
                  className="rounded-full border border-[#ffd1df] px-4 py-2 text-[#7a0f25]"
                >
                  Manage Slots
                </button>
                <button
                  onClick={() => navigate("/ngo/dashboard/donors")}
                  className="rounded-full border border-[#ffd1df] px-4 py-2 text-[#7a0f25]"
                >
                  View Donors
                </button>
                <button
                  onClick={() => openModal(camp._id, "view")}
                  className="rounded-full border border-[#ffd1df] px-4 py-2 text-[#7a0f25]"
                >
                  View Details
                </button>
                <button
                  onClick={() => openModal(camp._id, "edit")}
                  className="rounded-full border border-[#ffd1df] px-4 py-2 text-[#7a0f25]"
                >
                  Edit Camp
                </button>
                <button
                  onClick={() => handleDelete(camp._id)}
                  className="rounded-full border border-[#ffd1df] px-4 py-2 text-[#d92140]"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedCampId(camp._id)}
                  className="rounded-full border border-[#ffd1df] px-4 py-2 text-[#7a0f25]"
                >
                  Focus Camp
                </button>
              </div>
            </article>
          ))}
        </div>
      </article>

      {(modalCampId && modalMode) || confirmingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          {modalMode === "view" && activeCamp ? (
            <div className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
                    Camp Details
                  </p>
                  <h3 className="text-2xl font-semibold text-[#2a0814]">
                    {activeCamp.campName}
                  </h3>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-full border border-[#ffd1df] px-4 py-2 text-sm font-semibold text-[#7a0f25]"
                >
                  Close
                </button>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <DetailCard label="Status">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      statusBadges[activeCamp.status] || ""
                    }`}
                  >
                    {activeCamp.status}
                  </span>
                </DetailCard>
                <DetailCard label="Expected Donors">
                  {activeCamp.expectedDonors}
                </DetailCard>
                <DetailCard label="Registered Donors">
                  {activeCamp.registeredDonors}
                </DetailCard>
                <DetailCard label="Total Slots">
                  {activeCamp.totalSlots}
                </DetailCard>
                <DetailCard label="Schedule">
                  {formatDate(activeCamp.startDate)} →{" "}
                  {formatDate(activeCamp.endDate)}
                </DetailCard>
                <DetailCard label="Location">
                  {activeCamp.location}, {activeCamp.city}, {activeCamp.state} -{" "}
                  {activeCamp.pincode}
                </DetailCard>
                <DetailCard label="Contact">
                  {activeCamp.contactPersonName} ({activeCamp.contactMobile})
                </DetailCard>
              </div>
              <p className="mt-6 rounded-2xl bg-[#fff4f7] p-4 text-sm text-[#502332]">
                {activeCamp.description}
              </p>
            </div>
          ) : null}

          {modalMode === "edit" && activeCamp ? (
            <div className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
                    Edit Camp
                  </p>
                  <h3 className="text-2xl font-semibold text-[#2a0814]">
                    {activeCamp.campName}
                  </h3>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-full border border-[#ffd1df] px-4 py-2 text-sm font-semibold text-[#7a0f25]"
                >
                  Close
                </button>
              </div>
              <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleEditSubmit}>
                {formFields.map((field) => (
                  <label
                    key={field.name}
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a44255]"
                  >
                    {field.label}
                    {field.type === "textarea" ? (
                      <textarea
                        required
                        name={field.name}
                        value={editForm[field.name]}
                        onChange={handleEditChange}
                        className="mt-2 w-full rounded-2xl border border-[#ffd1df] bg-[#fff7f9] px-4 py-3 text-sm text-[#2a0814]"
                      />
                    ) : (
                      <input
                        required
                        type={field.type}
                        name={field.name}
                        value={editForm[field.name]}
                        onChange={handleEditChange}
                        className="mt-2 w-full rounded-2xl border border-[#ffd1df] bg-[#fff7f9] px-4 py-3 text-sm text-[#2a0814]"
                      />
                    )}
                  </label>
                ))}
                <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full border border-[#ffd1df] px-6 py-3 text-sm font-semibold text-[#7a0f25]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-linear-to-r from-[#ff4d6d] to-[#ff7b9c] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(255,77,109,0.35)]"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {confirmingDelete ? (
            <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
              <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
                Delete Camp
              </p>
              <h3 className="mt-3 text-xl font-semibold text-[#2a0814]">
                Are you sure you want to delete this camp?
              </h3>
              <p className="mt-2 text-sm text-[#7a4456]">
                All slots and registrations linked to it will be removed.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  onClick={cancelDelete}
                  className="rounded-full border border-[#ffd1df] px-6 py-2 text-sm font-semibold text-[#7a0f25]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="rounded-full bg-[#d92140] px-6 py-2 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(217,33,64,0.35)]"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function DetailCard({ label, children }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-4">
      <p className="text-[11px] uppercase tracking-[0.4em] text-[#b45a6f]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[#2a0814]">{children}</p>
    </div>
  );
}
