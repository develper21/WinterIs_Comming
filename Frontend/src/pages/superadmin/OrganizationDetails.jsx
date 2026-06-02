import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Building2,
  BadgeCheck,
  Mail,
  Phone,
  MapPin,
  UserRound,
  CalendarDays,
  Hash,
  FileText,
  Clock3,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Ban,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Eye,
  AlertTriangle,
  X,
  ArrowRight,
  UserCog,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_BASE = "http://localhost:5000";

const ENDPOINTS = {
  organizationDetails: (id) => `/api/superadmin/organizations/${id}`,
  approveOrganization: (id) => `/api/superadmin/organizations/${id}/approve`,
  rejectOrganization: (id) => `/api/superadmin/organizations/${id}/reject`,
  suspendOrganization: (id) => `/api/superadmin/organizations/${id}/suspend`,
  reactivateOrganization: (id) =>
    `/api/superadmin/organizations/${id}/reactivate`,
};

const safeArray = (value) => (Array.isArray(value) ? value : []);

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

const normalizeStatus = (value) => String(value || "").toUpperCase();

const getStatusStyle = (status) => {
  switch (normalizeStatus(status)) {
    case "APPROVED":
      return "bg-emerald-100 border-emerald-300 text-emerald-700";
    case "PENDING":
      return "bg-amber-100 border-amber-300 text-amber-700";
    case "REJECTED":
      return "bg-red-100 border-red-300 text-red-700";
    case "SUSPENDED":
      return "bg-gray-100 border-gray-300 text-gray-700";
    default:
      return "bg-gray-100 border-gray-300 text-gray-700";
  }
};

const getStatusLabel = (status) => {
  switch (normalizeStatus(status)) {
    case "APPROVED":
      return "Approved";
    case "PENDING":
      return "Pending Review";
    case "REJECTED":
      return "Rejected";
    case "SUSPENDED":
      return "Suspended";
    default:
      return status || "Unknown";
  }
};

const getStepState = (current, step) => {
  const order = {
    SUBMITTED: 1,
    REVIEWED: 2,
    APPROVED: 3,
    REJECTED: 3,
    SUSPENDED: 3,
  };
  const cur = order[normalizeStatus(current)] || 1;
  return step <= cur;
};

export default function OrganizationDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const auth = useAuth() || {};
  const token = auth.token || localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  const [organization, setOrganization] = useState(null);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);

  const [rejectReason, setRejectReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");

  const api = useMemo(() => {
    return axios.create({
      baseURL: API_BASE,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }, [token]);

  const loadOrganization = async () => {
    if (!id) return;

    setError("");
    try {
      const res = await api.get(ENDPOINTS.organizationDetails(id));
      const payload = res.data?.data || res.data || {};
      setOrganization(payload.organization || payload.data || payload);
    } catch (err) {
      console.error("Failed to load organization details:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load organization details. Check backend route names if needed.",
      );
      setOrganization(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/superadmin-login", { replace: true });
      return;
    }
    loadOrganization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrganization();
  };

  const handleActionSuccess = async (message) => {
    toast.success(message);
    setShowApproveModal(false);
    setShowRejectModal(false);
    setShowSuspendModal(false);
    setShowReactivateModal(false);
    setRejectReason("");
    setSuspendReason("");
    await loadOrganization();
  };

  const handleApprove = async () => {
    if (!organization) return;
    setProcessing(true);
    try {
      const res = await api.post(ENDPOINTS.approveOrganization(id), {});
      await handleActionSuccess(
        res.data?.message || "Organization approved successfully",
      );
    } catch (err) {
      console.error("Approve error:", err);
      toast.error(
        err.response?.data?.message || "Failed to approve organization",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!organization) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setProcessing(true);
    try {
      const res = await api.post(ENDPOINTS.rejectOrganization(id), {
        reason: rejectReason.trim(),
      });
      await handleActionSuccess(
        res.data?.message || "Organization rejected successfully",
      );
    } catch (err) {
      console.error("Reject error:", err);
      toast.error(
        err.response?.data?.message || "Failed to reject organization",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspend = async () => {
    if (!organization) return;
    if (!suspendReason.trim()) {
      toast.error("Please provide a suspension reason");
      return;
    }

    setProcessing(true);
    try {
      const res = await api.post(ENDPOINTS.suspendOrganization(id), {
        reason: suspendReason.trim(),
      });
      await handleActionSuccess(
        res.data?.message || "Organization suspended successfully",
      );
    } catch (err) {
      console.error("Suspend error:", err);
      toast.error(
        err.response?.data?.message || "Failed to suspend organization",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivate = async () => {
    if (!organization) return;

    setProcessing(true);
    try {
      const res = await api.post(ENDPOINTS.reactivateOrganization(id), {});
      await handleActionSuccess(
        res.data?.message || "Organization reactivated successfully",
      );
    } catch (err) {
      console.error("Reactivate error:", err);
      toast.error(
        err.response?.data?.message || "Failed to reactivate organization",
      );
    } finally {
      setProcessing(false);
    }
  };

  const status = normalizeStatus(organization?.status);
  const statusHistory = safeArray(
    organization?.statusHistory ||
      organization?.history ||
      organization?.statusTimeline ||
      [],
  );

  const adminUser = organization?.adminUser ||
    organization?.admin || {
      name: organization?.adminName,
      email: organization?.adminEmail,
      role: organization?.adminRole,
      lastLogin: organization?.lastLogin,
    };

  const profileType = organization?.organizationType || organization?.type;
  const displayType = String(profileType || "")
    .toLowerCase()
    .includes("hospital")
    ? "Hospital"
    : String(profileType || "")
          .toLowerCase()
          .includes("blood")
      ? "Blood Bank"
      : String(profileType || "")
            .toLowerCase()
            .includes("ngo")
        ? "NGO"
        : profileType || "Organization";

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
            Organization Details
          </p>
          <h3 className="text-3xl font-semibold text-[#31101e]">
            {loading
              ? "Loading organization..."
              : organization?.organizationName ||
                organization?.name ||
                "Organization Details"}
          </h3>
          <p className="text-sm text-[#7c4a5e]">
            Inspect the full organization profile, contact information, license
            details, admin account, and status history
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/superadmin/organizations")}
            className="inline-flex items-center gap-2 rounded-full border border-[#f2c8c8] bg-white/80 px-4 py-2 text-sm font-semibold text-[#ff4d6d] shadow-[0_10px_25px_rgba(255,77,109,0.15)] hover:shadow-[0_15px_35px_rgba(255,77,109,0.25)] transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-[#f2c8c8] bg-white/80 px-4 py-2 text-sm font-semibold text-[#ff4d6d] shadow-[0_10px_25px_rgba(255,77,109,0.15)] hover:shadow-[0_15px_35px_rgba(255,77,109,0.25)] transition-all"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            onClick={() => navigate("/superadmin/dashboard/overview")}
            className="inline-flex items-center gap-2 rounded-full border border-[#f2c8c8] bg-white/80 px-4 py-2 text-sm font-semibold text-[#ff4d6d] shadow-[0_10px_25px_rgba(255,77,109,0.15)] hover:shadow-[0_15px_35px_rgba(255,77,109,0.25)] transition-all"
          >
            Dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-800">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Status"
          value={getStatusLabel(status)}
          accent="text-[#1e5aa8]"
        />
        <StatCard label="Type" value={displayType} accent="text-[#2c8a49]" />
        <StatCard
          label="Code"
          value={
            organization?.organizationCode ||
            organization?._id ||
            organization?.id ||
            "-"
          }
          accent="text-[#d1661c]"
          mono
        />
        <StatCard
          label="Submitted"
          value={formatDate(
            organization?.createdAt || organization?.submittedAt,
          )}
          accent="text-[#d93f42]"
        />
      </div>

      {loading ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <SkeletonCard height="h-72" />
            <SkeletonCard height="h-64" />
            <SkeletonCard height="h-80" />
          </div>
          <div className="space-y-6">
            <SkeletonCard height="h-80" />
            <SkeletonCard height="h-72" />
          </div>
        </div>
      ) : organization ? (
        <>
          {/* Top grid */}
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            {/* Profile */}
            <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[#1e5aa8]">
                    Profile
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#31101e]">
                    Organization Profile
                  </h2>
                </div>

                <div
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(status)}`}
                >
                  {getStatusLabel(status)}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <DetailRow
                  icon={Building2}
                  label="Organization Name"
                  value={organization?.organizationName || organization?.name}
                />
                <DetailRow
                  icon={BadgeCheck}
                  label="Organization Type"
                  value={displayType}
                />
                <DetailRow
                  icon={Hash}
                  label="Organization Code"
                  value={
                    organization?.organizationCode ||
                    organization?._id ||
                    organization?.id
                  }
                  mono
                />
                <DetailRow
                  icon={CalendarDays}
                  label="Registration Date"
                  value={formatDate(
                    organization?.createdAt || organization?.submittedAt,
                  )}
                />
                <DetailRow
                  icon={Clock3}
                  label="Status"
                  value={getStatusLabel(status)}
                />
                <DetailRow
                  icon={FileText}
                  label="License Number"
                  value={organization?.licenseNumber || "-"}
                />
              </div>

              <div className="mt-6 rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#7c4a5e]">
                  Notes
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#7c4a5e]">
                  {organization?.description ||
                    organization?.notes ||
                    "This section contains the core organization identity and registration information used by the superadmin team for verification and lifecycle management."}
                </p>
              </div>
            </div>

            {/* Action center */}
            <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[#d1661c]">
                    Action center
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#31101e]">
                    Administrative actions
                  </h2>
                </div>

                <ShieldCheck className="h-6 w-6 text-[#2c8a49]" />
              </div>

              <div className="mt-6 space-y-4">
                {status === "PENDING" && (
                  <>
                    <ActionButton
                      title="Approve organization"
                      description="Move this organization into the approved state."
                      icon={CheckCircle2}
                      accent="from-[#2c8a49] to-[#5ec271]"
                      onClick={() => setShowApproveModal(true)}
                    />
                    <ActionButton
                      title="Reject organization"
                      description="Reject the application with a reason."
                      icon={XCircle}
                      accent="from-[#d93f42] to-[#f08a8d]"
                      onClick={() => setShowRejectModal(true)}
                    />
                  </>
                )}

                {status === "APPROVED" && (
                  <>
                    <ActionButton
                      title="Suspend organization"
                      description="Temporarily disable access for this organization."
                      icon={Ban}
                      accent="from-[#d1661c] to-[#f2994a]"
                      onClick={() => setShowSuspendModal(true)}
                    />
                    <ActionButton
                      title="View approval history"
                      description="Inspect how the organization reached approved state."
                      icon={Eye}
                      accent="from-[#1e5aa8] to-[#6fb1ff]"
                      onClick={() => toast("Use the status history below")}
                    />
                  </>
                )}

                {status === "SUSPENDED" && (
                  <>
                    <ActionButton
                      title="Reactivate organization"
                      description="Restore platform access for this organization."
                      icon={RefreshCw}
                      accent="from-[#2c8a49] to-[#5ec271]"
                      onClick={() => setShowReactivateModal(true)}
                    />
                    <ActionButton
                      title="Review history"
                      description="Check the full organization timeline."
                      icon={Eye}
                      accent="from-[#1e5aa8] to-[#6fb1ff]"
                      onClick={() => toast("Use the status history below")}
                    />
                  </>
                )}

                {status === "REJECTED" && (
                  <>
                    <ActionButton
                      title="Reactivate organization"
                      description="Restore the record and return it to active review."
                      icon={RefreshCw}
                      accent="from-[#2c8a49] to-[#5ec271]"
                      onClick={() => setShowReactivateModal(true)}
                    />
                    <ActionButton
                      title="Re-review rejection"
                      description="Re-open the application if needed."
                      icon={ShieldAlert}
                      accent="from-[#d1661c] to-[#f2994a]"
                      onClick={() => setShowApproveModal(true)}
                    />
                  </>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-xl bg-[#ffe0e8] p-2">
                    <AlertTriangle className="h-4 w-4 text-[#7c4a5e]" />
                  </div>
                  <p className="text-sm leading-relaxed text-[#7c4a5e]">
                    Approve, reject, suspend, and reactivate actions are
                    protected through confirmation dialogs to prevent accidental
                    changes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact + Admin */}
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            {/* Contact */}
            <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#2c8a49]">
                  Contact information
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#31101e]">
                  Organization contact details
                </h2>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <DetailRow
                  icon={Mail}
                  label="Organization Email"
                  value={organization?.email || "-"}
                />
                <DetailRow
                  icon={Phone}
                  label="Phone Number"
                  value={
                    organization?.phone || organization?.contactNumber || "-"
                  }
                />
                <DetailRow
                  icon={MapPin}
                  label="City"
                  value={
                    organization?.city || organization?.location?.city || "-"
                  }
                />
                <DetailRow
                  icon={MapPin}
                  label="State"
                  value={
                    organization?.state || organization?.location?.state || "-"
                  }
                />
                <DetailRow
                  icon={MapPin}
                  label="Address"
                  value={
                    organization?.address ||
                    organization?.location?.address ||
                    "-"
                  }
                />
                <DetailRow
                  icon={Hash}
                  label="Pincode"
                  value={
                    organization?.pincode ||
                    organization?.location?.pincode ||
                    "-"
                  }
                />
              </div>
            </div>

            {/* Admin */}
            <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#9b1e27]">
                  Admin user
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#31101e]">
                  Admin account information
                </h2>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <DetailRow
                  icon={UserCog}
                  label="Admin Name"
                  value={adminUser?.name || organization?.adminName || "-"}
                />
                <DetailRow
                  icon={Mail}
                  label="Admin Email"
                  value={adminUser?.email || organization?.adminEmail || "-"}
                />
                <DetailRow
                  icon={BadgeCheck}
                  label="Admin Role"
                  value={adminUser?.role || organization?.adminRole || "ADMIN"}
                />
                <DetailRow
                  icon={Clock3}
                  label="Last Login"
                  value={formatDateTime(
                    adminUser?.lastLogin || organization?.lastLogin,
                  )}
                />
              </div>

              <div className="mt-6 rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[#7c4a5e]">
                  Account readiness
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#7c4a5e]">
                  The admin account is the operational account used after
                  approval. Keep credentials secure and ensure email identity is
                  correct before activation.
                </p>
              </div>
            </div>
          </div>

          {/* Status history */}
          <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#d93f42]">
                  Status history
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#31101e]">
                  Lifecycle timeline
                </h2>
              </div>
              <Clock3 className="h-6 w-6 text-[#7c4a5e]" />
            </div>

            <div className="mt-6">
              {statusHistory.length > 0 ? (
                <div className="relative ml-4 space-y-5 border-l border-[#ffe0e8] pl-8">
                  {statusHistory.map((item, index) => {
                    const itemStatus = normalizeStatus(
                      item.status || item.state || item.action,
                    );
                    const active = index === statusHistory.length - 1;

                    return (
                      <div
                        key={item._id || item.id || index}
                        className="relative"
                      >
                        <div
                          className={`absolute -left-[41px] top-1 h-4 w-4 rounded-full border-4 ${
                            active
                              ? "border-[#2c8a49] bg-[#2c8a49]"
                              : "border-[#ffe0e8] bg-[#a44255]"
                          }`}
                        />
                        <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-5">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold text-[#31101e]">
                                {itemStatus || "UPDATED"}
                              </p>
                              <p className="mt-1 text-sm text-[#7c4a5e]">
                                {item.message ||
                                  item.reason ||
                                  item.note ||
                                  item.description ||
                                  "Status update"}
                              </p>
                            </div>
                            <p className="text-xs text-[#a44255]">
                              {formatDateTime(
                                item.createdAt || item.timestamp || item.date,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-8 text-center text-[#7c4a5e]">
                  No status history available.
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-10 text-center shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
          <Building2 className="mx-auto h-12 w-12 text-[#a44255]" />
          <h2 className="mt-4 text-2xl font-semibold text-[#31101e]">
            Organization not found
          </h2>
          <p className="mt-2 text-[#7c4a5e]">
            The requested organization could not be loaded.
          </p>
          <button
            onClick={() => navigate("/superadmin/organizations")}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1e5aa8] to-[#6fb1ff] px-5 py-3 font-semibold text-white shadow-md transition hover:shadow-lg"
          >
            Back to Organizations
          </button>
        </div>
      )}

      {/* Modals */}
      {showApproveModal && (
        <ConfirmModal
          title="Approve organization"
          description="Approve this organization and move it to the active state."
          confirmLabel={processing ? "Approving..." : "Approve"}
          accent="from-[#2c8a49] to-[#5ec271]"
          icon={CheckCircle2}
          loading={processing}
          onClose={() => {
            if (processing) return;
            setShowApproveModal(false);
          }}
          onConfirm={handleApprove}
        />
      )}

      {showRejectModal && (
        <ReasonModal
          title="Reject organization"
          description="Provide a rejection reason before finalizing the decision."
          reason={rejectReason}
          setReason={setRejectReason}
          confirmLabel={processing ? "Rejecting..." : "Reject"}
          accent="from-[#d93f42] to-[#f08a8d]"
          icon={XCircle}
          loading={processing}
          onClose={() => {
            if (processing) return;
            setShowRejectModal(false);
            setRejectReason("");
          }}
          onConfirm={handleReject}
        />
      )}

      {showSuspendModal && (
        <ReasonModal
          title="Suspend organization"
          description="Provide a reason before suspending this organization."
          reason={suspendReason}
          setReason={setSuspendReason}
          confirmLabel={processing ? "Suspending..." : "Suspend"}
          accent="from-[#d1661c] to-[#f2994a]"
          icon={Ban}
          loading={processing}
          onClose={() => {
            if (processing) return;
            setShowSuspendModal(false);
            setSuspendReason("");
          }}
          onConfirm={handleSuspend}
        />
      )}

      {showReactivateModal && (
        <ConfirmModal
          title="Reactivate organization"
          description="Restore access and move this organization back into an active state."
          confirmLabel={processing ? "Reactivating..." : "Reactivate"}
          accent="from-[#1e5aa8] to-[#6fb1ff]"
          icon={RefreshCw}
          loading={processing}
          onClose={() => {
            if (processing) return;
            setShowReactivateModal(false);
          }}
          onConfirm={handleReactivate}
        />
      )}
    </section>
  );
}

function DetailRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-[#ffe0e8] p-2">
          <Icon className="h-4 w-4 text-[#7c4a5e]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-[#7c4a5e]">
            {label}
          </p>
          <p
            className={`mt-1 break-words text-sm font-semibold ${mono ? "font-mono" : ""} text-[#31101e]`}
          >
            {value || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent = "text-[#31101e]", mono = false }) {
  return (
    <div className="rounded-2xl border border-[#ffe0e8] bg-white/90 p-5 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
      <p className="text-xs text-[#7c4a5e]">{label}</p>
      <p
        className={`mt-2 break-words text-lg font-semibold ${accent} ${mono ? "font-mono" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function ActionButton({ title, description, icon: Icon, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group w-full rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-5 text-left transition hover:-translate-y-1 hover:border-[#ff4d6d] hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className={`rounded-2xl bg-gradient-to-r ${accent} p-3`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-[#31101e]">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-[#7c4a5e]">
            {description}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#ff4d6d] group-hover:text-[#9b1e27]">
            Open
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </button>
  );
}

function SkeletonCard({ height = "h-64" }) {
  return (
    <div
      className={`animate-pulse rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)] ${height}`}
    >
      <div className="h-4 w-28 rounded bg-[#ffe0e8]" />
      <div className="mt-4 h-8 w-56 rounded bg-[#ffe0e8]" />
      <div className="mt-6 h-4 w-full rounded bg-[#ffe0e8]" />
      <div className="mt-3 h-4 w-5/6 rounded bg-[#ffe0e8]" />
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="h-20 rounded-2xl bg-[#ffe0e8]" />
        <div className="h-20 rounded-2xl bg-[#ffe0e8]" />
      </div>
    </div>
  );
}

function ConfirmModal({
  title,
  description,
  confirmLabel,
  accent,
  icon: Icon,
  loading,
  onClose,
  onConfirm,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-[#ffe0e8] bg-white p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accent}`}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-[#31101e]">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#7c4a5e]">
              {description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-[#f2c8c8] bg-white/80 p-2 text-[#7c4a5e] transition hover:bg-white hover:text-[#31101e]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-[#f2c8c8] bg-white/80 px-5 py-4 font-semibold text-[#ff4d6d] transition hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-2xl bg-gradient-to-r ${accent} px-5 py-4 font-bold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReasonModal({
  title,
  description,
  reason,
  setReason,
  confirmLabel,
  accent,
  icon: Icon,
  loading,
  onClose,
  onConfirm,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-[#ffe0e8] bg-white p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accent}`}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-[#31101e]">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#7c4a5e]">
              {description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-[#f2c8c8] bg-white/80 p-2 text-[#7c4a5e] transition hover:bg-white hover:text-[#31101e]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-[#7c4a5e]">
            Reason
          </label>
          <textarea
            rows={5}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter a reason..."
            className="w-full resize-none rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] px-5 py-4 text-[#31101e] placeholder:text-[#a44255] outline-none transition focus:border-[#ff4d6d] focus:bg-white"
          />
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-[#f2c8c8] bg-white/80 px-5 py-4 font-semibold text-[#ff4d6d] transition hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-2xl bg-gradient-to-r ${accent} px-5 py-4 font-bold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
