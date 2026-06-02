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
  Activity as ActivityIcon,
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
  CheckCircle,
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
      return "bg-emerald-100 border-emerald-300 text-emerald-700";
    case "DEGRADED":
    case "WARNING":
    case "MONITORING":
      return "bg-amber-100 border-amber-300 text-amber-700";
    case "DOWN":
    case "ERROR":
    case "FAILED":
    case "OFFLINE":
      return "bg-red-100 border-red-300 text-red-700";
    default:
      return "bg-gray-100 border-gray-300 text-gray-700";
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
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
            System Health
          </p>
          <h3 className="text-3xl font-semibold text-[#31101e]">
            System Health Monitoring
          </h3>
          <p className="text-sm text-[#7c4a5e]">
            Monitor database, APIs, collections, and errors
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleExportErrors}
            className="inline-flex items-center gap-2 rounded-full border border-[#f2c8c8] bg-white/80 px-4 py-2 text-sm font-semibold text-[#ff4d6d] shadow-[0_10px_25px_rgba(255,77,109,0.15)] hover:shadow-[0_15px_35px_rgba(255,77,109,0.25)] transition-all"
          >
            <Download className="h-4 w-4" />
            Export Errors
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
          label="Healthy"
          value={loading ? "..." : statusSummary.healthy}
          color="text-[#2c8a49]"
        />
        <StatBox
          label="Warnings"
          value={loading ? "..." : statusSummary.warning}
          color="text-[#d1661c]"
        />
        <StatBox
          label="Down"
          value={loading ? "..." : statusSummary.down}
          color="text-[#d93f42]"
        />
        <StatBox
          label="Collections"
          value={loading ? "..." : collectionTotal}
          color="text-[#1e5aa8]"
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Database + Collections */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[#1e5aa8]">
                    Database
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
                    Connection status
                  </h3>
                </div>
                <Database className="h-6 w-6 text-[#1e5aa8]" />
              </div>

              <div className="mt-6 space-y-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="animate-pulse rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4"
                    >
                      <div className="h-3 w-28 rounded bg-[#ffe0e8]" />
                      <div className="mt-2 h-4 w-40 rounded bg-[#ffe0e8]" />
                    </div>
                  ))
                ) : safeArray(healthChecks).length > 0 ? (
                  safeArray(healthChecks).map((item, idx) => {
                    const StatusIcon = getStatusIcon(item.status || item.state);
                    return (
                      <div
                        key={item._id || item.id || idx}
                        className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[#31101e]">
                              {item.name ||
                                item.service ||
                                item.label ||
                                "Service"}
                            </p>
                            <p className="mt-1 text-sm text-[#7c4a5e]">
                              {item.details || item.message || "Status check"}
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
                  <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-6 text-center text-[#7c4a5e]">
                    No database health data found.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[#2c8a49]">
                    Collections
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
                    Document counts
                  </h3>
                </div>
                <Layers3 className="h-6 w-6 text-[#2c8a49]" />
              </div>

              <div className="mt-6 space-y-4">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="animate-pulse rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4"
                    >
                      <div className="h-3 w-24 rounded bg-[#ffe0e8]" />
                      <div className="mt-2 h-4 w-32 rounded bg-[#ffe0e8]" />
                    </div>
                  ))
                ) : safeArray(collections).length > 0 ? (
                  safeArray(collections).map((item, idx) => (
                    <div
                      key={item._id || item.id || idx}
                      className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#31101e]">
                            {item.name ||
                              item.collection ||
                              item.label ||
                              "Collection"}
                          </p>
                          <p className="mt-1 text-sm text-[#7c4a5e]">
                            {item.description ||
                              item.details ||
                              "Document total"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-semibold text-[#31101e]">
                            {formatNumber(
                              item.count ?? item.documents ?? item.total ?? 0,
                            )}
                          </p>
                          <p className="text-xs text-[#a44255]">docs</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-6 text-center text-[#7c4a5e]">
                    No collection counts available.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#9b1e27]">
                  System metrics
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
                  Live performance
                </h3>
              </div>
              <BarChart3 className="h-6 w-6 text-[#9b1e27]" />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="animate-pulse rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-5"
                  >
                    <div className="h-3 w-24 rounded bg-[#ffe0e8]" />
                    <div className="mt-4 h-8 w-20 rounded bg-[#ffe0e8]" />
                    <div className="mt-3 h-2 rounded-full bg-[#ffe0e8]" />
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
                      className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-5"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-[#7c4a5e]">
                        {item.label || "Metric"}
                      </p>
                      <p className="mt-3 text-3xl font-semibold text-[#31101e]">
                        {formatNumber(item.value)}
                        {item.unit || ""}
                      </p>
                      <div className="mt-4 h-2 rounded-full bg-[#ffe0e8]">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-[#9b1e27] to-[#ff4d6d]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-6 text-center text-[#7c4a5e]">
                  No metrics available.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <aside className="space-y-6">
          {/* API Health */}
          <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#d1661c]">
                  APIs
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
                  Health checks
                </h3>
              </div>
              <ShieldCheck className="h-6 w-6 text-[#2c8a49]" />
            </div>

            <div className="mt-6 space-y-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="animate-pulse rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4"
                  >
                    <div className="h-3 w-28 rounded bg-[#ffe0e8]" />
                    <div className="mt-2 h-4 w-36 rounded bg-[#ffe0e8]" />
                  </div>
                ))
              ) : healthChecks.length > 0 ? (
                healthChecks.map((item, idx) => {
                  const StatusIcon = getStatusIcon(item.status || item.state);
                  return (
                    <div
                      key={item._id || item.id || idx}
                      className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-[#31101e]">
                            {item.name || item.service || "API"}
                          </p>
                          <p className="mt-1 text-sm text-[#7c4a5e]">
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
                              ? "text-[#2c8a49]"
                              : ["DEGRADED", "WARNING", "MONITORING"].includes(
                                    normalizeStatus(item.status || item.state),
                                  )
                                ? "text-[#d1661c]"
                                : "text-[#d93f42]"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-6 text-center text-[#7c4a5e]">
                  No API checks available.
                </div>
              )}
            </div>
          </div>

          {/* Error logs */}
          <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#d93f42]">
                  Errors
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
                  Error logs
                </h3>
              </div>
              <AlertTriangle className="h-6 w-6 text-[#d93f42]" />
            </div>

            <div className="mt-6 space-y-4">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="animate-pulse rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4"
                  >
                    <div className="h-3 w-24 rounded bg-[#ffe0e8]" />
                    <div className="mt-2 h-4 w-44 rounded bg-[#ffe0e8]" />
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
                        const res = await api.get(ENDPOINTS.errorDetails(id));
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
                    className="w-full rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4 text-left transition hover:bg-white hover:border-[#ff4d6d]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#31101e]">
                          {log.message || log.error || "Error"}
                        </p>
                        <p className="mt-1 text-sm text-[#7c4a5e]">
                          {formatDateTime(
                            log.createdAt || log.timestamp || log.date,
                          )}
                        </p>
                      </div>

                      <span className="rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                        {log.level || "error"}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-6 text-center text-[#7c4a5e]">
                  No error logs found.
                </div>
              )}
            </div>
          </div>

          {/* Selected error detail */}
          <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#1e5aa8]">
                  Selected log
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
                  Details
                </h3>
              </div>
              <Eye className="h-6 w-6 text-[#1e5aa8]" />
            </div>

            <div className="mt-6">
              {!selectedError ? (
                <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-6 text-center text-[#7c4a5e]">
                  Click an error log to inspect details.
                </div>
              ) : detailsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="animate-pulse rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4"
                    >
                      <div className="h-3 w-28 rounded bg-[#ffe0e8]" />
                      <div className="mt-2 h-4 w-full rounded bg-[#ffe0e8]" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#7c4a5e]">
                      Message
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-[#31101e]">
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
                      value={selectedError.status || selectedError.level || "-"}
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
                      value={selectedError.stack || selectedError.trace || "-"}
                      multiline
                    />
                  </div>
                </div>
              )}
            </div>
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
      <p className="mt-1 text-xs text-[#a44255]">Services</p>
    </div>
  );
}

function DetailRow({ label, value, multiline = false }) {
  return (
    <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[#7c4a5e]">
        {label}
      </p>
      <p
        className={`mt-2 text-sm font-semibold text-[#31101e] ${
          multiline ? "whitespace-pre-wrap break-words" : "break-words"
        }`}
      >
        {value || "-"}
      </p>
    </div>
  );
}
