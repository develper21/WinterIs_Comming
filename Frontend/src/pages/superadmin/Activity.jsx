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
        color: "text-cyan-300",
        chip: "bg-cyan-500/10 border-cyan-500/20",
      };
    case "CREATE":
      return {
        label: "Create",
        icon: PenSquare,
        color: "text-emerald-300",
        chip: "bg-emerald-500/10 border-emerald-500/20",
      };
    case "UPDATE":
      return {
        label: "Update",
        icon: ClipboardCheck,
        color: "text-violet-300",
        chip: "bg-violet-500/10 border-violet-500/20",
      };
    case "DELETE":
      return {
        label: "Delete",
        icon: Trash2,
        color: "text-rose-300",
        chip: "bg-rose-500/10 border-rose-500/20",
      };
    case "APPROVAL":
      return {
        label: "Approval",
        icon: CheckCircle2,
        color: "text-amber-300",
        chip: "bg-amber-500/10 border-amber-500/20",
      };
    case "SUSPEND":
      return {
        label: "Suspend",
        icon: Ban,
        color: "text-orange-300",
        chip: "bg-orange-500/10 border-orange-500/20",
      };
    case "REACTIVATE":
      return {
        label: "Reactivate",
        icon: RefreshCcw,
        color: "text-emerald-300",
        chip: "bg-emerald-500/10 border-emerald-500/20",
      };
    default:
      return {
        label: action || "Other",
        icon: ActivityIcon,
        color: "text-gray-300",
        chip: "bg-white/5 border-white/10",
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
    <div className="min-h-screen overflow-hidden bg-[#050816] text-white relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute top-24 right-0 h-[420px] w-[420px] rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-400">
                  Superadmin Activity
                </p>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  Activity Logs
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>

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
          <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 lg:p-10">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="absolute left-0 bottom-0 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                  Track actions across the platform
                </div>

                <h2 className="mt-6 text-4xl sm:text-5xl font-black leading-tight text-white">
                  Search logs, filter by action, inspect details, and export
                  records
                </h2>

                <p className="mt-4 max-w-3xl text-gray-400 leading-relaxed">
                  Review recent platform activity, inspect who did what, and
                  export the current set of logs for auditing or reporting.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatBox
                  label="Logins"
                  value={loading ? "..." : stats.login}
                  color="text-cyan-300"
                />
                <StatBox
                  label="Creates"
                  value={loading ? "..." : stats.create}
                  color="text-emerald-300"
                />
                <StatBox
                  label="Updates"
                  value={loading ? "..." : stats.update}
                  color="text-violet-300"
                />
                <StatBox
                  label="Approvals"
                  value={loading ? "..." : stats.approval}
                  color="text-amber-300"
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-[28px] border border-amber-500/20 bg-amber-500/10 p-4 text-amber-200">
              {error}
            </div>
          )}

          <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search user, entity, action, description..."
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/40 py-4 pl-12 pr-5 text-white placeholder:text-gray-500 outline-none transition focus:border-cyan-500 focus:bg-white/10"
                  />
                </div>

                <div className="relative min-w-[220px]">
                  <Filter className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <select
                    value={actionFilter}
                    onChange={(e) => {
                      setActionFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/40 py-4 pl-12 pr-12 text-white outline-none transition focus:border-cyan-500 focus:bg-white/10"
                  >
                    {ACTION_OPTIONS.map((opt) => (
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
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                  Current view
                </p>
                <p className="mt-1 font-semibold text-white">
                  {ACTION_OPTIONS.find((o) => o.value === actionFilter)
                    ?.label || "All Actions"}
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

          <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-cyan-400">
                    Audit trail
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    Recent activity logs
                  </h3>
                </div>

                <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-gray-300">
                  <Clock3 className="h-4 w-4 text-cyan-300" />
                  {loading ? "Loading..." : `${totalItems} records`}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {loading ? (
                  Array.from({ length: 8 }).map((_, idx) => (
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
                        <div className="h-10 w-28 rounded-2xl bg-white/10" />
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
                        className={`rounded-[26px] border p-5 transition cursor-pointer ${
                          isActive
                            ? "border-cyan-500/40 bg-cyan-500/10"
                            : "border-white/10 bg-slate-950/40 hover:border-white/20"
                        }`}
                        onClick={() => openDetails(log)}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${meta.chip}`}
                              >
                                <ActionIcon
                                  className={`h-5 w-5 ${meta.color}`}
                                />
                              </div>

                              <h4 className="text-lg font-bold text-white">
                                {log.action || log.type || "Activity"}
                              </h4>

                              <span
                                className={`rounded-full border px-3 py-1 text-xs ${meta.chip} ${meta.color}`}
                              >
                                {meta.label}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-400">
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

                            <p className="max-w-4xl text-sm leading-relaxed text-gray-300">
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
                              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
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
                  <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-10 text-center">
                    <ActivityIcon className="mx-auto h-12 w-12 text-gray-500" />
                    <h4 className="mt-4 text-xl font-bold text-white">
                      No activity logs found
                    </h4>
                    <p className="mt-2 text-gray-400">
                      Try changing the search or action filter.
                    </p>
                  </div>
                )}
              </div>

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
                              ? "border-cyan-500/30 bg-cyan-500/15 text-cyan-300"
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

            <aside className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-emerald-400">
                    Log details
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    {selectedLog ? "Overview" : "Select a log"}
                  </h3>
                </div>

                {selectedLog && (
                  <button
                    onClick={closeDetails}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3 text-gray-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="mt-6">
                {!selectedLog ? (
                  <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-8 text-center">
                    <ActivityIcon className="mx-auto h-12 w-12 text-gray-500" />
                    <p className="mt-4 text-gray-400">
                      Click a log to inspect full details.
                    </p>
                  </div>
                ) : detailsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, idx) => (
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
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15">
                          {(() => {
                            const MetaIcon = getActionMeta(
                              selectedLog?.action || selectedLog?.type,
                            ).icon;
                            return (
                              <MetaIcon className="h-7 w-7 text-cyan-300" />
                            );
                          })()}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-white">
                            {selectedLog?.action ||
                              selectedLog?.type ||
                              "Activity"}
                          </h4>
                          <p className="mt-1 text-sm text-gray-400">
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
                          selectedLog?.entityType ||
                          selectedLog?.targetType ||
                          "-"
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

                    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                      <p className="text-sm uppercase tracking-[0.2em] text-gray-400">
                        Full description
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-gray-300">
                        {selectedLog?.description ||
                          selectedLog?.message ||
                          "No additional description available."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">Logs</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, highlight = false }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-xl p-2 ${highlight ? "bg-emerald-500/15" : "bg-white/10"}`}
        >
          <Icon
            className={`h-4 w-4 ${highlight ? "text-emerald-300" : "text-gray-300"}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
            {label}
          </p>
          <p
            className={`mt-1 break-words text-sm font-semibold ${highlight ? "text-emerald-300" : "text-white"}`}
          >
            {value || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}
