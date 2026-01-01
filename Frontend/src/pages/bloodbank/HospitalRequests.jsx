import { useMemo, useState, useEffect } from "react";
import {
  getBloodBankRequests,
  acceptBloodRequest,
  rejectBloodRequest,
  completeBloodRequest,
} from "../../services/hospitalBloodRequestApi";
import { getHospitalById } from "../../services/hospitalApi";
import toast from "react-hot-toast";


const statusBadgeStyles = {
  VERIFIED:
    "bg-[#ecf8ef] text-[#1f7a3a] border border-[#a2d8b3] shadow-[0_3px_12px_rgba(31,122,58,0.18)]",
  PENDING:
    "bg-[#fff3e4] text-[#b05f09] border border-[#f0c18c] shadow-[0_3px_12px_rgba(219,149,58,0.2)]",
  SUSPENDED:
    "bg-[#fde4e4] text-[#9e121c] border border-[#f5a5ad] shadow-[0_3px_12px_rgba(181,39,57,0.25)]",
  ACCEPTED: "bg-[#ecf8ef] text-[#1f7a3a] border border-[#a2d8b3]",
  REJECTED: "bg-[#fde4e4] text-[#9e121c] border border-[#f5a5ad]",
  COMPLETED: "bg-[#e7f3ff] text-[#185a9d] border border-[#b6d8f2]",
};

const urgencyBadgeStyles = {
  CRITICAL:
    "bg-linear-to-r from-[#8c111c]/20 to-[#c62832]/25 text-[#7c0d16] border border-[#f3a8b3]",
  HIGH: "bg-[#fff1e1] text-[#b35c12] border border-[#f6c898]",
  MEDIUM: "bg-[#fef6e0] text-[#9d7b08] border border-[#f3e3a2]",
  LOW: "bg-[#f3f0ea] text-[#6b5d55] border border-[#dcd2c6]",
};

const formatDate = (iso) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));

const normalizeRequests = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.requests)) return payload.requests;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export default function HospitalRequests() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [hospitalNames, setHospitalNames] = useState({});
  const [requestStatusFilter, setRequestStatusFilter] = useState("ALL");
  const [requestUrgencyFilter, setRequestUrgencyFilter] = useState("ALL");

  const verificationStatus = "VERIFIED"; // This would come from context/state in real app
  const actionsLocked = verificationStatus !== "VERIFIED";

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
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
        setRequests([]);
        return;
      }

      const response = await getBloodBankRequests(
        bloodBankId,
        { page: 1, limit: 200 },
        token
      );
      const normalized = normalizeRequests(response.data?.data);

      if (response.data?.success) {
        setRequests(normalized);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error("Error fetching hospital requests:", error);
      toast.error("Failed to load hospital requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const enrichHospitalNames = async () => {
      const uniqueIds = [
        ...new Set(
          requests
            .map((req) => req.hospitalId || req.hospital?._id)
            .filter(Boolean)
        ),
      ].filter((id) => !hospitalNames[id]);

      if (!uniqueIds.length) return;

      try {
        const results = await Promise.all(
          uniqueIds.map((id) =>
            getHospitalById(id)
              .then((res) => ({ id, name: res.data?.data?.name }))
              .catch(() => ({ id, name: null }))
          )
        );

        setHospitalNames((prev) => {
          const next = { ...prev };
          results.forEach(({ id, name }) => {
            if (name) next[id] = name;
          });
          return next;
        });
      } catch (error) {
        console.error("Error fetching hospital details:", error);
      }
    };

    enrichHospitalNames();
  }, [requests, hospitalNames]);

  const filteredRequests = useMemo(
    () =>
      (requests || []).filter((req) => {
        const statusMatch =
          requestStatusFilter === "ALL" || req.status === requestStatusFilter;
        const urgencyMatch =
          requestUrgencyFilter === "ALL" || req.urgency === requestUrgencyFilter;
        return statusMatch && urgencyMatch;
      }),
    [requests, requestStatusFilter, requestUrgencyFilter]
  );

    const handleRequestStatus = async (request, nextStatus) => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Session expired. Please login again.");
      return;
    }

    try {
      let response;

      if (nextStatus === "ACCEPTED") {
        response = await acceptBloodRequest(
          request._id,
          { bloodBankResponse: "Accepted via dashboard" },
          token
        );
      } else if (nextStatus === "REJECTED") {
        response = await rejectBloodRequest(
          request._id,
          { rejectionReason: "Rejected via dashboard" },
          token
        );
      } else if (nextStatus === "COMPLETED") {
        const unitsFulfilled =
          request.unitsFulfilled || request.unitsRequired || 0;
        response = await completeBloodRequest(
          request._id,
          { unitsFulfilled },
          token
        );
      } else {
        toast.error("Unsupported action");
        return;
      }

      if (response.data?.success) {
        const updatedRequest = response.data?.data;
        setRequests((prev) =>
          prev.map((req) =>
            req._id === request._id
              ? updatedRequest || { ...req, status: updatedRequest?.status || nextStatus }
              : req
          )
        );
        toast.success(`Request ${nextStatus.toLowerCase()} successfully`);
        fetchRequests();
      } else {
        toast.error("Failed to update request status");
      }
    } catch (error) {
      console.error("Error updating request status:", error);
      toast.error("Failed to update request status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff4d6d] mx-auto"></div>
          <p className="mt-4 text-[#7c4a5e]">Loading hospital requests...</p>
        </div>
      </div>
    );
  }


  return (
    <section className="space-y-6 rounded-3xl border border-white/80 bg-white/95 p-6 shadow-[0_25px_60px_rgba(241,122,146,0.18)]">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
            Hospital Blood Requests
          </p>
          <h3 className="text-2xl font-semibold text-[#31101e]">
            Active Queue
          </h3>
          <p className="text-sm text-[#7c4a5e]">
            Prioritize based on urgency and SLA commitments.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-semibold text-[#7c4a5e]">
          <label className="flex items-center gap-2">
            Status
            <select
              value={requestStatusFilter}
              onChange={(e) => setRequestStatusFilter(e.target.value)}
              className="rounded-full border border-pink-100 bg-white px-3 py-1 focus:border-[#ff4d6d]"
            >
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            Urgency
            <select
              value={requestUrgencyFilter}
              onChange={(e) => setRequestUrgencyFilter(e.target.value)}
              className="rounded-full border border-pink-100 bg-white px-3 py-1 focus:border-[#ff4d6d]"
            >
              <option value="ALL">All</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </label>
        </div>
      </header>

      {actionsLocked && (
        <p className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-yellow-700">
          Controls locked until verification is completed.
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-pink-50">
        <table className="min-w-full text-left text-sm text-[#5c283a]">
          <thead className="bg-pink-50/80 text-xs uppercase tracking-[0.3em] text-[#ff4d6d]">
            <tr>
              <th className="px-6 py-4">Hospital</th>
              <th className="px-6 py-4">Blood Group</th>
              <th className="px-6 py-4">Units</th>
              <th className="px-6 py-4">Urgency</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Requested</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((req) => (
              <tr
                key={req._id}
                className={`border-b border-pink-50 bg-white transition hover:bg-pink-50/60 ${
                  req.urgency === "CRITICAL"
                    ? "border-l-4 border-l-[#ff4d6d]"
                    : "border-l-4 border-l-transparent"
                }`}
              >
                <td className="px-6 py-4 font-semibold">
                  {req.hospitalName ||
                    req.hospital?.name ||
                    hospitalNames[req.hospitalId || req.hospital?._id] ||
                    "Hospital"}
                </td>
                <td className="px-6 py-4">
                  <span className="rounded-full border border-pink-100 bg-pink-50 px-3 py-1 text-xs font-semibold text-[#ff4d6d]">
                    {req.bloodGroup}
                  </span>
                </td>
                <td className="px-6 py-4">{req.unitsRequired}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      urgencyBadgeStyles[req.urgency]
                    }`}
                  >
                    {req.urgency}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusBadgeStyles[req.status] || "bg-pink-50"
                    }`}
                  >
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-[#8a5c70]">
                  {formatDate(req.requestedAt)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {req.status === "PENDING" && (
                      <>
                        <button
                          disabled={actionsLocked}
                          onClick={() =>
                            handleRequestStatus(req, "ACCEPTED")
                          }
                          className="rounded-full border border-emerald-200 px-4 py-1 text-xs font-semibold text-[#1b8a4b] transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Accept
                        </button>
                        <button
                          disabled={actionsLocked}
                          onClick={() =>
                            handleRequestStatus(req, "REJECTED")
                          }
                          className="rounded-full border border-[#f59ab3] px-4 py-1 text-xs font-semibold text-[#c5114d] transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {req.status === "ACCEPTED" && (
                      <button
                        disabled={actionsLocked}
                        onClick={() =>
                          handleRequestStatus(req, "COMPLETED")
                        }
                        className="rounded-full border border-[#9dd4ff] px-4 py-1 text-xs font-semibold text-[#0f6fa6] transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
