import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  Building2,
  Clock3,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Eye,
  BadgeCheck,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  MapPin,
  Mail,
  Phone,
  UserRound,
  CalendarDays,
  Hash,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_BASE = "http://localhost:5000";

const ENDPOINTS = {
  pendingOrganizations: "/api/superadmin/organizations/pending",
  organizationDetails: (id) => `/api/superadmin/organizations/${id}`,
  approveOrganization: (id) => `/api/superadmin/organizations/${id}/approve`,
  rejectOrganization: (id) => `/api/superadmin/organizations/${id}/reject`,
};

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "hospital", label: "Hospital" },
  { value: "bloodbank", label: "Blood Bank" },
  { value: "ngo", label: "NGO" },
];

const safeArray = (value) => (Array.isArray(value) ? value : []);

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
};

export default function Approvals() {
  const navigate = useNavigate();
  const auth = useAuth() || {};
  const user = auth.user || auth.admin || null;
  const token = auth.token || localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/superadmin-login", { replace: true });
      return;
    }
  }, [token, navigate]);

  const api = useMemo(() => {
    return axios.create({
      baseURL: API_BASE,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }, [token]);

  const loadPendingOrganizations = async (signal) => {
    setError("");
    try {
      const res = await api.get(ENDPOINTS.pendingOrganizations, {
        params: {
          page,
          limit,
          type: typeFilter === "all" ? undefined : typeFilter,
          search: search.trim() || undefined,
        },
        signal,
      });

      const payload = res.data?.data || res.data || {};
      const items = safeArray(
        payload.items ||
          payload.organizations ||
          payload.pendingOrganizations ||
          payload,
      );

      setOrganizations(items);
      setTotalPages(payload.totalPages || payload.pagination?.totalPages || 1);
      setTotalItems(
        payload.totalItems || payload.pagination?.totalItems || items.length,
      );
    } catch (err) {
      if (err.name === "CanceledError") return;
      console.error("Failed to load pending organizations:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load pending organizations. Check the backend route names if needed.",
      );
      setOrganizations([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      loadPendingOrganizations(controller.signal);
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, typeFilter, search, token]);

  const handleRefresh = () => {
    setRefreshing(true);
    const controller = new AbortController();
    loadPendingOrganizations(controller.signal);
  };

  const openDetails = async (org) => {
    setSelectedOrganization(org);
    setSelectedDetails(org || null);

    if (!org?._id && !org?.id) return;

    const id = org._id || org.id;
    setDetailsLoading(true);

    try {
      const res = await api.get(ENDPOINTS.organizationDetails(id));
      const payload = res.data?.data || res.data || {};
      setSelectedDetails(
        payload.organization || payload.data || payload || org,
      );
    } catch (err) {
      console.error("Failed to load organization details:", err);
      toast.error(
        err.response?.data?.message || "Failed to load organization details",
      );
      setSelectedDetails(org);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedOrganization(null);
    setSelectedDetails(null);
  };

  const openApproveModal = (org) => {
    setSelectedOrganization(org);
    setShowApproveModal(true);
  };

  const openRejectModal = (org) => {
    setSelectedOrganization(org);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (!selectedOrganization) return;

    const id = selectedOrganization._id || selectedOrganization.id;
    setProcessing(true);

    try {
      const res = await api.post(ENDPOINTS.approveOrganization(id), {});
      toast.success(res.data?.message || "Organization approved successfully");
      setShowApproveModal(false);
      setSelectedOrganization(null);
      await loadPendingOrganizations();
      if (selectedDetails?._id === id || selectedDetails?.id === id) {
        setSelectedDetails((prev) =>
          prev ? { ...prev, status: "APPROVED" } : prev,
        );
      }
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
    if (!selectedOrganization) return;

    const id = selectedOrganization._id || selectedOrganization.id;
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setProcessing(true);

    try {
      const res = await api.post(ENDPOINTS.rejectOrganization(id), {
        reason: rejectReason.trim(),
      });
      toast.success(res.data?.message || "Organization rejected successfully");
      setShowRejectModal(false);
      setSelectedOrganization(null);
      setRejectReason("");
      await loadPendingOrganizations();
      if (selectedDetails?._id === id || selectedDetails?.id === id) {
        setSelectedDetails((prev) =>
          prev ? { ...prev, status: "REJECTED" } : prev,
        );
      }
    } catch (err) {
      console.error("Reject error:", err);
      toast.error(
        err.response?.data?.message || "Failed to reject organization",
      );
    } finally {
      setProcessing(false);
    }
  };

  const typeCount = organizations.reduce(
    (acc, org) => {
      const t = String(org.type || org.organizationType || "").toLowerCase();
      if (t.includes("hospital")) acc.hospital += 1;
      else if (t.includes("blood")) acc.bloodbank += 1;
      else if (t.includes("ngo")) acc.ngo += 1;
      return acc;
    },
    { hospital: 0, bloodbank: 0, ngo: 0 },
  );

  const visibleOrganizations = organizations;

  return (
    <div className="min-h-screen overflow-hidden bg-[#050816] text-white relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 h-[420px] w-[420px] rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute top-24 right-0 h-[420px] w-[420px] rounded-full bg-rose-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-amber-400">
                  Superadmin Approvals
                </p>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  Pending Organizations
                </h1>
              </div>

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

        <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 lg:p-10">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
            <div className="absolute left-0 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
                  <Sparkles className="h-4 w-4" />
                  Approve hospitals, blood banks, and NGOs from one place
                </div>

                <h2 className="mt-6 text-4xl sm:text-5xl font-black leading-tight text-white">
                  Review registrations with filters, search, and live details
                </h2>

                <p className="mt-4 max-w-3xl text-gray-400 leading-relaxed">
                  Use the approval queue to inspect organization data, open a
                  full details view, and approve or reject applications with a
                  secure modal flow.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs text-gray-400">Pending</p>
                  <p className="mt-2 text-3xl font-black text-amber-300">
                    {loading ? "..." : totalItems}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Applications</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs text-gray-400">Hospital</p>
                  <p className="mt-2 text-3xl font-black text-cyan-300">
                    {loading ? "..." : typeCount.hospital}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Queued</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs text-gray-400">NGO</p>
                  <p className="mt-2 text-3xl font-black text-emerald-300">
                    {loading ? "..." : typeCount.ngo}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Queued</p>
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="mt-6 rounded-[28px] border border-amber-500/20 bg-amber-500/10 p-4 text-amber-200">
              {error}
            </div>
          )}

          {/* Filters */}
          <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search organization name, code, city, email..."
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/40 py-4 pl-12 pr-5 text-white placeholder:text-gray-500 outline-none transition focus:border-amber-500 focus:bg-white/10"
                  />
                </div>

                <div className="relative">
                  <Filter className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/40 py-4 pl-12 pr-12 text-white outline-none transition focus:border-amber-500 focus:bg-white/10"
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="bg-slate-950"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("all");
                    setPage(1);
                  }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                  Current view
                </p>
                <p className="mt-1 font-semibold text-white">
                  {TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label ||
                    "All Types"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                  Page
                </p>
                <p className="mt-1 font-semibold text-white">
                  {page} / {totalPages}
                </p>
              </div>
            </div>
          </section>

          {/* Content */}
          <section className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            {/* List */}
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
                    Approval queue
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    Pending organizations
                  </h3>
                </div>
                <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-gray-300">
                  <Clock3 className="h-4 w-4 text-amber-300" />
                  {loading ? "Loading..." : `${totalItems} pending`}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="animate-pulse rounded-[26px] border border-white/10 bg-slate-950/40 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-3">
                          <div className="h-4 w-56 rounded bg-white/10" />
                          <div className="h-3 w-44 rounded bg-white/10" />
                          <div className="h-3 w-32 rounded bg-white/10" />
                        </div>
                        <div className="h-10 w-24 rounded-2xl bg-white/10" />
                      </div>
                    </div>
                  ))
                ) : visibleOrganizations.length > 0 ? (
                  visibleOrganizations.map((org) => {
                    const id = org._id || org.id || org.organizationCode;
                    const type = String(
                      org.type || org.organizationType || "",
                    ).toLowerCase();
                    const isActive =
                      selectedOrganization &&
                      (selectedOrganization._id ||
                        selectedOrganization.id ||
                        selectedOrganization.organizationCode) === id;

                    const typeLabel = type.includes("hospital")
                      ? "Hospital"
                      : type.includes("blood")
                        ? "Blood Bank"
                        : type.includes("ngo")
                          ? "NGO"
                          : org.type || org.organizationType || "Organization";

                    return (
                      <div
                        key={id}
                        className={`rounded-[26px] border p-5 transition cursor-pointer ${
                          isActive
                            ? "border-amber-500/40 bg-amber-500/10"
                            : "border-white/10 bg-slate-950/40 hover:border-white/20"
                        }`}
                        onClick={() => openDetails(org)}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                              <h4 className="text-lg font-bold text-white">
                                {org.organizationName ||
                                  org.name ||
                                  "Organization"}
                              </h4>
                              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                                {typeLabel}
                              </span>
                              {org.status && (
                                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                                  {org.status}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-400">
                              <span className="inline-flex items-center gap-2">
                                <Hash className="h-4 w-4" />
                                {org.organizationCode || id}
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {org.city ||
                                  org.location?.city ||
                                  "Unknown city"}
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {org.email || org.adminEmail || "No email"}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetails(org);
                              }}
                              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                            >
                              <Eye className="h-4 w-4" />
                              Details
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openApproveModal(org);
                              }}
                              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Approve
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openRejectModal(org);
                              }}
                              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-10 text-center">
                    <BadgeCheck className="mx-auto h-12 w-12 text-gray-500" />
                    <h4 className="mt-4 text-xl font-bold text-white">
                      No pending organizations found
                    </h4>
                    <p className="mt-2 text-gray-400">
                      Try changing the filter or search query.
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-6">
                  <p className="text-sm text-gray-400">
                    Showing page {page} of {totalPages}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </button>

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const start = Math.max(
                        1,
                        Math.min(page - 2, totalPages - 4),
                      );
                      const current = start + i;
                      if (current > totalPages) return null;
                      const active = current === page;
                      return (
                        <button
                          key={current}
                          onClick={() => setPage(current)}
                          className={`h-12 w-12 rounded-2xl border text-sm font-semibold transition ${
                            active
                              ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
                              : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                          }`}
                        >
                          {current}
                        </button>
                      );
                    })}

                    <button
                      disabled={page >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Details Panel */}
            <aside className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-cyan-400">
                    Organization details
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    {selectedDetails ? "Overview" : "Select an organization"}
                  </h3>
                </div>

                {selectedOrganization && (
                  <button
                    onClick={closeDetails}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3 text-gray-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="mt-6">
                {!selectedOrganization ? (
                  <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-8 text-center">
                    <Building2 className="mx-auto h-12 w-12 text-gray-500" />
                    <p className="mt-4 text-gray-400">
                      Click any organization to view complete details.
                    </p>
                  </div>
                ) : detailsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="animate-pulse rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                      >
                        <div className="h-3 w-24 rounded bg-white/10" />
                        <div className="mt-2 h-4 w-40 rounded bg-white/10" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15">
                          <Building2 className="h-7 w-7 text-amber-300" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-white">
                            {selectedDetails?.organizationName ||
                              selectedDetails?.name ||
                              "Organization"}
                          </h4>
                          <p className="mt-1 text-sm text-gray-400">
                            {selectedDetails?.organizationType ||
                              selectedDetails?.type ||
                              "Pending organization"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <InfoRow
                        icon={Hash}
                        label="Organization Code"
                        value={
                          selectedDetails?.organizationCode ||
                          selectedDetails?._id ||
                          selectedDetails?.id
                        }
                      />
                      <InfoRow
                        icon={Mail}
                        label="Organization Email"
                        value={
                          selectedDetails?.email ||
                          selectedDetails?.adminEmail ||
                          "-"
                        }
                      />
                      <InfoRow
                        icon={Phone}
                        label="Phone Number"
                        value={
                          selectedDetails?.phone ||
                          selectedDetails?.contactNumber ||
                          "-"
                        }
                      />
                      <InfoRow
                        icon={MapPin}
                        label="City"
                        value={
                          selectedDetails?.city ||
                          selectedDetails?.location?.city ||
                          "-"
                        }
                      />
                      <InfoRow
                        icon={MapPin}
                        label="State"
                        value={
                          selectedDetails?.state ||
                          selectedDetails?.location?.state ||
                          "-"
                        }
                      />
                      <InfoRow
                        icon={UserRound}
                        label="Contact Person"
                        value={
                          selectedDetails?.contactPerson ||
                          selectedDetails?.adminName ||
                          "-"
                        }
                      />
                      <InfoRow
                        icon={FileText}
                        label="License Number"
                        value={selectedDetails?.licenseNumber || "-"}
                      />
                      <InfoRow
                        icon={CalendarDays}
                        label="Submitted"
                        value={formatDate(
                          selectedDetails?.createdAt ||
                            selectedDetails?.submittedAt,
                        )}
                      />
                      <InfoRow
                        icon={Clock3}
                        label="Status"
                        value={selectedDetails?.status || "PENDING"}
                        highlight
                      />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                      <p className="text-sm uppercase tracking-[0.2em] text-gray-400">
                        Notes
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-gray-300">
                        This panel is intended to help you inspect the
                        organization before approving or rejecting it. Use the
                        action buttons in the list to proceed with a secure
                        modal confirmation.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </section>
        </main>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedOrganization && (
        <ConfirmModal
          title="Approve organization"
          description={`Approve ${selectedOrganization.organizationName || selectedOrganization.name || "this organization"} and move it out of the pending queue.`}
          confirmLabel={processing ? "Approving..." : "Approve"}
          confirmAccent="from-emerald-500 to-teal-500"
          icon={CheckCircle2}
          onClose={() => {
            if (processing) return;
            setShowApproveModal(false);
            setSelectedOrganization(null);
          }}
          onConfirm={handleApprove}
          loading={processing}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedOrganization && (
        <RejectModal
          title="Reject organization"
          description={`Reject ${selectedOrganization.organizationName || selectedOrganization.name || "this organization"} with a reason so the team can review the decision.`}
          reason={rejectReason}
          setReason={setRejectReason}
          onClose={() => {
            if (processing) return;
            setShowRejectModal(false);
            setSelectedOrganization(null);
            setRejectReason("");
          }}
          onConfirm={handleReject}
          loading={processing}
        />
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, highlight = false }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-xl p-2 ${highlight ? "bg-amber-500/15" : "bg-white/10"}`}
        >
          <Icon
            className={`h-4 w-4 ${highlight ? "text-amber-300" : "text-gray-300"}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
            {label}
          </p>
          <p
            className={`mt-1 break-words text-sm font-semibold ${highlight ? "text-amber-300" : "text-white"}`}
          >
            {value || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  title,
  description,
  confirmLabel,
  confirmAccent,
  icon: Icon,
  onClose,
  onConfirm,
  loading,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-[#09111f] p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${confirmAccent}`}
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
            className={`flex-1 rounded-2xl bg-gradient-to-r ${confirmAccent} px-5 py-4 font-bold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectModal({
  title,
  description,
  reason,
  setReason,
  onClose,
  onConfirm,
  loading,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-[#09111f] p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-500">
            <XCircle className="h-7 w-7 text-white" />
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
            Rejection reason
          </label>
          <textarea
            rows={5}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this organization is being rejected..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-500 outline-none transition focus:border-rose-500 focus:bg-white/10 resize-none"
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
            className="flex-1 rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 px-5 py-4 font-bold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
