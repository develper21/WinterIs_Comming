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
  pendingOrganizations: "/api/admin/approvals/pending/all",
  organizationDetails: (id) => `/api/admin/approvals/${id}`,
  approveOrganization: "/api/admin/approvals/approve",
  rejectOrganization: "/api/admin/approvals/reject",
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

    const organizationCode =
      selectedOrganization.organizationCode ||
      selectedOrganization.registrationCode;
    setProcessing(true);

    try {
      const res = await api.post(ENDPOINTS.approveOrganization, {
        organizationCode,
        approvalRemarks: "Approved by Superadmin",
      });
      toast.success(res.data?.message || "Organization approved successfully");
      setShowApproveModal(false);
      setSelectedOrganization(null);
      await loadPendingOrganizations();
      if (
        selectedDetails?._id === selectedOrganization._id ||
        selectedDetails?.id === selectedOrganization.id
      ) {
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

    const organizationCode =
      selectedOrganization.organizationCode ||
      selectedOrganization.registrationCode;
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setProcessing(true);

    try {
      const res = await api.post(ENDPOINTS.rejectOrganization, {
        organizationCode,
        rejectionReason: rejectReason.trim(),
      });
      toast.success(res.data?.message || "Organization rejected successfully");
      setShowRejectModal(false);
      setSelectedOrganization(null);
      setRejectReason("");
      await loadPendingOrganizations();
      if (
        selectedDetails?._id === selectedOrganization._id ||
        selectedDetails?.id === selectedOrganization.id
      ) {
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
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
            Approvals
          </p>
          <h3 className="text-3xl font-semibold text-[#31101e]">
            Pending Organizations
          </h3>
          <p className="text-sm text-[#7c4a5e]">
            Review registrations with filters, search, and live details
          </p>
        </div>

        <div className="flex gap-3">
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
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-[#ffe0e8] bg-white/90 p-5 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
          <p className="text-xs text-[#7c4a5e]">Pending</p>
          <p className="mt-2 text-3xl font-semibold text-[#d1661c]">
            {loading ? "..." : totalItems}
          </p>
          <p className="mt-1 text-xs text-[#a44255]">Applications</p>
        </div>
        <div className="rounded-2xl border border-[#ffe0e8] bg-white/90 p-5 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
          <p className="text-xs text-[#7c4a5e]">Hospital</p>
          <p className="mt-2 text-3xl font-semibold text-[#1e5aa8]">
            {loading ? "..." : typeCount.hospital}
          </p>
          <p className="mt-1 text-xs text-[#a44255]">Queued</p>
        </div>
        <div className="rounded-2xl border border-[#ffe0e8] bg-white/90 p-5 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
          <p className="text-xs text-[#7c4a5e]">NGO</p>
          <p className="mt-2 text-3xl font-semibold text-[#2c8a49]">
            {loading ? "..." : typeCount.ngo}
          </p>
          <p className="mt-1 text-xs text-[#a44255]">Queued</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c4a5e]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search organization name, code, city, email..."
              className="w-full rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] py-4 pl-12 pr-5 text-[#31101e] placeholder:text-[#a44255] outline-none transition focus:border-[#ff4d6d] focus:bg-white"
            />
          </div>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c4a5e]" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full appearance-none rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] py-4 pl-12 pr-12 text-[#31101e] outline-none transition focus:border-[#ff4d6d] focus:bg-white"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white">
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
            className="rounded-2xl border border-[#f2c8c8] bg-white/80 px-5 py-4 text-sm font-semibold text-[#ff4d6d] transition hover:bg-white"
          >
            Clear
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#7c4a5e]">
              Current view
            </p>
            <p className="mt-1 font-semibold text-[#31101e]">
              {TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label ||
                "All Types"}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.25em] text-[#7c4a5e]">
              Page
            </p>
            <p className="mt-1 font-semibold text-[#31101e]">
              {page} / {totalPages}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        {/* List */}
        <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#d1661c]">
                Approval queue
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
                Pending organizations
              </h3>
            </div>
            <div className="hidden md:flex items-center gap-2 rounded-full border border-[#ffe0e8] bg-[#fff7f9] px-4 py-2 text-sm text-[#7c4a5e]">
              <Clock3 className="h-4 w-4 text-[#d1661c]" />
              {loading ? "Loading..." : `${totalItems} pending`}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="h-4 w-56 rounded bg-[#ffe0e8]" />
                      <div className="h-3 w-44 rounded bg-[#ffe0e8]" />
                      <div className="h-3 w-32 rounded bg-[#ffe0e8]" />
                    </div>
                    <div className="h-10 w-24 rounded-2xl bg-[#ffe0e8]" />
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
                    className={`rounded-2xl border p-5 transition cursor-pointer ${
                      isActive
                        ? "border-[#ff4d6d] bg-[#fff0f3]"
                        : "border-[#ffe0e8] bg-[#fff7f9] hover:border-[#ff4d6d] hover:shadow-md"
                    }`}
                    onClick={() => openDetails(org)}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-lg font-semibold text-[#31101e]">
                            {org.organizationName || org.name || "Organization"}
                          </h4>
                          <span className="rounded-full border border-[#f2c8c8] bg-white/80 px-3 py-1 text-xs font-semibold text-[#7c4a5e]">
                            {typeLabel}
                          </span>
                          {org.status && (
                            <span className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                              {org.status}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#7c4a5e]">
                          <span className="inline-flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            {org.organizationCode || id}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {org.city || org.location?.city || "Unknown city"}
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
                          className="inline-flex items-center gap-2 rounded-2xl border border-[#f2c8c8] bg-white/80 px-4 py-3 text-sm font-semibold text-[#ff4d6d] transition hover:bg-white"
                        >
                          <Eye className="h-4 w-4" />
                          Details
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openApproveModal(org);
                          }}
                          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#2c8a49] to-[#5ec271] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openRejectModal(org);
                          }}
                          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#d93f42] to-[#f08a8d] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
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
              <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-10 text-center">
                <BadgeCheck className="mx-auto h-12 w-12 text-[#a44255]" />
                <h4 className="mt-4 text-xl font-semibold text-[#31101e]">
                  No pending organizations found
                </h4>
                <p className="mt-2 text-[#7c4a5e]">
                  Try changing the filter or search query.
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#ffe0e8] pt-6">
              <p className="text-sm text-[#7c4a5e]">
                Showing page {page} of {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#f2c8c8] bg-white/80 px-4 py-3 text-sm font-semibold text-[#ff4d6d] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const current = start + i;
                  if (current > totalPages) return null;
                  const active = current === page;
                  return (
                    <button
                      key={current}
                      onClick={() => setPage(current)}
                      className={`h-12 w-12 rounded-2xl border text-sm font-semibold transition ${
                        active
                          ? "border-[#ff4d6d] bg-[#fff0f3] text-[#ff4d6d]"
                          : "border-[#ffe0e8] bg-white/80 text-[#31101e] hover:bg-white"
                      }`}
                    >
                      {current}
                    </button>
                  );
                })}

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#f2c8c8] bg-white/80 px-4 py-3 text-sm font-semibold text-[#ff4d6d] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Details Panel */}
        <aside className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#1e5aa8]">
                Organization details
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
                {selectedDetails ? "Overview" : "Select an organization"}
              </h3>
            </div>

            {selectedOrganization && (
              <button
                onClick={closeDetails}
                className="rounded-2xl border border-[#f2c8c8] bg-white/80 p-3 text-[#7c4a5e] transition hover:bg-white hover:text-[#31101e]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-6">
            {!selectedOrganization ? (
              <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-8 text-center">
                <Building2 className="mx-auto h-12 w-12 text-[#a44255]" />
                <p className="mt-4 text-[#7c4a5e]">
                  Click any organization to view complete details.
                </p>
              </div>
            ) : detailsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="animate-pulse rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4"
                  >
                    <div className="h-3 w-24 rounded bg-[#ffe0e8]" />
                    <div className="mt-2 h-4 w-40 rounded bg-[#ffe0e8]" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff3e0]">
                      <Building2 className="h-7 w-7 text-[#d1661c]" />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-[#31101e]">
                        {selectedDetails?.organizationName ||
                          selectedDetails?.name ||
                          "Organization"}
                      </h4>
                      <p className="mt-1 text-sm text-[#7c4a5e]">
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

                <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#7c4a5e]">
                    Notes
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[#7c4a5e]">
                    This panel is intended to help you inspect the organization
                    before approving or rejecting it. Use the action buttons in
                    the list to proceed with a secure modal confirmation.
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedOrganization && (
        <ConfirmModal
          title="Approve organization"
          description={`Approve ${selectedOrganization.organizationName || selectedOrganization.name || "this organization"} and move it out of the pending queue.`}
          confirmLabel={processing ? "Approving..." : "Approve"}
          confirmAccent="from-[#2c8a49] to-[#5ec271]"
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
    </section>
  );
}

function InfoRow({ icon: Icon, label, value, highlight = false }) {
  return (
    <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-xl p-2 ${highlight ? "bg-[#fff3e0]" : "bg-[#ffe0e8]"}`}
        >
          <Icon
            className={`h-4 w-4 ${highlight ? "text-[#d1661c]" : "text-[#7c4a5e]"}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-[#7c4a5e]">
            {label}
          </p>
          <p
            className={`mt-1 break-words text-sm font-semibold ${highlight ? "text-[#d1661c]" : "text-[#31101e]"}`}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-[#ffe0e8] bg-white p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${confirmAccent}`}
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
            className={`flex-1 rounded-2xl bg-gradient-to-r ${confirmAccent} px-5 py-4 font-bold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60`}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-[#ffe0e8] bg-white p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d93f42] to-[#f08a8d]">
            <XCircle className="h-7 w-7 text-white" />
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
            Rejection reason
          </label>
          <textarea
            rows={5}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this organization is being rejected..."
            className="w-full rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] px-5 py-4 text-[#31101e] placeholder:text-[#a44255] outline-none transition focus:border-[#d93f42] focus:bg-white resize-none"
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
            className="flex-1 rounded-2xl bg-gradient-to-r from-[#d93f42] to-[#f08a8d] px-5 py-4 font-bold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
