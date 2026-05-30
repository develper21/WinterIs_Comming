import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  Settings,
  Sparkles,
  Users,
  UserRound,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const API = {
  overview: "http://localhost:5000/api/superadmin/dashboard/overview",
  pending: "http://localhost:5000/api/superadmin/organizations/pending",
  organizations: "http://localhost:5000/api/superadmin/organizations?limit=6",
  activity: "http://localhost:5000/api/superadmin/activity?limit=8",
  health: "http://localhost:5000/api/superadmin/system-health",
};

const safeArray = (value) => (Array.isArray(value) ? value : []);

const formatNumber = (value) => {
  if (value === null || value === undefined) return "0";
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
};

export default function Dashboard() {
  const navigate = useNavigate();
  const auth = useAuth() || {};

  const user = auth.user || auth.admin || auth.currentUser || null;
  const token =
    auth.token || auth.accessToken || localStorage.getItem("token") || "";
  const isSuperAdmin = user
    ? user.isSuperAdmin ||
      user.role === "SUPERADMIN" ||
      user.role === "superadmin"
    : true;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [overview, setOverview] = useState({
    totalOrganizations: 0,
    pendingApprovals: 0,
    activeUsers: 0,
    totalRequests: 0,
    approvedToday: 0,
    rejectedToday: 0,
    bloodBanks: 0,
    hospitals: 0,
    ngos: 0,
  });

  const [pendingOrganizations, setPendingOrganizations] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState([]);

  useEffect(() => {
    if (!token) {
      navigate("/superadmin-login", { replace: true });
      return;
    }

    if (!isSuperAdmin) {
      navigate("/superadmin-login", { replace: true });
    }
  }, [token, isSuperAdmin, navigate]);

  const api = useMemo(() => {
    return axios.create({
      baseURL: "http://localhost:5000",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }, [token]);

  const loadDashboard = async () => {
    setError("");
    try {
      const [overviewRes, pendingRes, orgRes, activityRes, healthRes] =
        await Promise.allSettled([
          api.get(API.overview),
          api.get(API.pending),
          api.get(API.organizations),
          api.get(API.activity),
          api.get(API.health),
        ]);

      if (overviewRes.status === "fulfilled") {
        const data =
          overviewRes.value.data?.data || overviewRes.value.data || {};
        setOverview((prev) => ({
          ...prev,
          ...data,
        }));
      }

      if (pendingRes.status === "fulfilled") {
        const data = pendingRes.value.data?.data || pendingRes.value.data || {};
        setPendingOrganizations(
          safeArray(
            data.items ||
              data.organizations ||
              data.pendingOrganizations ||
              data,
          ),
        );
      }

      if (orgRes.status === "fulfilled") {
        const data = orgRes.value.data?.data || orgRes.value.data || {};
        setOrganizations(safeArray(data.items || data.organizations || data));
      }

      if (activityRes.status === "fulfilled") {
        const data =
          activityRes.value.data?.data || activityRes.value.data || {};
        setRecentActivity(
          safeArray(data.items || data.activities || data.logs || data),
        );
      }

      if (healthRes.status === "fulfilled") {
        const data = healthRes.value.data?.data || healthRes.value.data || {};
        setSystemHealth(
          safeArray(data.items || data.checks || data.services || data),
        );
      }

      const failed = [
        overviewRes,
        pendingRes,
        orgRes,
        activityRes,
        healthRes,
      ].some((result) => result.status === "rejected");

      if (failed) {
        setError(
          "Some dashboard panels could not be loaded. Check the backend route names in the API block.",
        );
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError("Failed to load superadmin dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleLogout = () => {
    try {
      auth.logout?.();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("admin");
      localStorage.removeItem("auth");
      localStorage.removeItem("authToken");
      localStorage.removeItem("superadmin");
    } finally {
      navigate("/superadmin-login", { replace: true });
    }
  };

  const stats = [
    {
      title: "Total Organizations",
      value: overview.totalOrganizations,
      icon: Building2,
      accent: "from-cyan-500 to-blue-500",
      note: "All verified and pending orgs",
    },
    {
      title: "Pending Approvals",
      value: overview.pendingApprovals,
      icon: Clock3,
      accent: "from-amber-500 to-orange-500",
      note: "Waiting for review",
    },
    {
      title: "Active Users",
      value: overview.activeUsers,
      icon: Users,
      accent: "from-emerald-500 to-teal-500",
      note: "Connected accounts",
    },
    {
      title: "Total Requests",
      value: overview.totalRequests,
      icon: Activity,
      accent: "from-rose-500 to-pink-500",
      note: "Platform-wide requests",
    },
  ];

  const quickActions = [
    {
      label: "Review Approvals",
      description: "Process pending organization registrations",
      icon: BadgeCheck,
      path: "/superadmin/approvals",
      accent: "from-amber-500 to-orange-500",
    },
    {
      label: "Manage Organizations",
      description: "View and edit all registered organizations",
      icon: Building2,
      path: "/superadmin/organizations",
      accent: "from-cyan-500 to-blue-500",
    },
    {
      label: "Analytics & Stats",
      description: "Track platform performance and trends",
      icon: BarChart3,
      path: "/superadmin/stats",
      accent: "from-emerald-500 to-teal-500",
    },
    {
      label: "System Settings",
      description: "Update admin and platform configuration",
      icon: Settings,
      path: "/superadmin/settings",
      accent: "from-violet-500 to-fuchsia-500",
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#050816] text-white relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 h-[420px] w-[420px] rounded-full bg-red-500/20 blur-3xl" />
        <div className="absolute top-24 right-0 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden xl:flex w-[320px] flex-col border-r border-white/10 bg-slate-950/70 backdrop-blur-xl">
          <div className="px-7 py-8 border-b border-white/10">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              <Sparkles className="h-4 w-4" />
              Superadmin Control
            </div>

            <h2 className="mt-5 text-3xl font-black leading-tight text-white">
              BloodBridge
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Central administration portal
            </p>
          </div>

          <nav className="flex-1 px-5 py-6 space-y-2">
            {[
              {
                label: "Dashboard Overview",
                icon: LayoutDashboard,
                active: true,
                path: "/superadmin/dashboard",
              },
              {
                label: "Approvals",
                icon: BadgeCheck,
                active: false,
                path: "/superadmin/approvals",
              },
              {
                label: "Organizations",
                icon: Building2,
                active: false,
                path: "/superadmin/organizations",
              },
              {
                label: "Activity Logs",
                icon: FileText,
                active: false,
                path: "/superadmin/activity",
              },
              {
                label: "System Health",
                icon: ShieldCheck,
                active: false,
                path: "/superadmin/system-health",
              },
              {
                label: "Users",
                icon: UserRound,
                active: false,
                path: "/superadmin/users",
              },
              {
                label: "Settings",
                icon: Settings,
                active: false,
                path: "/superadmin/settings",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                    item.active
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-5 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-semibold text-white transition hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex h-20 items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-red-400">
                    Superadmin Dashboard
                  </p>
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    Network Control Center
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
                    onClick={handleLogout}
                    className="hidden sm:inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:scale-[1.02]"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10 space-y-8">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 lg:p-10">
              <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-red-500/20 blur-3xl" />
              <div className="absolute left-0 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

              <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    Logged in as {user?.name || "Superadmin"}
                  </div>

                  <h2 className="mt-6 text-4xl sm:text-5xl font-black leading-tight text-white">
                    Oversee approvals, organizations, and platform health
                  </h2>

                  <p className="mt-4 max-w-3xl text-gray-400 leading-relaxed">
                    Use this dashboard to review registrations, monitor live
                    activity, and keep the BloodBridge healthcare network secure
                    and organized.
                  </p>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <p className="text-sm text-gray-400">Access level</p>
                  <p className="mt-2 text-2xl font-black text-white">
                    Superadmin
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    {user?.email || "admin@platform.com"}
                  </p>
                </div>
              </div>
            </section>

            {error && (
              <div className="rounded-[28px] border border-amber-500/20 bg-amber-500/10 p-4 text-amber-200">
                {error}
              </div>
            )}

            {/* Stats */}
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {(loading ? Array.from({ length: 4 }) : stats).map(
                (item, idx) => {
                  if (loading) {
                    return (
                      <div
                        key={idx}
                        className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl animate-pulse"
                      >
                        <div className="h-4 w-24 rounded bg-white/10" />
                        <div className="mt-5 h-10 w-20 rounded bg-white/10" />
                        <div className="mt-4 h-3 w-32 rounded bg-white/10" />
                      </div>
                    );
                  }

                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-white/20"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-gray-400">{item.title}</p>
                          <h3 className="mt-3 text-4xl font-black text-white">
                            {formatNumber(item.value)}
                          </h3>
                          <p className="mt-2 text-xs text-gray-500">
                            {item.note}
                          </p>
                        </div>

                        <div
                          className={`rounded-2xl bg-gradient-to-br ${item.accent} p-4`}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </section>

            {/* Middle */}
            <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-red-400">
                      Approval queue
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-white">
                      Pending Organizations
                    </h3>
                  </div>

                  <button
                    onClick={() => navigate("/superadmin/approvals")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                  >
                    View all
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="animate-pulse rounded-2xl border border-white/10 bg-slate-950/40 p-5"
                      >
                        <div className="h-4 w-48 rounded bg-white/10" />
                        <div className="mt-3 h-3 w-32 rounded bg-white/10" />
                        <div className="mt-5 h-10 w-28 rounded bg-white/10" />
                      </div>
                    ))
                  ) : pendingOrganizations.length > 0 ? (
                    pendingOrganizations.map((org) => (
                      <div
                        key={
                          org._id || org.id || org.organizationCode || org.name
                        }
                        className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 transition hover:border-white/20"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-lg font-bold text-white">
                                {org.organizationName ||
                                  org.name ||
                                  "Organization"}
                              </h4>
                              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">
                                {org.status || "Pending"}
                              </span>
                            </div>

                            <p className="mt-1 text-sm text-gray-400">
                              {org.organizationType ||
                                org.type ||
                                "Organization"}{" "}
                              •{" "}
                              {org.city ||
                                org.location?.city ||
                                "Unknown location"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 font-mono">
                              {org.organizationCode || org.code || org._id}
                            </p>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() =>
                                navigate("/superadmin/organization-details")
                              }
                              className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white"
                            >
                              Review
                            </button>
                            <button
                              onClick={() =>
                                navigate("/superadmin/organizations")
                              }
                              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-8 text-center text-gray-400">
                      <Clock3 className="mx-auto h-10 w-10 text-gray-500" />
                      <p className="mt-4">No pending approvals right now.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.25em] text-cyan-400">
                        System health
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-white">
                        Live status
                      </h3>
                    </div>
                    <div className="rounded-2xl bg-emerald-500/10 p-3">
                      <ShieldCheck className="h-6 w-6 text-emerald-300" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {loading
                      ? Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className="animate-pulse rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                          >
                            <div className="h-4 w-24 rounded bg-white/10" />
                            <div className="mt-2 h-3 w-32 rounded bg-white/10" />
                          </div>
                        ))
                      : (systemHealth.length > 0
                          ? systemHealth
                          : [
                              {
                                name: "Database",
                                status: "Healthy",
                                details: "MongoDB connected",
                              },
                              {
                                name: "API Services",
                                status: "Running",
                                details: "All routes active",
                              },
                              {
                                name: "Cache Layer",
                                status: "Active",
                                details: "Redis available",
                              },
                              {
                                name: "Alerts",
                                status: "Monitoring",
                                details: "No critical issues",
                              },
                            ]
                        ).map((item, idx) => {
                          const status = String(
                            item.status || item.state || "unknown",
                          ).toLowerCase();
                          const ok = [
                            "healthy",
                            "running",
                            "active",
                            "ok",
                            "normal",
                            "good",
                          ].includes(status);
                          const warn = [
                            "monitoring",
                            "warning",
                            "degraded",
                            "pending",
                          ].includes(status);

                          return (
                            <div
                              key={item.name || idx}
                              className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-white">
                                    {item.name || item.service || "Service"}
                                  </p>
                                  <p className="mt-1 text-sm text-gray-400">
                                    {item.details ||
                                      item.message ||
                                      "No details provided"}
                                  </p>
                                </div>

                                <span
                                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                                    ok
                                      ? "bg-emerald-500/10 text-emerald-300"
                                      : warn
                                        ? "bg-amber-500/10 text-amber-300"
                                        : "bg-rose-500/10 text-rose-300"
                                  }`}
                                >
                                  {ok ? (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  ) : warn ? (
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5" />
                                  )}
                                  {item.status || item.state || "Unknown"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                  </div>
                </div>

                <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <p className="text-sm uppercase tracking-[0.25em] text-rose-400">
                    Alert summary
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    Today’s activity
                  </h3>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <p className="text-xs text-gray-400">Approved today</p>
                      <p className="mt-2 text-3xl font-black text-emerald-300">
                        {formatNumber(overview.approvedToday || 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <p className="text-xs text-gray-400">Rejected today</p>
                      <p className="mt-2 text-3xl font-black text-rose-300">
                        {formatNumber(overview.rejectedToday || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom */}
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-violet-400">
                      Recent activity
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-white">
                      Live feed
                    </h3>
                  </div>
                  <button
                    onClick={() => navigate("/superadmin/activity")}
                    className="text-sm text-gray-300 hover:text-white"
                  >
                    View all
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="animate-pulse rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                        >
                          <div className="h-4 w-52 rounded bg-white/10" />
                          <div className="mt-2 h-3 w-28 rounded bg-white/10" />
                        </div>
                      ))
                    : (recentActivity.length > 0
                        ? recentActivity
                        : [
                            {
                              title: "Apollo Healthcare Center registered",
                              time: "5 mins ago",
                            },
                            {
                              title: "LifeCare Blood Bank submitted update",
                              time: "18 mins ago",
                            },
                            {
                              title: "New donation camp created",
                              time: "1 hour ago",
                            },
                            {
                              title: "Approval queue refreshed",
                              time: "2 hours ago",
                            },
                          ]
                      ).map((item, idx) => (
                        <div
                          key={item._id || idx}
                          className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                        >
                          <p className="font-semibold text-white">
                            {item.title ||
                              item.action ||
                              item.message ||
                              "Activity"}
                          </p>
                          <p className="mt-1 text-sm text-gray-400">
                            {item.time ||
                              item.createdAt ||
                              item.timestamp ||
                              "Just now"}
                          </p>
                        </div>
                      ))}
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-emerald-400">
                      Quick actions
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-white">
                      Admin tasks
                    </h3>
                  </div>
                  <Search className="h-5 w-5 text-gray-400" />
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.label}
                        onClick={() => navigate(action.path)}
                        className="group rounded-[26px] border border-white/10 bg-slate-950/40 p-5 text-left transition hover:-translate-y-1 hover:border-white/20"
                      >
                        <div
                          className={`inline-flex rounded-2xl bg-gradient-to-r ${action.accent} p-3`}
                        >
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="mt-4 text-lg font-bold text-white">
                          {action.label}
                        </h4>
                        <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                          {action.description}
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-300 group-hover:text-white">
                          Open
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Mobile Logout */}
            <div className="xl:hidden">
              <button
                onClick={handleLogout}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-semibold text-white transition hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
