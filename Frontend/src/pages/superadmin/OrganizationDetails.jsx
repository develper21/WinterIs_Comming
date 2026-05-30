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
      return "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";
    case "PENDING":
      return "bg-amber-500/10 border-amber-500/20 text-amber-300";
    case "REJECTED":
      return "bg-rose-500/10 border-rose-500/20 text-rose-300";
    case "SUSPENDED":
      return "bg-slate-500/10 border-slate-500/20 text-slate-300";
    default:
      return "bg-slate-500/10 border-slate-500/20 text-slate-300";
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
    <div className="min-h-screen overflow-hidden bg-[#050816] text-white relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute top-24 right-0 h-[420px] w-[420px] rounded-full bg-rose-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between gap-4">
              <button
                onClick={() => navigate("/superadmin/organizations")}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Organizations
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>

                <button
                  onClick={() => navigate("/superadmin/dashboard")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  Dashboard
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10 space-y-8">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 lg:p-10">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="absolute left-0 bottom-0 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  Organization details and action center
                </div>

                <h1 className="mt-6 text-4xl sm:text-5xl font-black leading-tight text-white">
                  {loading
                    ? "Loading organization..."
                    : organization?.organizationName ||
                      organization?.name ||
                      "Organization Details"}
                </h1>

                <p className="mt-4 max-w-3xl text-gray-400 leading-relaxed">
                  Inspect the full organization profile, contact information,
                  license details, admin account, and status history from one
                  secure page.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Status"
                  value={getStatusLabel(status)}
                  accent="text-cyan-300"
                />
                <StatCard
                  label="Type"
                  value={displayType}
                  accent="text-emerald-300"
                />
                <StatCard
                  label="Code"
                  value={
                    organization?.organizationCode ||
                    organization?._id ||
                    organization?.id ||
                    "-"
                  }
                  accent="text-amber-300"
                  mono
                />
                <StatCard
                  label="Submitted"
                  value={formatDate(
                    organization?.createdAt || organization?.submittedAt,
                  )}
                  accent="text-rose-300"
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-[28px] border border-amber-500/20 bg-amber-500/10 p-4 text-amber-200">
              {error}
            </div>
          )}

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
              <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                {/* Profile */}
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.25em] text-cyan-400">
                        Profile
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-white">
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
                      value={
                        organization?.organizationName || organization?.name
                      }
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

                  <div className="mt-6 rounded-[28px] border border-white/10 bg-slate-950/40 p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-gray-400">
                      Notes
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-gray-300">
                      {organization?.description ||
                        organization?.notes ||
                        "This section contains the core organization identity and registration information used by the superadmin team for verification and lifecycle management."}
                    </p>
                  </div>
                </div>

                {/* Action center */}
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
                        Action center
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-white">
                        Administrative actions
                      </h2>
                    </div>

                    <ShieldCheck className="h-6 w-6 text-emerald-300" />
                  </div>

                  <div className="mt-6 space-y-4">
                    {status === "PENDING" && (
                      <>
                        <ActionButton
                          title="Approve organization"
                          description="Move this organization into the approved state."
                          icon={CheckCircle2}
                          accent="from-emerald-500 to-teal-500"
                          onClick={() => setShowApproveModal(true)}
                        />
                        <ActionButton
                          title="Reject organization"
                          description="Reject the application with a reason."
                          icon={XCircle}
                          accent="from-rose-500 to-red-500"
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
                          accent="from-amber-500 to-orange-500"
                          onClick={() => setShowSuspendModal(true)}
                        />
                        <ActionButton
                          title="View approval history"
                          description="Inspect how the organization reached approved state."
                          icon={Eye}
                          accent="from-cyan-500 to-blue-500"
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
                          accent="from-emerald-500 to-teal-500"
                          onClick={() => setShowReactivateModal(true)}
                        />
                        <ActionButton
                          title="Review history"
                          description="Check the full organization timeline."
                          icon={Eye}
                          accent="from-cyan-500 to-blue-500"
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
                          accent="from-emerald-500 to-teal-500"
                          onClick={() => setShowReactivateModal(true)}
                        />
                        <ActionButton
                          title="Re-review rejection"
                          description="Re-open the application if needed."
                          icon={ShieldAlert}
                          accent="from-amber-500 to-orange-500"
                          onClick={() => setShowApproveModal(true)}
                        />
                      </>
                    )}
                  </div>

                  <div className="mt-6 rounded-[28px] border border-white/10 bg-slate-950/40 p-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 rounded-xl bg-white/10 p-2">
                        <AlertTriangle className="h-4 w-4 text-gray-300" />
                      </div>
                      <p className="text-sm leading-relaxed text-gray-300">
                        Approve, reject, suspend, and reactivate actions are
                        protected through confirmation dialogs to prevent
                        accidental changes.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact + Admin */}
              <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                {/* Contact */}
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-emerald-400">
                      Contact information
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-white">
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
                        organization?.phone ||
                        organization?.contactNumber ||
                        "-"
                      }
                    />
                    <DetailRow
                      icon={MapPin}
                      label="City"
                      value={
                        organization?.city ||
                        organization?.location?.city ||
                        "-"
                      }
                    />
                    <DetailRow
                      icon={MapPin}
                      label="State"
                      value={
                        organization?.state ||
                        organization?.location?.state ||
                        "-"
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
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-violet-400">
                      Admin user
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-white">
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
                      value={
                        adminUser?.email || organization?.adminEmail || "-"
                      }
                    />
                    <DetailRow
                      icon={BadgeCheck}
                      label="Admin Role"
                      value={
                        adminUser?.role || organization?.adminRole || "ADMIN"
                      }
                    />
                    <DetailRow
                      icon={Clock3}
                      label="Last Login"
                      value={formatDateTime(
                        adminUser?.lastLogin || organization?.lastLogin,
                      )}
                    />
                  </div>

                  <div className="mt-6 rounded-[28px] border border-white/10 bg-slate-950/40 p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-gray-400">
                      Account readiness
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-gray-300">
                      The admin account is the operational account used after
                      approval. Keep credentials secure and ensure email
                      identity is correct before activation.
                    </p>
                  </div>
                </div>
              </section>

              {/* Status history */}
              <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-rose-400">
                      Status history
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-white">
                      Lifecycle timeline
                    </h2>
                  </div>
                  <Clock3 className="h-6 w-6 text-gray-400" />
                </div>

                <div className="mt-6">
                  {statusHistory.length > 0 ? (
                    <div className="relative ml-4 space-y-5 border-l border-white/10 pl-8">
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
                                  ? "border-emerald-300 bg-emerald-300"
                                  : "border-white/20 bg-slate-700"
                              }`}
                            />
                            <div className="rounded-[24px] border border-white/10 bg-slate-950/40 p-5">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="font-bold text-white">
                                    {itemStatus || "UPDATED"}
                                  </p>
                                  <p className="mt-1 text-sm text-gray-400">
                                    {item.message ||
                                      item.reason ||
                                      item.note ||
                                      item.description ||
                                      "Status update"}
                                  </p>
                                </div>
                                <p className="text-xs text-gray-500">
                                  {formatDateTime(
                                    item.createdAt ||
                                      item.timestamp ||
                                      item.date,
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-8 text-center text-gray-400">
                      No status history available.
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
              <Building2 className="mx-auto h-12 w-12 text-gray-500" />
              <h2 className="mt-4 text-2xl font-black text-white">
                Organization not found
              </h2>
              <p className="mt-2 text-gray-400">
                The requested organization could not be loaded.
              </p>
              <button
                onClick={() => navigate("/superadmin/organizations")}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 font-semibold text-white transition hover:scale-[1.02]"
              >
                Back to Organizations
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showApproveModal && (
        <ConfirmModal
          title="Approve organization"
          description="Approve this organization and move it to the active state."
          confirmLabel={processing ? "Approving..." : "Approve"}
          accent="from-emerald-500 to-teal-500"
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
          accent="from-rose-500 to-red-500"
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
          accent="from-amber-500 to-orange-500"
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
          accent="from-cyan-500 to-blue-500"
          icon={RefreshCw}
          loading={processing}
          onClose={() => {
            if (processing) return;
            setShowReactivateModal(false);
          }}
          onConfirm={handleReactivate}
        />
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-white/10 p-2">
          <Icon className="h-4 w-4 text-gray-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
            {label}
          </p>
          <p
            className={`mt-1 break-words text-sm font-semibold ${mono ? "font-mono" : ""} text-white`}
          >
            {value || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent = "text-white", mono = false }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <p className="text-xs text-gray-400">{label}</p>
      <p
        className={`mt-2 break-words text-lg font-black ${accent} ${mono ? "font-mono" : ""}`}
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
      className="group w-full rounded-[26px] border border-white/10 bg-slate-950/40 p-5 text-left transition hover:-translate-y-1 hover:border-white/20"
    >
      <div className="flex items-start gap-4">
        <div className={`rounded-2xl bg-gradient-to-r ${accent} p-3`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-400">
            {description}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-300 group-hover:text-white">
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
      className={`animate-pulse rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl ${height}`}
    >
      <div className="h-4 w-28 rounded bg-white/10" />
      <div className="mt-4 h-8 w-56 rounded bg-white/10" />
      <div className="mt-6 h-4 w-full rounded bg-white/10" />
      <div className="mt-3 h-4 w-5/6 rounded bg-white/10" />
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="h-20 rounded-2xl bg-white/10" />
        <div className="h-20 rounded-2xl bg-white/10" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-[#09111f] p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accent}`}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-black text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              {description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-semibold text-white transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-2xl bg-gradient-to-r ${accent} px-5 py-4 font-bold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60`}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-[#09111f] p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accent}`}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-black text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              {description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Reason
          </label>
          <textarea
            rows={5}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter a reason..."
            className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-500 outline-none transition focus:border-white/20 focus:bg-white/10"
          />
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-semibold text-white transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-2xl bg-gradient-to-r ${accent} px-5 py-4 font-bold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
