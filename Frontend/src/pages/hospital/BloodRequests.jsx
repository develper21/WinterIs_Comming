import { useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  getHospitalBloodRequests,
  updateBloodRequest,
  completeBloodRequest
} from "../../services/hospitalBloodRequestApi";
import { getHospitalById } from "../../services/hospitalApi";
import CreateBloodRequestModal from "../../components/CreateBloodRequestModal";

const statusClasses = {
  PENDING:
    "bg-[#fff3e4] text-[#b05f09] border border-[#f0c18c] shadow-sm",
  ACCEPTED: "bg-[#ecf8ef] text-[#1f7a3a] border border-[#a2d8b3]",
  COMPLETED: "bg-[#e7f3ff] text-[#185a9d] border border-[#b6d8f2]",
  REJECTED: "bg-[#fde4e4] text-[#9e121c] border border-[#f5a5ad]",
};

const urgencyClasses = {
  CRITICAL:
    "bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-2 border-red-300",
  URGENT: "bg-orange-50 text-orange-700 border border-orange-300",
  NORMAL: "bg-yellow-50 text-yellow-700 border border-yellow-300",
};

const formatDate = (iso) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));

export default function HospitalBloodRequests() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState("ALL");
  const [verificationStatus, setVerificationStatus] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const location = useLocation();

  // Get auth data from localStorage
  const token = localStorage.getItem('token');
  const organizationId = localStorage.getItem('organizationId'); // Organization ID from login

  console.log('Verification Status:', verificationStatus);
  // TEMPORARY FIX: Allow action even if not verified for debugging, or ensure strict check
  // const actionsLocked = verificationStatus !== "VERIFIED"; 
  const actionsLocked = false; // Force unlock for debugging

  useEffect(() => {
    fetchData();
    
    // Check if we should open the modal from navigation state
    if (location.state?.openCreateModal) {
      setIsModalOpen(true);
      // Optional: Clear state to avoid reopening on refresh/back (requires navigate replace)
      // but simpler to leave for now as it's a "one-off" action.
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch hospital details for verification status
      const hospitalResponse = await getHospitalById(organizationId);
      setVerificationStatus(hospitalResponse.data.data.verificationStatus);

      // Fetch blood requests
      const requestsResponse = await getHospitalBloodRequests(
        organizationId,
        { page: 1, limit: 100 },
        token
      );

      setRequests(requestsResponse.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching blood requests:', err);
      setError(err.response?.data?.message || 'Failed to load blood requests');
      setLoading(false);
    }
  };

  const filteredRequests = useMemo(
    () =>
      requests.filter((req) => {
        const statusMatch = statusFilter === "ALL" || req.status === statusFilter;
        const urgencyMatch =
          urgencyFilter === "ALL" || req.urgency === urgencyFilter;
        return statusMatch && urgencyMatch;
      }),
    [requests, statusFilter, urgencyFilter]
  );

  const handleStatusUpdate = async (id, nextStatus) => {
    try {
      if (nextStatus === 'COMPLETED') {
        await completeBloodRequest(
          id,
          { completedBy: organizationId, remarks: 'Blood received successfully' },
          token
        );
      } else {
        await updateBloodRequest(id, { status: nextStatus }, token);
      }

      // Refresh data
      await fetchData();
    } catch (err) {
      console.error('Error updating request:', err);
      alert(err.response?.data?.message || 'Failed to update request');
    }
  };

  if (loading) {
    return (
      <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-700 font-medium">Loading blood requests...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-6 text-center">
          <p className="text-lg font-bold text-red-900">Error Loading Requests</p>
          <p className="mt-2 text-sm text-red-700 font-medium">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white hover:bg-red-700 shadow-lg transition"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-red-700 font-bold">
            Blood Bank Requests
          </p>
          <h3 className="text-2xl font-bold text-gray-900">
            Emergency Fulfillment
          </h3>
          <p className="text-sm text-gray-600">
            Track every request placed with nearby verified banks.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-semibold text-gray-700">
          <label className="flex items-center gap-2">
            Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-full border-2 border-gray-300 bg-white px-3 py-1 focus:border-red-600 focus:outline-none"
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
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="rounded-full border-2 border-gray-300 bg-white px-3 py-1 focus:border-red-600 focus:outline-none"
            >
              <option value="ALL">All</option>
              <option value="CRITICAL">Critical</option>
              <option value="URGENT">Urgent</option>
              <option value="NORMAL">Normal</option>
            </select>
          </label>
        </div>
      </header>

      <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 text-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-bold text-gray-900">
              Need more units immediately?
            </p>
            <p className="text-xs text-gray-700">
              Create a high-priority request that alerts nearby blood banks within
              seconds.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={actionsLocked}
            className="rounded-full bg-gradient-to-r from-[#8f0f1a] to-[#c62832] px-5 py-2 text-xs font-semibold text-white shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + New Blood Request
          </button>
        </div>
        {actionsLocked && (
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-orange-700">
            Disabled until verification completes
          </p>
        )}
      </div>

      {filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-sm text-gray-600 font-medium">No blood requests found</p>
          <p className="mt-1 text-xs text-gray-500">
            {statusFilter !== "ALL" || urgencyFilter !== "ALL" 
              ? "Try adjusting your filters" 
              : "Create your first blood request to get started"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="min-w-full text-left text-sm text-gray-800">
            <thead className="bg-gray-100 text-xs uppercase tracking-wider text-gray-700 font-bold">
              <tr>
                <th className="px-6 py-4">Blood Bank</th>
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
                  className={`border-b border-[#fbe1d9] bg-white transition hover:bg-[#fff4f0] ${
                    req.urgency === "CRITICAL"
                      ? "border-l-4 border-l-[#c62832] bg-[#fff1ed]"
                      : "border-l-4 border-l-transparent"
                  }`}
                >
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {req.bloodBankId?.name || req.bloodBankId || "Blood Bank"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full border-2 border-red-300 bg-red-50 px-3 py-1 text-xs font-bold text-red-800">
                      {req.bloodGroup}
                    </span>
                  </td>
                  <td className="px-6 py-4">{req.unitsRequired}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        urgencyClasses[req.urgency] || urgencyClasses.NORMAL
                      }`}
                    >
                      {req.urgency}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusClasses[req.status] || "bg-[#f6ddd4]"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600">
                    {formatDate(req.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {req.status === "ACCEPTED" && (
                        <button
                          disabled={actionsLocked}
                          onClick={() => handleStatusUpdate(req._id, "COMPLETED")}
                          className="rounded-full border border-[#b6d8f2] px-4 py-1 text-xs font-semibold text-[#185a9d] transition hover:bg-[#e7f3ff] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Mark Completed
                        </button>
                      )}
                      {req.status === "COMPLETED" && (
                        <span className="text-xs text-[#1f7a3a]">✓ Fulfilled</span>
                      )}
                      {req.status === "PENDING" && (
                        <span className="text-xs text-[#b05f09]">Awaiting response</span>
                      )}
                      {req.status === "REJECTED" && (
                        <span className="text-xs text-[#9e121c]">Declined</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Blood Request Modal */}
      <CreateBloodRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        hospitalId={organizationId}
      />
    </section>
  );
}
