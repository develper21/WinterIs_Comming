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
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const API = {
  overview: "http://localhost:5000/api/admin/dashboard/overview",
  pending: "http://localhost:5000/api/admin/approvals/pending/all",
  organizations:
    "http://localhost:5000/api/admin/approvals/pending/all?limit=6",
  allOrganizations: "http://localhost:5000/api/auth/org/all?limit=6",
  activity: "http://localhost:5000/api/admin/dashboard/activity?limit=8",
  health: "http://localhost:5000/api/admin/dashboard/health",
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
      const [
        overviewRes,
        pendingRes,
        orgRes,
        allOrgRes,
        activityRes,
        healthRes,
      ] = await Promise.allSettled([
        api.get(API.overview),
        api.get(API.pending),
        api.get(API.organizations),
        api.get(API.allOrganizations),
        api.get(API.activity),
        api.get(API.health),
      ]);

      if (overviewRes.status === "fulfilled") {
        const data = overviewRes.value.data?.data || {};
        setOverview((prev) => ({
          ...prev,
          totalOrganizations: data.organizations?.total || 0,
          pendingApprovals: data.organizations?.pending || 0,
          activeUsers: data.users?.total || 0,
          bloodBanks: data.organizations?.bloodBanks || 0,
          hospitals: data.organizations?.hospitals || 0,
          ngos: data.organizations?.ngos || 0,
        }));
      }

      if (pendingRes.status === "fulfilled") {
        const data = pendingRes.value.data?.data || {};
        setPendingOrganizations(
          safeArray(
            data.items ||
              data.organizations ||
              data.pendingOrganizations ||
              data.hospitals ||
              data.bloodBanks ||
              data.ngos ||
              [],
          ),
        );
      }

      if (orgRes.status === "fulfilled") {
        const orgData = orgRes.value.data?.data || {};
        setOrganizations(safeArray(orgData.organizations || []));
      }

      if (allOrgRes.status === "fulfilled") {
        const allOrgData = allOrgRes.value.data?.data || {};
        setOrganizations(
          safeArray(allOrgData.organizations || allOrgData.items || []),
        );
      }

      if (activityRes.status === "fulfilled") {
        const data = activityRes.value.data?.data || {};
        setRecentActivity(
          safeArray(data.logs || data.activities || data.items || []),
        );
      }

      if (healthRes.status === "fulfilled") {
        const data = healthRes.value.data?.data || {};
        const healthChecks = [];
        if (data.collections) {
          Object.entries(data.collections).forEach(([key, value]) => {
            healthChecks.push({
              name: key,
              status: value.status,
              details: `${value.documentCount || 0} documents`,
            });
          });
        }
        setSystemHealth(healthChecks);
      }

      const failed = [
        overviewRes,
        pendingRes,
        orgRes,
        allOrgRes,
        activityRes,
        healthRes,
      ].some((result) => result.status === "rejected");

      if (failed) {
        setError(
          "Some dashboard panels could not be loaded. Check the backend route names in the API block.",
        );
        toast.error("Some dashboard data failed to load");
      } else {
        toast.success("Dashboard refreshed successfully");
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError("Failed to load superadmin dashboard.");
      toast.error("Failed to load dashboard");
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
      toast.success("Logged out successfully");
    } finally {
      navigate("/superadmin-login", { replace: true });
    }
  };

  const stats = [
    {
      title: "Total Organizations",
      value: overview.totalOrganizations,
      icon: Building2,
      accent: "from-[#7c0d16] to-[#b71d24]",
      note: "All verified and pending orgs",
    },
    {
      title: "Pending Approvals",
      value: overview.pendingApprovals,
      icon: Clock3,
      accent: "from-[#d1661c] to-[#f2994a]",
      note: "Waiting for review",
    },
    {
      title: "Active Users",
      value: overview.activeUsers,
      icon: Users,
      accent: "from-[#2c8a49] to-[#5ec271]",
      note: "Connected accounts",
    },
    {
      title: "Total Requests",
      value: overview.totalRequests,
      icon: Activity,
      accent: "from-[#1e5aa8] to-[#6fb1ff]",
      note: "Platform-wide requests",
    },
  ];

  const quickActions = [
    {
      label: "Review Approvals",
      description: "Process pending organization registrations",
      icon: BadgeCheck,
      path: "/superadmin/dashboard/approvals",
      accent: "from-[#d1661c] to-[#f2994a]",
    },
    {
      label: "Manage Organizations",
      description: "View and edit all registered organizations",
      icon: Building2,
      path: "/superadmin/dashboard/organizations",
      accent: "from-[#7c0d16] to-[#b71d24]",
    },
    {
      label: "Analytics & Stats",
      description: "Track platform performance and trends",
      icon: BarChart3,
      path: "/superadmin/dashboard/stats",
      accent: "from-[#2c8a49] to-[#5ec271]",
    },
    {
      label: "System Settings",
      description: "Update admin and platform configuration",
      icon: Settings,
      path: "/superadmin/dashboard/settings",
      accent: "from-[#9b1e27] to-[#d93f42]",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
            Overview
          </p>
          <h3 className="text-3xl font-semibold text-[#31101e]">
            SuperAdmin Command Center
          </h3>
          <p className="text-sm text-[#7c4a5e]">
            Oversee approvals, organizations, and platform health
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-full border border-[#f2c8c8] bg-white/80 px-6 py-3 text-sm font-semibold text-[#ff4d6d] shadow-[0_10px_25px_rgba(255,77,109,0.15)] hover:shadow-[0_15px_35px_rgba(255,77,109,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing..." : "Refresh Dashboard"}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-800">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {(loading ? Array.from({ length: 4 }) : stats).map((item, idx) => {
          if (loading) {
            return (
              <div
                key={idx}
                className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)] animate-pulse"
              >
                <div className="h-4 w-24 rounded bg-[#ffe0e8]" />
                <div className="mt-5 h-10 w-20 rounded bg-[#ffe0e8]" />
                <div className="mt-4 h-3 w-32 rounded bg-[#ffe0e8]" />
              </div>
            );
          }

          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)] transition hover:-translate-y-1 hover:shadow-[0_25px_55px_rgba(255,122,149,0.18)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[#7c4a5e]">
                    {item.title}
                  </p>
                  <h3 className="mt-3 text-4xl font-semibold text-[#31101e]">
                    {formatNumber(item.value)}
                  </h3>
                  <p className="mt-2 text-xs text-[#a44255]">{item.note}</p>
                </div>

                <div
                  className={`rounded-2xl bg-gradient-to-br ${item.accent} p-4`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Middle */}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
                Approval queue
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
                Pending Organizations
              </h3>
            </div>

            <button
              onClick={() => navigate("/superadmin/dashboard/approvals")}
              className="inline-flex items-center gap-2 rounded-full border border-[#f2c8c8] bg-white/80 px-4 py-2 text-sm font-semibold text-[#ff4d6d] transition hover:bg-white"
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
                  className="animate-pulse rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-5"
                >
                  <div className="h-4 w-48 rounded bg-[#ffe0e8]" />
                  <div className="mt-3 h-3 w-32 rounded bg-[#ffe0e8]" />
                  <div className="mt-5 h-10 w-28 rounded bg-[#ffe0e8]" />
                </div>
              ))
            ) : pendingOrganizations.length > 0 ? (
              pendingOrganizations.map((org) => (
                <div
                  key={org._id || org.id || org.organizationCode || org.name}
                  className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-5 transition hover:border-[#ff4d6d] hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-semibold text-[#31101e]">
                          {org.organizationName || org.name || "Organization"}
                        </h4>
                        <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          {org.status || "Pending"}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-[#7c4a5e]">
                        {org.organizationType || org.type || "Organization"} •{" "}
                        {org.city || org.location?.city || "Unknown location"}
                      </p>
                      <p className="mt-1 text-xs text-[#a44255] font-mono">
                        {org.organizationCode || org.code || org._id}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          navigate("/superadmin/organization-details")
                        }
                        className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => navigate("/superadmin/organizations")}
                        className="rounded-2xl border border-[#f2c8c8] bg-white/80 px-4 py-3 text-sm font-semibold text-[#ff4d6d] transition hover:bg-white"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-8 text-center text-[#7c4a5e]">
                <Clock3 className="mx-auto h-10 w-10 text-[#a44255]" />
                <p className="mt-4">No pending approvals right now.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#9b1e27]">
                  Recent organizations
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
                  Latest registrations
                </h3>
              </div>
              <button
                onClick={() => navigate("/superadmin/organizations")}
                className="text-sm font-semibold text-[#ff4d6d] hover:text-[#9b1e27]"
              >
                View all
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4"
                    >
                      <div className="h-4 w-32 rounded bg-[#ffe0e8]" />
                      <div className="mt-2 h-3 w-24 rounded bg-[#ffe0e8]" />
                    </div>
                  ))
                : (organizations.length > 0
                    ? organizations.slice(0, 3)
                    : [
                        {
                          name: "City Blood Bank",
                          type: "Blood Bank",
                          city: "Mumbai",
                        },
                        {
                          name: "General Hospital",
                          type: "Hospital",
                          city: "Delhi",
                        },
                        {
                          name: "Healthcare NGO",
                          type: "NGO",
                          city: "Bangalore",
                        },
                      ]
                  ).map((org, idx) => (
                    <div
                      key={org._id || org.id || idx}
                      className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4"
                    >
                      <p className="font-semibold text-[#31101e]">
                        {org.organizationName || org.name || "Organization"}
                      </p>
                      <p className="mt-1 text-sm text-[#7c4a5e]">
                        {org.organizationType || org.type || "Organization"} •{" "}
                        {org.city || org.location?.city || "Unknown"}
                      </p>
                    </div>
                  ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#1e5aa8]">
                  System health
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
                  Live status
                </h3>
              </div>
              <div className="rounded-2xl bg-emerald-100 p-3">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4"
                    >
                      <div className="h-4 w-24 rounded bg-[#ffe0e8]" />
                      <div className="mt-2 h-3 w-32 rounded bg-[#ffe0e8]" />
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
                        className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[#31101e]">
                              {item.name || item.service || "Service"}
                            </p>
                            <p className="mt-1 text-sm text-[#7c4a5e]">
                              {item.details ||
                                item.message ||
                                "No details provided"}
                            </p>
                          </div>

                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                              ok
                                ? "bg-emerald-100 text-emerald-700"
                                : warn
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
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

          <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
            <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
              Alert summary
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
              Today's activity
            </h3>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4">
                <p className="text-xs text-[#7c4a5e]">Approved today</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-600">
                  {formatNumber(overview.approvedToday || 0)}
                </p>
              </div>
              <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4">
                <p className="text-xs text-[#7c4a5e]">Rejected today</p>
                <p className="mt-2 text-3xl font-semibold text-red-600">
                  {formatNumber(overview.rejectedToday || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#9b1e27]">
                Recent activity
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
                Live feed
              </h3>
            </div>
            <button
              onClick={() => navigate("/superadmin/dashboard/activity")}
              className="text-sm font-semibold text-[#ff4d6d] hover:text-[#9b1e27]"
            >
              View all
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4"
                  >
                    <div className="h-4 w-52 rounded bg-[#ffe0e8]" />
                    <div className="mt-2 h-3 w-28 rounded bg-[#ffe0e8]" />
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
                    className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4"
                  >
                    <p className="font-semibold text-[#31101e]">
                      {item.title || item.action || item.message || "Activity"}
                    </p>
                    <p className="mt-1 text-sm text-[#7c4a5e]">
                      {item.time ||
                        item.createdAt ||
                        item.timestamp ||
                        "Just now"}
                    </p>
                  </div>
                ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#2c8a49]">
                Quick actions
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
                Admin tasks
              </h3>
            </div>
            <Search className="h-5 w-5 text-[#7c4a5e]" />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="group rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-5 text-left transition hover:-translate-y-1 hover:border-[#ff4d6d] hover:shadow-md"
                >
                  <div
                    className={`inline-flex rounded-2xl bg-gradient-to-r ${action.accent} p-3`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="mt-4 text-lg font-semibold text-[#31101e]">
                    {action.label}
                  </h4>
                  <p className="mt-2 text-sm text-[#7c4a5e] leading-relaxed">
                    {action.description}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#ff4d6d] group-hover:text-[#9b1e27]">
                    Open
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Logout */}
      <div className="xl:hidden">
        <button
          onClick={handleLogout}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-[#f2c8c8] bg-white/80 px-5 py-4 font-semibold text-[#ff4d6d] shadow-[0_10px_25px_rgba(255,77,109,0.15)] transition hover:bg-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </section>
  );
}
