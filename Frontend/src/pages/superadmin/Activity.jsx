import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  Activity as ActivityIcon,
  ArrowRight,
  ArrowUpRight,
  Clock3,
  CalendarDays,
  UserRound,
  Building2,
  ShieldCheck,
  Eye,
  Download,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  RefreshCcw,
  FileText,
  ClipboardCheck,
  LogIn,
  PenSquare,
  Trash2,
  UserCog,
  Layers3,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_BASE = "http://localhost:5000";

const ENDPOINTS = {
  logs: "/api/superadmin/activity",
  logDetails: (id) => `/api/superadmin/activity/${id}`,
  exportLogs: "/api/superadmin/activity/export",
};

const ACTION_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "LOGIN", label: "Login" },
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "APPROVAL", label: "Approval" },
  { value: "SUSPEND", label: "Suspend" },
  { value: "REACTIVATE", label: "Reactivate" },
  { value: "OTHER", label: "Other" },
];

const safeArray = (value) => (Array.isArray(value) ? value : []);

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

const normalizeAction = (value) => String(value || "").toUpperCase();

const getActionMeta = (action) => {
  switch (normalizeAction(action)) {
    case "LOGIN":
      return {
        label: "Login",
        icon: LogIn,
        color: "text-[#1e5aa8]",
        chip: "bg-[#e3f2fd] border-[#90caf9]",
      };
    case "CREATE":
      return {
        label: "Create",
        icon: PenSquare,
        color: "text-[#2c8a49]",
        chip: "bg-[#e8f5e9] border-[#a5d6a7]",
      };
    case "UPDATE":
      return {
        label: "Update",
        icon: ClipboardCheck,
        color: "text-[#9b1e27]",
        chip: "bg-[#fce4ec] border-[#f8bbd0]",
      };
    case "DELETE":
      return {
        label: "Delete",
        icon: Trash2,
        color: "text-[#d93f42]",
        chip: "bg-[#ffebee] border-[#ef9a9a]",
      };
    case "APPROVAL":
      return {
        label: "Approval",
        icon: CheckCircle2,
        color: "text-[#d1661c]",
        chip: "bg-[#fff3e0] border-[#ffcc80]",
      };
    case "SUSPEND":
      return {
        label: "Suspend",
        icon: Ban,
        color: "text-[#f57c00]",
        chip: "bg-[#ffe0b2] border-[#ffb74d]",
      };
    case "REACTIVATE":
      return {
        label: "Reactivate",
        icon: RefreshCcw,
        color: "text-[#2c8a49]",
        chip: "bg-[#e8f5e9] border-[#a5d6a7]",
      };
    default:
      return {
        label: action || "Other",
        icon: ActivityIcon,
        color: "text-[#7c4a5e]",
        chip: "bg-[#fff7f9] border-[#ffe0e8]",
      };
  }
};

const getEntityIcon = (entityType) => {
  const t = String(entityType || "").toLowerCase();
  if (t.includes("organization")) return Building2;
  if (t.includes("user")) return UserRound;
  if (t.includes("admin")) return UserCog;
  if (t.includes("system")) return ShieldCheck;
  return Layers3;
};

const downloadCSV = (rows, filename = "activity-logs.csv") => {
  if (!rows.length) {
    toast.error("No logs to export");
    return;
  }

  const headers = [
    "Date",
    "Action",
    "User",
    "Entity",
    "Entity Type",
    "Description",
    "IP Address",
    "Status",
  ];

  const escapeCell = (value) => {
    const str = String(value ?? "");
    return `"${str.replace(/"/g, '""')}"`;
  };

  const csv = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) =>
      [
        formatDateTime(row.createdAt || row.timestamp || row.date),
        row.action || row.type || "-",
        row.user?.name || row.userName || row.actorName || "-",
        row.entity?.name || row.entityName || row.targetName || "-",
        row.entityType || row.targetType || "-",
        row.description || row.message || "-",
        row.ipAddress || row.ip || "-",
        row.status || "-",
      ]
        .map(escapeCell)
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};

export default function Activity() {
  const navigate = useNavigate();
  const auth = useAuth() || {};
  const token = auth.token || localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const api = useMemo(() => {
    return axios.create({
      baseURL: API_BASE,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/superadmin-login", { replace: true });
    }
  }, [token, navigate]);

  const loadLogs = async (signal) => {
    setError("");
    try {
      const res = await api.get(ENDPOINTS.logs, {
        params: {
          page,
          limit,
          action: actionFilter === "all" ? undefined : actionFilter,
          search: search.trim() || undefined,
        },
        signal,
      });

      const payload = res.data?.data || res.data || {};
      const items = safeArray(
        payload.items || payload.logs || payload.data || payload,
      );

      setLogs(items);
      setTotalPages(payload.totalPages || payload.pagination?.totalPages || 1);
      setTotalItems(
        payload.totalItems || payload.pagination?.totalItems || items.length,
      );
    } catch (err) {
      if (err.name === "CanceledError") return;
      console.error("Failed to load activity logs:", err);
      setLogs([]);
      setTotalPages(1);
      setTotalItems(0);
      setError(
        err.response?.data?.message ||
          "Failed to load activity logs. Check the backend route names if needed.",
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
      loadLogs(controller.signal);
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, actionFilter, search, token]);

  const handleRefresh = () => {
    setRefreshing(true);
    const controller = new AbortController();
    loadLogs(controller.signal);
  };

  const openDetails = async (log) => {
    setSelectedLog(log || null);
    if (!log?._id && !log?.id) return;

    const id = log._id || log.id;
    setDetailsLoading(true);

    try {
      const res = await api.get(ENDPOINTS.logDetails(id));
      const payload = res.data?.data || res.data || {};
      setSelectedLog(payload.log || payload.data || payload || log);
    } catch (err) {
      console.error("Failed to load log details:", err);
      toast.error(err.response?.data?.message || "Failed to load log details");
      setSelectedLog(log);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedLog(null);
  };

  const handleExport = async () => {
    try {
      if (logs.length > 0) {
        downloadCSV(logs);
        toast.success("Exported current page logs");
        return;
      }

      const res = await api.get(ENDPOINTS.exportLogs, {
        params: {
          action: actionFilter === "all" ? undefined : actionFilter,
          search: search.trim() || undefined,
        },
      });

      const payload = res.data?.data || res.data || {};
      const items = safeArray(
        payload.items || payload.logs || payload.data || payload,
      );

      downloadCSV(items);
      toast.success("Export complete");
    } catch (err) {
      console.error("Export error:", err);
      toast.error(err.response?.data?.message || "Failed to export logs");
    }
  };

  const stats = useMemo(() => {
    const login = logs.filter(
      (l) => normalizeAction(l.action || l.type) === "LOGIN",
    ).length;
    const create = logs.filter(
      (l) => normalizeAction(l.action || l.type) === "CREATE",
    ).length;
    const update = logs.filter(
      (l) => normalizeAction(l.action || l.type) === "UPDATE",
    ).length;
    const approval = logs.filter(
      (l) => normalizeAction(l.action || l.type) === "APPROVAL",
    ).length;

    return { login, create, update, approval };
  }, [logs]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
            Activity Logs
          </p>
          <h3 className="text-3xl font-semibold text-[#31101e]">Audit Trail</h3>
          <p className="text-sm text-[#7c4a5e]">
            Search logs, filter by action, inspect details, and export records
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-full border border-[#f2c8c8] bg-white/80 px-4 py-2 text-sm font-semibold text-[#ff4d6d] shadow-[0_10px_25px_rgba(255,77,109,0.15)] hover:shadow-[0_15px_35px_rgba(255,77,109,0.25)] transition-all"
          >
            <Download className="h-4 w-4" />
            Export
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
        <StatBox
          label="Logins"
          value={loading ? "..." : stats.login}
          color="text-[#1e5aa8]"
        />
        <StatBox
          label="Creates"
          value={loading ? "..." : stats.create}
          color="text-[#2c8a49]"
        />
        <StatBox
          label="Updates"
          value={loading ? "..." : stats.update}
          color="text-[#9b1e27]"
        />
        <StatBox
          label="Approvals"
          value={loading ? "..." : stats.approval}
          color="text-[#d1661c]"
        />
      </div>

      {/* Filters */}
      <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c4a5e]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search user, entity, action, description..."
              className="w-full rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] py-4 pl-12 pr-5 text-[#31101e] placeholder:text-[#a44255] outline-none transition focus:border-[#ff4d6d] focus:bg-white"
            />
          </div>

          <div className="relative min-w-[220px]">
            <Filter className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c4a5e]" />
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full appearance-none rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] py-4 pl-12 pr-12 text-[#31101e] outline-none transition focus:border-[#ff4d6d] focus:bg-white"
            >
              {ACTION_OPTIONS.map((opt) => (
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
              {ACTION_OPTIONS.find((o) => o.value === actionFilter)?.label ||
                "All Actions"}
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

      {/* Main Content */}
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#1e5aa8]">
                Audit trail
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
                Recent activity logs
              </h3>
            </div>

            <div className="hidden md:flex items-center gap-2 rounded-full border border-[#ffe0e8] bg-[#fff7f9] px-4 py-2 text-sm text-[#7c4a5e]">
              <Clock3 className="h-4 w-4 text-[#1e5aa8]" />
              {loading ? "Loading..." : `${totalItems} records`}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              Array.from({ length: 8 }).map((_, idx) => (
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
            ) : logs.length > 0 ? (
              logs.map((log) => {
                const id = log._id || log.id;
                const meta = getActionMeta(log.action || log.type);
                const ActionIcon = meta.icon;
                const EntityIcon = getEntityIcon(
                  log.entityType || log.targetType,
                );
                const isActive =
                  selectedLog && (selectedLog._id || selectedLog.id) === id;

                return (
                  <div
                    key={id}
                    className={`rounded-2xl border p-5 transition cursor-pointer ${
                      isActive
                        ? "border-[#ff4d6d] bg-[#fff0f3]"
                        : "border-[#ffe0e8] bg-[#fff7f9] hover:border-[#ff4d6d] hover:shadow-md"
                    }`}
                    onClick={() => openDetails(log)}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${meta.chip}`}
                          >
                            <ActionIcon className={`h-5 w-5 ${meta.color}`} />
                          </div>

                          <h4 className="text-lg font-semibold text-[#31101e]">
                            {log.action || log.type || "Activity"}
                          </h4>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.chip} ${meta.color}`}
                          >
                            {meta.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#7c4a5e]">
                          <span className="inline-flex items-center gap-2">
                            <UserRound className="h-4 w-4" />
                            {log.user?.name ||
                              log.userName ||
                              log.actorName ||
                              "System"}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <EntityIcon className="h-4 w-4" />
                            {log.entity?.name ||
                              log.entityName ||
                              log.targetName ||
                              "Unknown entity"}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            {formatDateTime(
                              log.createdAt || log.timestamp || log.date,
                            )}
                          </span>
                        </div>

                        <p className="max-w-4xl text-sm leading-relaxed text-[#7c4a5e]">
                          {log.description ||
                            log.message ||
                            "No description provided"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetails(log);
                          }}
                          className="inline-flex items-center gap-2 rounded-2xl border border-[#f2c8c8] bg-white/80 px-4 py-3 text-sm font-semibold text-[#ff4d6d] transition hover:bg-white"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-10 text-center">
                <ActivityIcon className="mx-auto h-12 w-12 text-[#a44255]" />
                <h4 className="mt-4 text-xl font-semibold text-[#31101e]">
                  No activity logs found
                </h4>
                <p className="mt-2 text-[#7c4a5e]">
                  Try changing the search or action filter.
                </p>
              </div>
            )}
          </div>

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

        <aside className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#2c8a49]">
                Log details
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
                {selectedLog ? "Overview" : "Select a log"}
              </h3>
            </div>

            {selectedLog && (
              <button
                onClick={closeDetails}
                className="rounded-2xl border border-[#f2c8c8] bg-white/80 p-3 text-[#7c4a5e] transition hover:bg-white hover:text-[#31101e]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-6">
            {!selectedLog ? (
              <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-8 text-center">
                <ActivityIcon className="mx-auto h-12 w-12 text-[#a44255]" />
                <p className="mt-4 text-[#7c4a5e]">
                  Click a log to inspect full details.
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
                      {(() => {
                        const MetaIcon = getActionMeta(
                          selectedLog?.action || selectedLog?.type,
                        ).icon;
                        return <MetaIcon className="h-7 w-7 text-[#1e5aa8]" />;
                      })()}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-[#31101e]">
                        {selectedLog?.action || selectedLog?.type || "Activity"}
                      </h4>
                      <p className="mt-1 text-sm text-[#7c4a5e]">
                        {selectedLog?.description ||
                          selectedLog?.message ||
                          "Audit record"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <InfoRow
                    icon={UserRound}
                    label="User"
                    value={
                      selectedLog?.user?.name ||
                      selectedLog?.userName ||
                      selectedLog?.actorName ||
                      "-"
                    }
                  />
                  <InfoRow
                    icon={Building2}
                    label="Entity"
                    value={
                      selectedLog?.entity?.name ||
                      selectedLog?.entityName ||
                      selectedLog?.targetName ||
                      "-"
                    }
                  />
                  <InfoRow
                    icon={Layers3}
                    label="Entity Type"
                    value={
                      selectedLog?.entityType || selectedLog?.targetType || "-"
                    }
                  />
                  <InfoRow
                    icon={CalendarDays}
                    label="Date"
                    value={formatDateTime(
                      selectedLog?.createdAt ||
                        selectedLog?.timestamp ||
                        selectedLog?.date,
                    )}
                  />
                  <InfoRow
                    icon={AlertTriangle}
                    label="IP Address"
                    value={selectedLog?.ipAddress || selectedLog?.ip || "-"}
                  />
                  <InfoRow
                    icon={ShieldCheck}
                    label="Status"
                    value={selectedLog?.status || "Completed"}
                    highlight
                  />
                </div>

                <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#7c4a5e]">
                    Full description
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[#7c4a5e]">
                    {selectedLog?.description ||
                      selectedLog?.message ||
                      "No additional description available."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="rounded-2xl border border-[#ffe0e8] bg-white/90 p-5 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
      <p className="text-xs text-[#7c4a5e]">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-[#a44255]">Logs</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, highlight = false }) {
  return (
    <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-xl p-2 ${highlight ? "bg-[#e8f5e9]" : "bg-[#ffe0e8]"}`}
        >
          <Icon
            className={`h-4 w-4 ${highlight ? "text-[#2c8a49]" : "text-[#7c4a5e]"}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-[#7c4a5e]">
            {label}
          </p>
          <p
            className={`mt-1 break-words text-sm font-semibold ${highlight ? "text-[#2c8a49]" : "text-[#31101e]"}`}
          >
            {value || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}
