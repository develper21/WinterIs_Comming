import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { NgoDataProvider, useNgoData } from "../pages/ngo/context";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard Overview", path: "/ngo/dashboard/overview" },
  { label: "Camp Management", path: "/ngo/dashboard/camps" },
  { label: "Slot Management", path: "/ngo/dashboard/slots" },
  { label: "Donor Registry", path: "/ngo/dashboard/donors" },
  { label: "Connectivity Grid", path: "/ngo/dashboard/connectivity" },
];

const ngoProfile = {
  name: "MetroCare Foundation",
  region: "Mumbai · Western Cluster",
  hotline: "+91 95123 75141",
};

function NgoShell() {
  const location = useLocation();
  const { stats, expectedActualRatio } = useNgoData();
  const { logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const heroStats = [
    { label: "Total Camps", value: stats.totalCamps, meta: "Portfolio" },
    { label: "Active", value: stats.active, meta: "On-ground" },
    { label: "Upcoming", value: stats.upcoming, meta: "Next 30 days" },
    { label: "Registered Donors", value: stats.totalRegistered, meta: "Confirmed" },
  ];

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const SidebarContent = () => (
    <>
      <div>
        <p className="text-xs uppercase tracking-wider text-white/70 font-medium">
          SEBN
        </p>
        <h1 className="mt-3 text-2xl font-bold">NGO Command</h1>
        <p className="text-sm text-white/80 mt-1">Smart Emergency Blood Network</p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              location.pathname === item.path
                ? "bg-white/25 text-white"
                : "text-white/90 hover:bg-white/15"
            }`}
          >
            {item.label}
            <span>↗</span>
          </Link>
        ))}
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
        <aside className="hidden lg:flex sticky top-0 h-screen w-80 shrink-0 flex-col gap-8 bg-gradient-to-b from-[#5c0f14] via-[#75161d] to-[#9b1e27] px-8 py-10 text-white shadow-2xl">
          <SidebarContent />
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[#e0cfc7] bg-[#fffdfb]/90 px-4 py-5 backdrop-blur md:px-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden flex h-11 w-11 items-center justify-center rounded-2xl border border-[#f2c8c8] text-[#9b1e27]"
                  aria-label="Open navigation"
                >
                  <span className="sr-only">Open navigation</span>
                  <div className="space-y-1.5">
                    <span className="block h-0.5 w-6 bg-current"></span>
                    <span className="block h-0.5 w-6 bg-current"></span>
                    <span className="block h-0.5 w-4 bg-current"></span>
                  </div>
                </button>
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#ff4d6d] font-medium">
                    {ngoProfile.region}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold text-[#31101e]">
                      {ngoProfile.name}
                    </h2>
                    <span className="rounded-full border border-white/70 bg-white px-3 py-1 text-xs font-semibold text-[#9b1e27] shadow-[0_6px_20px_rgba(155,30,39,0.18)]">
                      NGO ROLE
                    </span>
                  </div>
                  <p className="text-sm text-[#7c4a5e] mt-1">
                    Smart Emergency Blood Network • NGO Operations
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <div className="rounded-3xl border border-pink-100 bg-white px-6 py-4 text-sm text-[#7c4a5e] shadow-[0_12px_30px_rgba(255,122,149,0.18)]">
                  <p className="text-xs uppercase tracking-wide text-[#ff4d6d] font-medium">
                    Expected vs Actual
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#31101e]">
                    {expectedActualRatio}%
                  </p>
                  <p className="text-xs">Conversion ratio</p>
                </div>
                <a
                  href={`tel:${ngoProfile.hotline}`}
                  className="flex items-center gap-3 rounded-full border border-[#ffd6df] bg-white/85 px-6 py-3 text-sm font-semibold text-[#9b1e27] shadow-[0_12px_28px_rgba(155,30,39,0.18)] transition hover:bg-white"
                >
                  <span className="text-xs uppercase tracking-wide text-[#ff4d6d] font-medium">
                    Hotline
                  </span>
                  <span>{ngoProfile.hotline}</span>
                </a>
                <button
                  onClick={logout}
                  className="rounded-full bg-gradient-to-r from-[#ff4d6d] to-[#ff8fa3] px-6 py-2 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(255,77,109,0.35)] transition hover:scale-105"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-8 md:px-10">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {heroStats.map((card) => (
                <article
                  key={card.label}
                  className="rounded-3xl border border-[#ffe0e8] bg-white px-5 py-5 shadow-[0_20px_45px_rgba(255,122,149,0.12)]"
                >
                  <p className="text-xs uppercase tracking-wide text-[#a44255] font-medium">
                    {card.meta}
                  </p>
                  <p className="mt-3 text-4xl font-bold text-[#31101e]">
                    {card.value}
                  </p>
                  <p className="text-sm text-[#a44255] mt-1">{card.label}</p>
                </article>
              ))}
            </section>

            <div className="mt-8">
              <Outlet />
            </div>
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

export default function NgoLayout() {
  return (
    <NgoDataProvider>
      <NgoShell />
    </NgoDataProvider>
  );
}
