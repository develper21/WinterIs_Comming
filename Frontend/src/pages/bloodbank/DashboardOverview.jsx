import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllNgoDrives } from "../../services/bloodBankApi";
import {
  getBloodBankRequestStats,
  getBloodBankRequests,
} from "../../services/hospitalBloodRequestApi";
import toast from "react-hot-toast";

const normalizeRequests = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.requests)) return payload.requests;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    completedSupplies: 0,
    upcomingNgoDrives: 0,
    verificationStatus: "VERIFIED",
  });
  const [requests, setRequests] = useState([]);
  const [ngoDrives, setNgoDrives] = useState([]);

  const navigate = useNavigate();

  const quickActions = [
    { label: "Create Request", icon: "🩸", action: "request" },
    { label: "Log Supply", icon: "📦", action: "supply" },
    { label: "Schedule Drive", icon: "📅", action: "drive" },
  ];

  const handleQuickAction = (action) => {
    switch (action) {
      case "request":
        navigate("/bloodbank/hospital-requests");
        toast.success("Headed to Hospital Requests");
        break;
      case "supply":
        navigate("/bloodbank/blood-stock");
        toast.success("Opening Blood Stock");
        break;
      case "drive":
        navigate("/bloodbank/ngo-drives");
        toast.success("Opening NGO Drives");
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const bloodBankId =
        storedUser.organizationId ||
        storedUser.bloodBankId ||
        storedUser._id ||
        storedUser.organization?._id;

      const token = localStorage.getItem("token");

      if (!bloodBankId) {
        toast.error("Blood bank ID not found. Please login again.");
        return;
      }

      if (!token) {
        toast.error("Session expired. Please login again.");
        return;
      }

      // Fetch requests list + stats in parallel
      let fetchedRequests = [];
      let fetchedDrives = [];

      try {
        const [requestsRes, statsRes] = await Promise.all([
          getBloodBankRequests(bloodBankId, { page: 1, limit: 200 }, token),
          getBloodBankRequestStats(bloodBankId, token),
        ]);

        const normalized = normalizeRequests(requestsRes.data?.data);
        fetchedRequests = normalized;
        setRequests(normalized);

        if (statsRes.data?.success) {
          const statsPayload = statsRes.data?.data || {};
          const totalRequestsCount =
            statsPayload.total ?? normalized.length;
          const pendingRequestsCount =
            statsPayload.byStatus?.PENDING ??
            normalized.filter((req) => req.status === "PENDING").length;
          const completedSuppliesCount =
            statsPayload.byStatus?.FULFILLED ??
            normalized.filter((req) => req.status === "COMPLETED").length;

          setStats((prev) => ({
            ...prev,
            totalRequests: totalRequestsCount,
            pendingRequests: pendingRequestsCount,
            completedSupplies: completedSuppliesCount,
          }));
        } else {
          setStats((prev) => ({
            ...prev,
            totalRequests: normalized.length,
            pendingRequests: normalized.filter((req) => req.status === "PENDING")
              .length,
            completedSupplies: normalized.filter(
              (req) => req.status === "COMPLETED"
            ).length,
          }));
        }
      } catch (error) {
        console.error("Error fetching blood requests:", error);
        toast.error("Failed to load requests");
      }

      try {
        const drivesRes = await getAllNgoDrives();
        if (drivesRes.data?.success && Array.isArray(drivesRes.data?.data)) {
          fetchedDrives = drivesRes.data.data;
          setNgoDrives(fetchedDrives);
        }
      } catch (error) {
        console.error("Error fetching drives:", error);
      }

      const upcomingDrivesCount = fetchedDrives.filter(
        (drive) => new Date(drive.driveDate) >= new Date()
      ).length;

      setStats((prev) => ({
        ...prev,
        upcomingNgoDrives: upcomingDrivesCount,
        verificationStatus: "VERIFIED",
      }));

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load some dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = useMemo(
    () => [
      {
        title: "Total Hospital Requests",
        value: stats.totalRequests,
        meta: `${requests.length} active on desk`,
        accent: "from-[#7c0d16] to-[#b71d24]",
      },
      {
        title: "Pending Requests",
        value: stats.pendingRequests,
        meta: `${requests.filter((r) => r.status === "PENDING").length} awaiting action`,
        accent: "from-[#d1661c] to-[#f2994a]",
      },
      {
        title: "Completed Supplies",
        value: stats.completedSupplies,
        meta: `${requests.filter((r) => r.status === "COMPLETED").length} completed`,
        accent: "from-[#2c8a49] to-[#5ec271]",
      },
      {
        title: "Upcoming NGO Drives",
        value: stats.upcomingNgoDrives,
        meta: `${
          ngoDrives.filter((drive) => new Date(drive.driveDate) >= new Date())
            .length
        } scheduled`,
        accent: "from-[#1e5aa8] to-[#6fb1ff]",
      },
      {
        title: "Verification Status",
        value: stats.verificationStatus,
        meta: "System Admin",
        accent: "from-[#d93f42] to-[#f08a8d]",
      },
    ],
    [stats, requests, ngoDrives]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff4d6d] mx-auto"></div>
          <p className="mt-4 text-[#7c4a5e]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
            Overview
          </p>
          <h3 className="text-3xl font-semibold text-[#31101e]">
            Mission Control
          </h3>
          <p className="text-sm text-[#7c4a5e]">
            Real-time intelligence synced with SEBN core.
          </p>
        </div>
        <div className="flex gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.action)}
              className="flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-semibold text-[#ff4d6d] shadow-[0_10px_25px_rgba(255,77,109,0.15)] hover:shadow-[0_15px_35px_rgba(255,77,109,0.25)] transition-all"
            >
              <span className="text-lg">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {dashboardCards.map((card) => (
          <article
            key={card.title}
            className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-[0_20px_50px_rgba(255,112,155,0.15)]"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-[#7c4a5e]">
              {card.title}
            </p>
            <h4
              className={`mt-4 bg-gradient-to-r ${card.accent} bg-clip-text text-4xl font-semibold text-transparent`}
            >
              {card.value}
            </h4>
            <p className="mt-2 text-sm text-[#7c4a5e]">{card.meta}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
