import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  Download,
  Eye,
  FileText,
  HardDrive,
  Layers3,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Activity,
  Cpu,
  MemoryStick,
  Thermometer,
  Wifi,
  X,
  XCircle,
  Ban,
  Loader2,
  BarChart3,
  CircleDashed,
  CircleCheckBig,
  CircleOff,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_BASE = "http://localhost:5000";

const ENDPOINTS = {
  overview: "/api/superadmin/system-health",
  healthChecks: "/api/superadmin/system-health/checks",
  collections: "/api/superadmin/system-health/collections",
  metrics: "/api/superadmin/system-health/metrics",
  errors: "/api/superadmin/system-health/errors",
  errorDetails: (id) => `/api/superadmin/system-health/errors/${id}`,
};

const safeArray = (value) => (Array.isArray(value) ? value : []);

const normalizeStatus = (value) => String(value || "").toUpperCase();

const formatNumber = (value) => {
  if (value === null || value === undefined) return "0";
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

const getStatusStyle = (status) => {
  switch (normalizeStatus(status)) {
    case "HEALTHY":
    case "OK":
    case "RUNNING":
    case "ACTIVE":
      return "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";
    case "DEGRADED":
    case "WARNING":
    case "MONITORING":
      return "bg-amber-500/10 border-amber-500/20 text-amber-300";
    case "DOWN":
    case "ERROR":
    case "FAILED":
    case "OFFLINE":
      return "bg-rose-500/10 border-rose-500/20 text-rose-300";
    default:
      return "bg-slate-500/10 border-slate-500/20 text-slate-300";
  }
};

const getStatusIcon = (status) => {
  switch (normalizeStatus(status)) {
    case "HEALTHY":
    case "OK":
    case "RUNNING":
    case "ACTIVE":
      return CheckCircle2;
    case "DEGRADED":
    case "WARNING":
    case "MONITORING":
      return AlertTriangle;
    case "DOWN":
    case "ERROR":
    case "FAILED":
    case "OFFLINE":
      return XCircle;
    default:
      return CircleDashed;
  }
};

export default function SystemHealth() {
  const navigate = useNavigate();
  const auth = useAuth() || {};
  const token = auth.token || localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [overview, setOverview] = useState(null);
  const [healthChecks, setHealthChecks] = useState([]);
  const [collections, setCollections] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [errorLogs, setErrorLogs] = useState([]);
  const [selectedError, setSelectedError] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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

  const loadSystemHealth = async (signal) => {
    setError("");

    try {
      const [overviewRes, checksRes, collectionsRes, metricsRes, errorsRes] =
        await Promise.allSettled([
          api.get(ENDPOINTS.overview, { signal }),
          api.get(ENDPOINTS.healthChecks, { signal }),
          api.get(ENDPOINTS.collections, { signal }),
          api.get(ENDPOINTS.metrics, { signal }),
          api.get(ENDPOINTS.errors, { signal }),
        ]);

      if (overviewRes.status === "fulfilled") {
        const payload =
          overviewRes.value.data?.data || overviewRes.value.data || {};
        setOverview(payload.overview || payload.data || payload);
      }

      if (checksRes.status === "fulfilled") {
        const payload =
          checksRes.value.data?.data || checksRes.value.data || {};
        setHealthChecks(
          safeArray(
            payload.items || payload.checks || payload.services || payload,
          ),
        );
      }

      if (collectionsRes.status === "fulfilled") {
        const payload =
          collectionsRes.value.data?.data || collectionsRes.value.data || {};
        setCollections(
          safeArray(
            payload.items || payload.collections || payload.data || payload,
          ),
        );
      }

      if (metricsRes.status === "fulfilled") {
        const payload =
          metricsRes.value.data?.data || metricsRes.value.data || {};
        setMetrics(payload.metrics || payload.data || payload);
      }

      if (errorsRes.status === "fulfilled") {
        const payload =
          errorsRes.value.data?.data || errorsRes.value.data || {};
        setErrorLogs(
          safeArray(
            payload.items ||
              payload.errors ||
              payload.logs ||
              payload.data ||
              payload,
          ),
        );
      }

      const failed = [
        overviewRes,
        checksRes,
        collectionsRes,
        metricsRes,
        errorsRes,
      ].some((result) => result.status === "rejected");

      if (failed) {
        setError(
          "Some health panels could not be loaded. Check the backend route names in the ENDPOINTS block.",
        );
      }
    } catch (err) {
      console.error("System health load error:", err);
      setError("Failed to load system health.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      loadSystemHealth(controller.signal);
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    const controller = new AbortController();
    loadSystemHealth(controller.signal);
  };

  const handleExportErrors = () => {
    if (!errorLogs.length) {
      toast.error("No error logs to export");
      return;
    }

    const headers = ["Date", "Level", "Message", "Source", "Code", "Status"];
    const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      headers.map(escape).join(","),
      ...errorLogs.map((item) =>
        [
          formatDateTime(item.createdAt || item.timestamp || item.date),
          item.level || "-",
          item.message || item.error || "-",
          item.source || item.module || "-",
          item.code || item.errorCode || "-",
          item.status || "-",
        ]
          .map(escape)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "system-error-logs.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast.success("Error logs exported");
  };

  const statusSummary = useMemo(() => {
    const items = safeArray(healthChecks);
    const healthy = items.filter((x) =>
      ["HEALTHY", "OK", "RUNNING", "ACTIVE"].includes(
        normalizeStatus(x.status || x.state),
      ),
    ).length;
    const warning = items.filter((x) =>
      ["DEGRADED", "WARNING", "MONITORING"].includes(
        normalizeStatus(x.status || x.state),
      ),
    ).length;
    const down = items.filter((x) =>
      ["DOWN", "ERROR", "FAILED", "OFFLINE"].includes(
        normalizeStatus(x.status || x.state),
      ),
    ).length;

    return { healthy, warning, down };
  }, [healthChecks]);

  const collectionTotal = useMemo(() => {
    return safeArray(collections).reduce((sum, item) => {
      const value =
        Number(item.count ?? item.documents ?? item.total ?? item.value ?? 0) ||
        0;
      return sum + value;
    }, 0);
  }, [collections]);

  const metricsList = useMemo(() => {
    if (Array.isArray(metrics)) return metrics;
    if (!metrics) return [];
    return [
      {
        label: "CPU Usage",
        value: metrics.cpuUsage ?? metrics.cpu ?? 0,
        unit: "%",
      },
      {
        label: "Memory Usage",
        value: metrics.memoryUsage ?? metrics.memory ?? 0,
        unit: "%",
      },
      {
        label: "Response Time",
        value: metrics.responseTime ?? metrics.latency ?? 0,
        unit: "ms",
      },
      {
        label: "Uptime",
        value: metrics.uptime ?? metrics.serverUptime ?? 0,
        unit: "hrs",
      },
    ];
  }, [metrics]);

  return (
    <div className="min-h-screen overflow-hidden bg-[#050816] text-white relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute top-24 right-0 h-[420px] w-[420px] rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-400">
                  Superadmin System
                </p>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  System Health
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportErrors}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  <Download className="h-4 w-4" />
                  Export Errors
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
          {/* Hero */}
          <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 lg:p-10">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="absolute left-0 bottom-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                  Monitor database, APIs, collections, and errors
                </div>

                <h2 className="mt-6 text-4xl sm:text-5xl font-black leading-tight text-white">
                  Keep the platform healthy with live operational visibility
                </h2>

                <p className="mt-4 max-w-3xl text-gray-400 leading-relaxed">
                  Review database status, collection counts, service checks,
                  system metrics, and error logs from a centralized control
                  panel.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatBox
                  label="Healthy"
                  value={loading ? "..." : statusSummary.healthy}
                  color="text-emerald-300"
                />
                <StatBox
                  label="Warnings"
                  value={loading ? "..." : statusSummary.warning}
                  color="text-amber-300"
                />
                <StatBox
                  label="Down"
                  value={loading ? "..." : statusSummary.down}
                  color="text-rose-300"
                />
                <StatBox
                  label="Collections"
                  value={loading ? "..." : collectionTotal}
                  color="text-cyan-300"
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-[28px] border border-amber-500/20 bg-amber-500/10 p-4 text-amber-200">
              {error}
            </div>
          )}

          {/* Main grid */}
          <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            {/* Left column */}
            <div className="space-y-6">
              {/* Database + Collections */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.25em] text-cyan-400">
                        Database
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-white">
                        Connection status
                      </h3>
                    </div>
                    <Database className="h-6 w-6 text-cyan-300" />
                  </div>

                  <div className="mt-6 space-y-4">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="animate-pulse rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                        >
                          <div className="h-3 w-28 rounded bg-white/10" />
                          <div className="mt-2 h-4 w-40 rounded bg-white/10" />
                        </div>
                      ))
                    ) : safeArray(healthChecks).length > 0 ? (
                      safeArray(healthChecks).map((item, idx) => {
                        const StatusIcon = getStatusIcon(
                          item.status || item.state,
                        );
                        return (
                          <div
                            key={item._id || item.id || idx}
                            className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-white">
                                  {item.name ||
                                    item.service ||
                                    item.label ||
                                    "Service"}
                                </p>
                                <p className="mt-1 text-sm text-gray-400">
                                  {item.details ||
                                    item.message ||
                                    "Status check"}
                                </p>
                              </div>

                              <span
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                                  item.status || item.state,
                                )}`}
                              >
                                <StatusIcon className="h-3.5 w-3.5" />
                                {normalizeStatus(item.status || item.state)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6 text-center text-gray-400">
                        No database health data found.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.25em] text-emerald-400">
                        Collections
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-white">
                        Document counts
                      </h3>
                    </div>
                    <Layers3 className="h-6 w-6 text-emerald-300" />
                  </div>

                  <div className="mt-6 space-y-4">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="animate-pulse rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                        >
                          <div className="h-3 w-24 rounded bg-white/10" />
                          <div className="mt-2 h-4 w-32 rounded bg-white/10" />
                        </div>
                      ))
                    ) : safeArray(collections).length > 0 ? (
                      safeArray(collections).map((item, idx) => (
                        <div
                          key={item._id || item.id || idx}
                          className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-white">
                                {item.name ||
                                  item.collection ||
                                  item.label ||
                                  "Collection"}
                              </p>
                              <p className="mt-1 text-sm text-gray-400">
                                {item.description ||
                                  item.details ||
                                  "Document total"}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-2xl font-black text-white">
                                {formatNumber(
                                  item.count ??
                                    item.documents ??
                                    item.total ??
                                    0,
                                )}
                              </p>
                              <p className="text-xs text-gray-500">docs</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6 text-center text-gray-400">
                        No collection counts available.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-violet-400">
                      System metrics
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-white">
                      Live performance
                    </h3>
                  </div>
                  <BarChart3 className="h-6 w-6 text-violet-300" />
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="animate-pulse rounded-[26px] border border-white/10 bg-slate-950/40 p-5"
                      >
                        <div className="h-3 w-24 rounded bg-white/10" />
                        <div className="mt-4 h-8 w-20 rounded bg-white/10" />
                        <div className="mt-3 h-2 rounded-full bg-white/10" />
                      </div>
                    ))
                  ) : metricsList.length > 0 ? (
                    metricsList.map((item, idx) => {
                      const numeric = Number(item.value ?? 0) || 0;
                      const max = item.label.toLowerCase().includes("memory")
                        ? 100
                        : item.label.toLowerCase().includes("cpu")
                          ? 100
                          : item.label.toLowerCase().includes("response")
                            ? 1000
                            : Math.max(100, numeric || 100);

                      const pct = Math.min(100, (numeric / max) * 100);
                      return (
                        <div
                          key={item.label || idx}
                          className="rounded-[26px] border border-white/10 bg-slate-950/40 p-5"
                        >
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                            {item.label || "Metric"}
                          </p>
                          <p className="mt-3 text-3xl font-black text-white">
                            {formatNumber(item.value)}
                            {item.unit || ""}
                          </p>
                          <div className="mt-4 h-2 rounded-full bg-white/10">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full rounded-2xl border border-white/10 bg-slate-950/40 p-6 text-center text-gray-400">
                      No metrics available.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column */}
            <aside className="space-y-6">
              {/* API Health */}
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
                      APIs
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-white">
                      Health checks
                    </h3>
                  </div>
                  <ShieldCheck className="h-6 w-6 text-emerald-300" />
                </div>

                <div className="mt-6 space-y-4">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="animate-pulse rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                      >
                        <div className="h-3 w-28 rounded bg-white/10" />
                        <div className="mt-2 h-4 w-36 rounded bg-white/10" />
                      </div>
                    ))
                  ) : healthChecks.length > 0 ? (
                    healthChecks.map((item, idx) => {
                      const StatusIcon = getStatusIcon(
                        item.status || item.state,
                      );
                      return (
                        <div
                          key={item._id || item.id || idx}
                          className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-white">
                                {item.name || item.service || "API"}
                              </p>
                              <p className="mt-1 text-sm text-gray-400">
                                {item.endpoint ||
                                  item.route ||
                                  item.details ||
                                  "Health check"}
                              </p>
                            </div>

                            <StatusIcon
                              className={`h-5 w-5 ${
                                ["HEALTHY", "OK", "RUNNING", "ACTIVE"].includes(
                                  normalizeStatus(item.status || item.state),
                                )
                                  ? "text-emerald-300"
                                  : [
                                        "DEGRADED",
                                        "WARNING",
                                        "MONITORING",
                                      ].includes(
                                        normalizeStatus(
                                          item.status || item.state,
                                        ),
                                      )
                                    ? "text-amber-300"
                                    : "text-rose-300"
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6 text-center text-gray-400">
                      No API checks available.
                    </div>
                  )}
                </div>
              </div>

              {/* Error logs */}
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-rose-400">
                      Errors
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-white">
                      Error logs
                    </h3>
                  </div>
                  <AlertTriangle className="h-6 w-6 text-rose-300" />
                </div>

                <div className="mt-6 space-y-4">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="animate-pulse rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                      >
                        <div className="h-3 w-24 rounded bg-white/10" />
                        <div className="mt-2 h-4 w-44 rounded bg-white/10" />
                      </div>
                    ))
                  ) : errorLogs.length > 0 ? (
                    errorLogs.map((log) => (
                      <button
                        key={log._id || log.id}
                        onClick={async () => {
                          setSelectedError(log);
                          if (!log?._id && !log?.id) return;

                          const id = log._id || log.id;
                          setDetailsLoading(true);
                          try {
                            const res = await api.get(
                              ENDPOINTS.errorDetails(id),
                            );
                            const payload = res.data?.data || res.data || {};
                            setSelectedError(
                              payload.error || payload.data || payload || log,
                            );
                          } catch (err) {
                            toast.error(
                              err.response?.data?.message ||
                                "Failed to load error details",
                            );
                          } finally {
                            setDetailsLoading(false);
                          }
                        }}
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-left transition hover:bg-white/10"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-white">
                              {log.message || log.error || "Error"}
                            </p>
                            <p className="mt-1 text-sm text-gray-400">
                              {formatDateTime(
                                log.createdAt || log.timestamp || log.date,
                              )}
                            </p>
                          </div>

                          <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs text-rose-300">
                            {log.level || "error"}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6 text-center text-gray-400">
                      No error logs found.
                    </div>
                  )}
                </div>
              </div>

              {/* Selected error detail */}
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-cyan-400">
                      Selected log
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-white">
                      Details
                    </h3>
                  </div>
                  <Eye className="h-6 w-6 text-cyan-300" />
                </div>

                <div className="mt-6">
                  {!selectedError ? (
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6 text-center text-gray-400">
                      Click an error log to inspect details.
                    </div>
                  ) : detailsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="animate-pulse rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                        >
                          <div className="h-3 w-28 rounded bg-white/10" />
                          <div className="mt-2 h-4 w-full rounded bg-white/10" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                          Message
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-white">
                          {selectedError.message ||
                            selectedError.error ||
                            "No message available"}
                        </p>
                      </div>

                      <div className="grid gap-3">
                        <DetailRow
                          label="Source"
                          value={
                            selectedError.source || selectedError.module || "-"
                          }
                        />
                        <DetailRow
                          label="Code"
                          value={
                            selectedError.code || selectedError.errorCode || "-"
                          }
                        />
                        <DetailRow
                          label="Status"
                          value={
                            selectedError.status || selectedError.level || "-"
                          }
                        />
                        <DetailRow
                          label="Timestamp"
                          value={formatDateTime(
                            selectedError.createdAt ||
                              selectedError.timestamp ||
                              selectedError.date,
                          )}
                        />
                        <DetailRow
                          label="Stack"
                          value={
                            selectedError.stack || selectedError.trace || "-"
                          }
                          multiline
                        />
                      </div>
                    </div>
                  )}
                </div>
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
      <p className="mt-1 text-xs text-gray-500">Services</p>
    </div>
  );
}

function DetailRow({ label, value, multiline = false }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
        {label}
      </p>
      <p
        className={`mt-2 text-sm font-semibold text-white ${
          multiline ? "whitespace-pre-wrap break-words" : "break-words"
        }`}
      >
        {value || "-"}
      </p>
    </div>
  );
}
