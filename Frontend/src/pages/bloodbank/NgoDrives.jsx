import { useMemo, useState, useEffect } from "react";
import {
  getAllNgoDrives,
  getDrivesByBloodBank,
  updateDriveStatus,
  updateNgoDrive,
} from "../../services/bloodBankApi";
import toast from "react-hot-toast";

const statusBadgeStyles = {
  VERIFIED:
    "bg-[#ecf8ef] text-[#1f7a3a] border border-[#a2d8b3] shadow-[0_3px_12px_rgba(31,122,58,0.18)]",
  PENDING:
    "bg-[#fff3e4] text-[#b05f09] border border-[#f0c18c] shadow-[0_3px_12px_rgba(219,149,58,0.2)]",
  APPROVED: "bg-[#ecf8ef] text-[#1f7a3a] border border-[#a2d8b3]",
  REJECTED: "bg-[#fde4e4] text-[#9e121c] border border-[#f5a5ad]",
  COMPLETED: "bg-[#e7f3ff] text-[#185a9d] border border-[#b6d8f2]",
};

const formatShortDate = (iso) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(iso));

const normalizeDrives = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.drives)) return payload.drives;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export default function NgoDrives() {
  const [loading, setLoading] = useState(true);
  const [ngoDrives, setNgoDrives] = useState([]);
  const [driveStatusFilter, setDriveStatusFilter] = useState("ALL");

  const verificationStatus = "VERIFIED"; // This would come from context/state in real app
  const actionsLocked = verificationStatus !== "VERIFIED";

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const bloodBankId =
        storedUser.organizationId ||
        storedUser.bloodBankId ||
        storedUser._id ||
        storedUser.organization?._id;

      if (!bloodBankId) {
        toast.error("Blood bank ID not found. Please login again.");
        setNgoDrives([]);
        return;
      }

      const response = await getDrivesByBloodBank(bloodBankId);
      let normalized = normalizeDrives(response.data?.data);

      // Fallback: if no drives assigned yet, show all drives so UI isn't empty
      if ((!normalized || !normalized.length) && response.data?.success) {
        const allRes = await getAllNgoDrives();
        normalized = normalizeDrives(allRes.data?.data);
      }

      if (response.data?.success || normalized.length) {
        setNgoDrives(normalized);
      } else {
        setNgoDrives([]);
      }
    } catch (error) {
      console.error("Error fetching NGO drives:", error);
      toast.error("Failed to load NGO drives");
      setNgoDrives([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrives = useMemo(
    () =>
      (ngoDrives || []).filter(
        (drive) =>
          driveStatusFilter === "ALL" || drive.status === driveStatusFilter
      ),
    [ngoDrives, driveStatusFilter]
  );

  const handleDriveStatus = async (id, nextStatus) => {
    try {
      const response = await updateDriveStatus(id, nextStatus);
      
      if (response.data?.success) {
        setNgoDrives((prev) =>
          prev.map((drive) =>
            drive._id === id
              ? {
                  ...drive,
                  status: nextStatus,
                }
              : drive
          )
        );
        toast.success(`Drive ${nextStatus.toLowerCase()} successfully`);
      } else {
        toast.error("Failed to update drive status");
      }
    } catch (error) {
      console.error("Error updating drive status:", error);
      toast.error("Failed to update drive status");
    }
  };

  const handleDriveCollection = async (id, delta) => {
    try {
      const drive = ngoDrives.find(d => d._id === id);
      if (!drive) return;

      const newCollectedUnits = Math.max(0, (drive.collectedUnits || 0) + delta);
      
      const response = await updateNgoDrive(id, {
        collectedUnits: newCollectedUnits
      });
      
      if (response.data?.success) {
        setNgoDrives((prev) =>
          prev.map((drive) =>
            drive._id === id
              ? {
                  ...drive,
                  collectedUnits: newCollectedUnits,
                }
              : drive
          )
        );
        toast.success("Collection updated successfully");
      } else {
        toast.error("Failed to update collection");
      }
    } catch (error) {
      console.error("Error updating drive collection:", error);
      toast.error("Failed to update collection");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff4d6d] mx-auto"></div>
          <p className="mt-4 text-[#7c4a5e]">Loading NGO drives...</p>
        </div>
      </div>
    );
  }


  return (
    <section className="space-y-6 rounded-3xl border border-white/60 bg-white/90 p-6 shadow-[0_25px_60px_rgba(255,118,158,0.12)]">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
            NGO Donation Drives
          </p>
          <h3 className="text-2xl font-semibold text-[#31101e]">
            Collaboration Pipeline
          </h3>
          <p className="text-sm text-[#7c4a5e]">
            Approve drives, monitor collections, and close loops.
          </p>
        </div>
        <label className="text-xs font-semibold text-[#7c4a5e]">
          Status
          <select
            value={driveStatusFilter}
            onChange={(e) => setDriveStatusFilter(e.target.value)}
            className="ml-2 rounded-full border border-pink-100 bg-white px-3 py-1 focus:border-[#ff4d6d]"
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </label>
      </header>

      {actionsLocked && (
        <p className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-yellow-700">
          Approval controls locked pending verification.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {filteredDrives.map((drive) => (
          <article
            key={drive._id}
            className="rounded-3xl border border-pink-50 bg-white p-5 shadow-[0_20px_45px_rgba(255,142,175,0.15)]"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xl font-semibold text-[#31101e]">
                  {drive.ngoName}
                </h4>
                <p className="text-sm text-[#8a5c70]">
                  {drive.location} · {formatShortDate(drive.driveDate)}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  statusBadgeStyles[drive.status] || "bg-pink-50"
                }`}
              >
                {drive.status}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-pink-100 bg-pink-50/60 p-3">
                <p className="text-[#ff4d6d]/80">Expected Units</p>
                <p className="text-2xl font-semibold text-[#31101e]">
                  {drive.expectedUnits}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                <p className="text-[#1b8a4b]/70">Collected</p>
                <p className="text-2xl font-semibold text-[#1b8a4b]">
                  {drive.collectedUnits}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold">
              {drive.status === "PENDING" && (
                <>
                  <button
                    disabled={actionsLocked}
                    onClick={() => handleDriveStatus(drive._id, "APPROVED")}
                    className="rounded-full border border-emerald-200 px-4 py-2 text-[#1b8a4b] transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    disabled={actionsLocked}
                    onClick={() => handleDriveStatus(drive._id, "REJECTED")}
                    className="rounded-full border border-[#f59ab3] px-4 py-2 text-[#c5114d] transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Reject
                  </button>
                </>
              )}
              {drive.status === "APPROVED" && (
                <>
                  <button
                    disabled={actionsLocked}
                    onClick={() => handleDriveCollection(drive._id, 1)}
                    className="rounded-full border border-pink-100 px-4 py-2 text-[#31101e] transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +1 Unit Collected
                  </button>
                  <button
                    disabled={actionsLocked}
                    onClick={() => handleDriveStatus(drive._id, "COMPLETED")}
                    className="rounded-full border border-[#9dd4ff] px-4 py-2 text-[#0f6fa6] transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Mark Completed
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
