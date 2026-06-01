import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  CheckCircle,
  Building2,
  BarChart3,
  Users,
  Activity,
  HeartPulse,
  Settings,
} from "lucide-react";

const navItems = [
  {
    path: "/superadmin/dashboard/overview",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    path: "/superadmin/dashboard/approvals",
    icon: CheckCircle,
    label: "Approvals",
  },
  {
    path: "/superadmin/dashboard/organizations",
    icon: Building2,
    label: "Organizations",
  },
  { path: "/superadmin/dashboard/stats", icon: BarChart3, label: "Statistics" },
  { path: "/superadmin/dashboard/users", icon: Users, label: "Users" },
  { path: "/superadmin/dashboard/activity", icon: Activity, label: "Activity" },
  {
    path: "/superadmin/dashboard/health",
    icon: HeartPulse,
    label: "System Health",
  },
  { path: "/superadmin/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function SuperAdminLayout() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const organizationName = user?.name || "SuperAdmin";
  const verificationStatus = user?.verificationStatus || "VERIFIED";

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const SidebarContent = () => (
    <>
      <div>
        <p className="text-xs uppercase tracking-wider text-white/70 font-medium">
          BloodgBridge
        </p>
        <h1 className="mt-3 text-2xl font-bold">{organizationName}</h1>
        <p className="text-sm text-white/80 mt-1">SuperAdmin Command Deck</p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                location.pathname === item.path
                  ? "bg-white/25 text-white"
                  : "text-white/90 hover:bg-white/15"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                {item.label}
              </div>
              <span>↗</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl bg-white/15 p-5 backdrop-blur">
        <p className="text-sm text-white/80">Need escalation?</p>
        <p className="text-lg font-bold mt-1">Control Room 24×7</p>
        <button className="mt-4 w-full rounded-full bg-white/90 py-3 text-sm font-semibold text-[#ff4d6d] transition hover:bg-white">
          Contact Admin
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#fff8f0] text-[#331c1b] font-['Inter',sans-serif]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:flex sticky top-0 h-screen w-80 shrink-0 flex-col gap-8 bg-gradient-to-b from-[#5c0f14] via-[#75161d] to-[#9b1e27] px-8 py-10 text-white shadow-2xl">
          <SidebarContent />
        </aside>

        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-20 border-b border-[#e0cfc7] bg-[#fffdfb]/90 px-4 py-5 backdrop-blur md:px-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden flex h-11 w-11 items-center justify-center rounded-2xl border border-[#f2c8c8] text-[#ff4d6d]"
                  aria-label="Open navigation"
                >
                  <div className="space-y-1.5">
                    <span className="block h-0.5 w-6 bg-current" />
                    <span className="block h-0.5 w-6 bg-current" />
                    <span className="block h-0.5 w-4 bg-current" />
                  </div>
                </button>
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#ff4d6d] font-medium">
                    SUPERADMIN
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold text-[#31101e]">
                      {organizationName}
                    </h2>
                    <span className="rounded-full border border-white/70 bg-white px-3 py-1 text-xs font-semibold text-[#9b1e27] shadow-[0_6px_20px_rgba(155,30,39,0.18)]">
                      ADMIN ROLE
                    </span>
                  </div>
                  <p className="text-sm text-[#7c4a5e] mt-1">
                    Smart Emergency Blood Network • SuperAdmin Role
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-gradient-to-r from-[#ff4d6d] to-[#ff8fa3] px-6 py-2 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(255,77,109,0.35)] transition hover:scale-105"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 px-4 py-8 md:px-10">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition ${
          drawerOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className={`absolute right-0 h-full w-80 max-w-[80%] bg-gradient-to-b from-[#5c0f14] via-[#75161d] to-[#9b1e27] px-7 py-8 text-white shadow-2xl transition-transform duration-300 ${
            drawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm font-semibold tracking-wider text-white/70">
              NAVIGATION
            </p>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="rounded-full border border-white/40 px-3 py-1 text-xs font-semibold text-white/80"
            >
              Close
            </button>
          </div>
          <SidebarContent />
        </div>
      </div>
    </div>
  );
}
