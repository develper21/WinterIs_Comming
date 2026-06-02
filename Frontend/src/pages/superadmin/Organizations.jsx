import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  Building2,
  Clock3,
  Eye,
  Trash2,
  Ban,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Mail,
  Phone,
  UserRound,
  CalendarDays,
  Hash,
  Sparkles,
  RefreshCw,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_BASE = "http://localhost:5000";

const ENDPOINTS = {
  organizations: "/api/admin/approvals/pending/all",
  organizationDetails: (id) => `/api/admin/approvals/${id}`,
  suspendOrganization: "/api/admin/approvals/suspend",
  deleteOrganization: (id) => `/api/admin/approvals/${id}`,
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "APPROVED", label: "Approved" },
  { value: "PENDING", label: "Pending" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUSPENDED", label: "Suspended" },
];

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

const normalizeTypeLabel = (value) => {
  const t = String(value || "").toLowerCase();
  if (t.includes("hospital")) return "Hospital";
  if (t.includes("blood")) return "Blood Bank";
  if (t.includes("ngo")) return "NGO";
  return value || "Organization";
};

const normalizeStatusLabel = (value) => {
  const s = String(value || "").toUpperCase();
  if (s === "APPROVED") return "Approved";
  if (s === "PENDING") return "Pending";
  if (s === "REJECTED") return "Rejected";
  if (s === "SUSPENDED") return "Suspended";
  return value || "Unknown";
};

const getStatusStyle = (status) => {
  const s = String(status || "").toUpperCase();
  switch (s) {
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

export default function Organizations() {
  const navigate = useNavigate();
  const auth = useAuth() || {};
  const token = auth.token || localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/superadmin-login", { replace: true });
    }
  }, [token, navigate]);

  const api = useMemo(() => {
    return axios.create({
      baseURL: API_BASE,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }, [token]);

  const loadOrganizations = async (signal) => {
    setError("");
    try {
      const res = await api.get(ENDPOINTS.organizations, {
        params: {
          page,
          limit,
          status: statusFilter === "all" ? undefined : statusFilter,
          type: typeFilter === "all" ? undefined : typeFilter,
          search: search.trim() || undefined,
        },
        signal,
      });

      const payload = res.data?.data || res.data || {};
      const items = safeArray(
        payload.items || payload.organizations || payload.data || payload,
      );

      setOrganizations(items);
      setTotalPages(payload.totalPages || payload.pagination?.totalPages || 1);
      setTotalItems(
        payload.totalItems || payload.pagination?.totalItems || items.length,
      );
    } catch (err) {
      if (err.name === "CanceledError") return;
      console.error("Failed to load organizations:", err);
      setOrganizations([]);
      setTotalPages(1);
      setTotalItems(0);
      setError(
        err.response?.data?.message ||
          "Failed to load organizations. Check the backend route names if needed.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      loadOrganizations(controller.signal);
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, statusFilter, typeFilter, search, token]);

  const handleRefresh = () => {
    setRefreshing(true);
    const controller = new AbortController();
    loadOrganizations(controller.signal);
  };

  const openDetails = async (org) => {
    setSelectedOrganization(org);
    setSelectedDetails(org || null);

    const id = org?._id || org?.id;
    if (!id) return;

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

  const openSuspendModal = (org) => {
    setSelectedOrganization(org);
    setSuspendReason("");
    setShowSuspendModal(true);
  };

  const openDeleteModal = (org) => {
    setSelectedOrganization(org);
    setDeleteConfirmText("");
    setShowDeleteModal(true);
  };

  const handleSuspend = async () => {
    if (!selectedOrganization) return;

    const id = selectedOrganization._id || selectedOrganization.id;
    if (!suspendReason.trim()) {
      toast.error("Please provide a suspension reason");
      return;
    }

    setProcessing(true);
    try {
      const res = await api.post(ENDPOINTS.suspendOrganization(id), {
        reason: suspendReason.trim(),
      });

      toast.success(res.data?.message || "Organization suspended successfully");
      setShowSuspendModal(false);
      setSelectedOrganization(null);
      setSuspendReason("");
      await loadOrganizations();

      if (selectedDetails?._id === id || selectedDetails?.id === id) {
        setSelectedDetails((prev) =>
          prev ? { ...prev, status: "SUSPENDED" } : prev,
        );
      }
    } catch (err) {
      console.error("Suspend error:", err);
      toast.error(
        err.response?.data?.message || "Failed to suspend organization",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrganization) return;

    const id = selectedOrganization._id || selectedOrganization.id;
    const orgName =
      selectedOrganization.organizationName ||
      selectedOrganization.name ||
      "organization";

    if (
      deleteConfirmText.trim().toLowerCase() !== orgName.trim().toLowerCase()
    ) {
      toast.error(`Type "${orgName}" to confirm deletion`);
      return;
    }

    setProcessing(true);
    try {
      const res = await api.delete(ENDPOINTS.deleteOrganization(id));
      toast.success(res.data?.message || "Organization deleted successfully");
      setShowDeleteModal(false);
      setSelectedOrganization(null);
      setDeleteConfirmText("");
      await loadOrganizations();

      if (selectedDetails?._id === id || selectedDetails?.id === id) {
        setSelectedDetails(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(
        err.response?.data?.message || "Failed to delete organization",
      );
    } finally {
      setProcessing(false);
    }
  };

  const visibleOrganizations = organizations;

  const stats = useMemo(() => {
    const approved = organizations.filter(
      (o) => String(o.status || "").toUpperCase() === "APPROVED",
    ).length;
    const pending = organizations.filter(
      (o) => String(o.status || "").toUpperCase() === "PENDING",
    ).length;
    const rejected = organizations.filter(
      (o) => String(o.status || "").toUpperCase() === "REJECTED",
    ).length;
    const suspended = organizations.filter(
      (o) => String(o.status || "").toUpperCase() === "SUSPENDED",
    ).length;

    return { approved, pending, rejected, suspended };
  }, [organizations]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
            Organizations
          </p>
          <h3 className="text-3xl font-semibold text-[#31101e]">
            Organizations Management
          </h3>
          <p className="text-sm text-[#7c4a5e]">
            Search, filter, review, suspend, and delete organizations
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
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatBox
          label="Approved"
          value={loading ? "..." : stats.approved}
          color="text-[#2c8a49]"
        />
        <StatBox
          label="Pending"
          value={loading ? "..." : stats.pending}
          color="text-[#d1661c]"
        />
        <StatBox
          label="Rejected"
          value={loading ? "..." : stats.rejected}
          color="text-[#d93f42]"
        />
        <StatBox
          label="Suspended"
          value={loading ? "..." : stats.suspended}
          color="text-[#7c4a5e]"
        />
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
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full appearance-none rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] py-4 pl-12 pr-12 text-[#31101e] outline-none transition focus:border-[#ff4d6d] focus:bg-white"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Building2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c4a5e]" />
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
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#7c4a5e]">
              Current view
            </p>
            <p className="mt-1 font-semibold text-[#31101e]">
              {normalizeStatusLabel(statusFilter)} •{" "}
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
              <p className="text-xs uppercase tracking-[0.4em] text-[#1e5aa8]">
                Organization directory
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
                All organizations
              </h3>
            </div>

            <div className="hidden md:flex items-center gap-2 rounded-full border border-[#ffe0e8] bg-[#fff7f9] px-4 py-2 text-sm text-[#7c4a5e]">
              <Building2 className="h-4 w-4 text-[#1e5aa8]" />
              {loading ? "Loading..." : `${totalItems} results`}
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
                    <div className="h-10 w-28 rounded-2xl bg-[#ffe0e8]" />
                  </div>
                </div>
              ))
            ) : visibleOrganizations.length > 0 ? (
              visibleOrganizations.map((org) => {
                const id = org._id || org.id || org.organizationCode;
                const isActive =
                  selectedOrganization &&
                  (selectedOrganization._id ||
                    selectedOrganization.id ||
                    selectedOrganization.organizationCode) === id;

                const typeLabel = normalizeTypeLabel(
                  org.type || org.organizationType,
                );
                const statusLabel = normalizeStatusLabel(org.status);

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
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(org.status)}`}
                          >
                            {statusLabel}
                          </span>
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
                            openSuspendModal(org);
                          }}
                          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#d1661c] to-[#f2994a] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
                        >
                          <Ban className="h-4 w-4" />
                          Suspend
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(org);
                          }}
                          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#d93f42] to-[#f08a8d] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-10 text-center">
                <Building2 className="mx-auto h-12 w-12 text-[#a44255]" />
                <h4 className="mt-4 text-xl font-semibold text-[#31101e]">
                  No organizations found
                </h4>
                <p className="mt-2 text-[#7c4a5e]">
                  Try changing the search or filter values.
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
              <p className="text-xs uppercase tracking-[0.4em] text-[#2c8a49]">
                Selected organization
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
                {selectedDetails ? "Overview" : "Choose one"}
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
                  Click an organization to view details.
                </p>
              </div>
            ) : detailsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, idx) => (
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
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e3f2fd]">
                      <Building2 className="h-7 w-7 text-[#1e5aa8]" />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-[#31101e]">
                        {selectedDetails?.organizationName ||
                          selectedDetails?.name ||
                          "Organization"}
                      </h4>
                      <p className="mt-1 text-sm text-[#7c4a5e]">
                        {normalizeTypeLabel(
                          selectedDetails?.type ||
                            selectedDetails?.organizationType,
                        )}
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
                    value={normalizeStatusLabel(
                      selectedDetails?.status || "UNKNOWN",
                    )}
                    highlight
                  />
                </div>

                <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#7c4a5e]">
                    Notes
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[#7c4a5e]">
                    Use Suspend for temporary removal and Delete for permanent
                    removal. Both actions are protected by confirmation modals.
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && selectedOrganization && (
        <SuspendModal
          title="Suspend organization"
          description={`Suspend ${selectedOrganization.organizationName || selectedOrganization.name || "this organization"} from the platform.`}
          reason={suspendReason}
          setReason={setSuspendReason}
          onClose={() => {
            if (processing) return;
            setShowSuspendModal(false);
            setSelectedOrganization(null);
            setSuspendReason("");
          }}
          onConfirm={handleSuspend}
          loading={processing}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedOrganization && (
        <DeleteModal
          title="Delete organization"
          description={`This will permanently delete ${selectedOrganization.organizationName || selectedOrganization.name || "this organization"} from the platform.`}
          confirmText={deleteConfirmText}
          setConfirmText={setDeleteConfirmText}
          targetName={
            selectedOrganization.organizationName ||
            selectedOrganization.name ||
            ""
          }
          onClose={() => {
            if (processing) return;
            setShowDeleteModal(false);
            setSelectedOrganization(null);
            setDeleteConfirmText("");
          }}
          onConfirm={handleDelete}
          loading={processing}
        />
      )}
    </section>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="rounded-2xl border border-[#ffe0e8] bg-white/90 p-5 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
      <p className="text-xs text-[#7c4a5e]">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-[#a44255]">Organizations</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, highlight = false }) {
  return (
    <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-xl p-2 ${highlight ? "bg-[#e3f2fd]" : "bg-[#ffe0e8]"}`}
        >
          <Icon
            className={`h-4 w-4 ${highlight ? "text-[#1e5aa8]" : "text-[#7c4a5e]"}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-[#7c4a5e]">
            {label}
          </p>
          <p
            className={`mt-1 break-words text-sm font-semibold ${highlight ? "text-[#1e5aa8]" : "text-[#31101e]"}`}
          >
            {value || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

function SuspendModal({
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
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d1661c] to-[#f2994a]">
            <Ban className="h-7 w-7 text-white" />
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
            Suspension reason
          </label>
          <textarea
            rows={5}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this organization is being suspended..."
            className="w-full rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] px-5 py-4 text-[#31101e] placeholder:text-[#a44255] outline-none transition focus:border-[#d1661c] focus:bg-white resize-none"
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
            className="flex-1 rounded-2xl bg-gradient-to-r from-[#d1661c] to-[#f2994a] px-5 py-4 font-bold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Suspending..." : "Suspend"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  title,
  description,
  confirmText,
  setConfirmText,
  targetName,
  onClose,
  onConfirm,
  loading,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-[#ffe0e8] bg-white p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d93f42] to-[#f08a8d]">
            <Trash2 className="h-7 w-7 text-white" />
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

        <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          Type <strong>{targetName}</strong> to confirm permanent deletion.
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-[#7c4a5e]">
            Confirmation text
          </label>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={targetName}
            className="w-full rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] px-5 py-4 text-[#31101e] placeholder:text-[#a44255] outline-none transition focus:border-[#d93f42] focus:bg-white"
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
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
