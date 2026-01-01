import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHospitalById } from "../services/hospitalApi";

const navItems = [
  { label: "Dashboard Overview", path: "/hospital/overview" },
  { label: "Blood Bank Requests", path: "/hospital/blood-requests" },
  { label: "NGO Donation Drives", path: "/hospital/ngo-drives" },
  { label: "Admin & Verification", path: "/hospital/admin" },
  { label: "Profile & Settings", path: "/hospital/profile" },
];

const statusBadgeStyles = {
  VERIFIED:
    "bg-[#ecf8ef] text-[#1f7a3a] border border-[#a2d8b3] shadow-[0_3px_12px_rgba(31,122,58,0.18)]",
  PENDING:
    "bg-[#fff3e4] text-[#b05f09] border border-[#f0c18c] shadow-[0_3px_12px_rgba(219,149,58,0.2)]",
  SUSPENDED:
    "bg-[#fde4e4] text-[#9e121c] border border-[#f5a5ad] shadow-[0_3px_12px_rgba(181,39,57,0.25)]",
  APPROVED:
    "bg-[#ecf8ef] text-[#1f7a3a] border border-[#a2d8b3] shadow-[0_3px_12px_rgba(31,122,58,0.18)]",
};

export default function HospitalLayout() {
  const location = useLocation();
  const { logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch hospital data from backend
  useEffect(() => {
    const fetchHospitalData = async () => {
      try {
        const organizationId = localStorage.getItem('organizationId');
        if (organizationId) {
          const response = await getHospitalById(organizationId);
          setHospital(response.data.data);
          console.log('[LAYOUT] Hospital data loaded:', response.data.data.name);
        }
      } catch (error) {
        console.error('[LAYOUT] Error fetching hospital:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalData();
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const SidebarContent = () => (
    <>
      <div>
        <p className="text-xs uppercase tracking-wider text-white/70 font-medium">
          SEBN
        </p>
        <h1 className="mt-3 text-2xl font-bold">Hospital Hub</h1>
        <p className="text-sm text-white/80 mt-1">Smart Emergency Blood Network</p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              location.pathname === item.path
                ? "bg-white/25 text-white shadow-inner"
                : "text-white/85 hover:bg-white/15"
            }`}
          >
            {item.label}
            <span>↗</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto rounded-2xl bg-white/10 p-5 backdrop-blur">
        <p className="text-sm text-white/80">Rapid escalation?</p>
        <p className="text-lg font-bold mt-1">Control Desk 24×7</p>
        <button className="mt-4 w-full rounded-full bg-white/90 py-3 text-sm font-semibold text-[#8f0f1a] transition hover:bg-white">
          Contact Admin
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-['Inter',sans-serif]">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex sticky top-0 h-screen w-80 shrink-0 flex-col gap-8 bg-gradient-to-b from-[#5c0f14] via-[#75161d] to-[#9b1e27] px-8 py-10 text-white shadow-2xl">
          <SidebarContent />
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-4 py-5 shadow-sm md:px-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden flex h-11 w-11 items-center justify-center rounded-2xl border border-[#f1d0c9] text-[#8f0f1a]"
                  aria-label="Open navigation"
                >
                  <div className="space-y-1.5">
                    <span className="block h-0.5 w-6 bg-current" />
                    <span className="block h-0.5 w-6 bg-current" />
                    <span className="block h-0.5 w-4 bg-current" />
                  </div>
                </button>
                <div>
                  <p className="text-xs uppercase tracking-wider text-red-700 font-bold">
                    {loading ? 'Loading...' : (hospital?.city || 'City')}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {loading ? 'Loading...' : (hospital?.name || 'Hospital')}
                    </h2>
                    {hospital && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusBadgeStyles[hospital.verificationStatus] || statusBadgeStyles.PENDING
                        }`}
                      >
                        {hospital.verificationStatus}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 font-medium">
                    Smart Emergency Blood Network • Hospital Role
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <Link
                  to="/hospital/profile"
                  className="rounded-full border-2 border-red-200 bg-white px-6 py-2 text-sm font-semibold text-red-700 shadow-md transition hover:border-red-700 hover:shadow-lg"
                >
                  View Profile
                </Link>
                <button
                  onClick={logout}
                  className="rounded-full bg-gradient-to-r from-[#8f0f1a] to-[#c62832] px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-8 md:px-10 bg-gradient-to-b from-gray-50 to-white">
            <Outlet />
          </main>
        </div>
      </div>

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
