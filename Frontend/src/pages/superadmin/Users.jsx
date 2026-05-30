import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  Users,
  ShieldCheck,
  Stethoscope,
  Briefcase,
  Activity,
  Eye,
  Edit2,
  Trash2,
  Ban,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Mail,
  Phone,
  Hash,
  UserCog,
  RefreshCw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Loader2,
  UserPlus,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_BASE = "http://localhost:5000";

const ENDPOINTS = {
  users: "/api/superadmin/users",
  userDetails: (id) => `/api/superadmin/users/${id}`,
  createUser: "/api/superadmin/users",
  updateUser: (id) => `/api/superadmin/users/${id}`,
  updateUserStatus: (id) => `/api/superadmin/users/${id}/status`,
  deleteUser: (id) => `/api/superadmin/users/${id}`,
};

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "ADMIN", label: "Admin" },
  { value: "STAFF", label: "Staff" },
  { value: "DOCTOR", label: "Doctor" },
  { value: "HOSPITAL", label: "Hospital" },
  { value: "BLOODBANK", label: "Blood Bank" },
  { value: "NGO", label: "NGO" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
];

const safeArray = (value) => (Array.isArray(value) ? value : []);

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

const normalizeRoleLabel = (value) => {
  const v = String(value || "").toUpperCase();
  if (v === "ADMIN") return "Admin";
  if (v === "STAFF") return "Staff";
  if (v === "DOCTOR") return "Doctor";
  if (v === "HOSPITAL") return "Hospital";
  if (v === "BLOODBANK") return "Blood Bank";
  if (v === "NGO") return "NGO";
  return value || "User";
};

const normalizeStatusLabel = (value) => {
  const v = String(value || "").toUpperCase();
  if (v === "ACTIVE") return "Active";
  if (v === "INACTIVE") return "Inactive";
  if (v === "SUSPENDED") return "Suspended";
  return value || "Unknown";
};

const getStatusStyle = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "ACTIVE":
      return "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";
    case "INACTIVE":
      return "bg-slate-500/10 border-slate-500/20 text-slate-300";
    case "SUSPENDED":
      return "bg-rose-500/10 border-rose-500/20 text-rose-300";
    default:
      return "bg-slate-500/10 border-slate-500/20 text-slate-300";
  }
};

const roleMeta = {
  ADMIN: {
    icon: ShieldCheck,
    accent: "text-amber-300",
  },
  STAFF: {
    icon: Briefcase,
    accent: "text-cyan-300",
  },
  DOCTOR: {
    icon: Stethoscope,
    accent: "text-emerald-300",
  },
  HOSPITAL: {
    icon: Briefcase,
    accent: "text-blue-300",
  },
  BLOODBANK: {
    icon: Activity,
    accent: "text-rose-300",
  },
  NGO: {
    icon: Users,
    accent: "text-violet-300",
  },
};

export default function UsersPage() {
  const navigate = useNavigate();
  const auth = useAuth() || {};
  const token = auth.token || localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "ADMIN",
    status: "ACTIVE",
    organizationName: "",
    organizationCode: "",
  });

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

  const loadUsers = async (signal) => {
    setError("");
    try {
      const res = await api.get(ENDPOINTS.users, {
        params: {
          page,
          limit,
          role: roleFilter === "all" ? undefined : roleFilter,
          status: statusFilter === "all" ? undefined : statusFilter,
          search: search.trim() || undefined,
        },
        signal,
      });

      const payload = res.data?.data || res.data || {};
      const items = safeArray(
        payload.items || payload.users || payload.data || payload,
      );

      setUsers(items);
      setTotalPages(payload.totalPages || payload.pagination?.totalPages || 1);
      setTotalItems(
        payload.totalItems || payload.pagination?.totalItems || items.length,
      );
    } catch (err) {
      if (err.name === "CanceledError") return;
      console.error("Failed to load users:", err);
      setUsers([]);
      setTotalPages(1);
      setTotalItems(0);
      setError(
        err.response?.data?.message ||
          "Failed to load users. Check the backend route names if needed.",
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
      loadUsers(controller.signal);
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, roleFilter, statusFilter, search, token]);

  const handleRefresh = () => {
    setRefreshing(true);
    const controller = new AbortController();
    loadUsers(controller.signal);
  };

  const openDetails = async (user) => {
    setSelectedUser(user);
    setSelectedDetails(user || null);

    const id = user?._id || user?.id;
    if (!id) return;

    setDetailsLoading(true);
    try {
      const res = await api.get(ENDPOINTS.userDetails(id));
      const payload = res.data?.data || res.data || {};
      setSelectedDetails(payload.user || payload.data || payload || user);
    } catch (err) {
      console.error("Failed to load user details:", err);
      toast.error(err.response?.data?.message || "Failed to load user details");
      setSelectedDetails(user);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedUser(null);
    setSelectedDetails(null);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "ADMIN",
      status: "ACTIVE",
      organizationName: "",
      organizationCode: "",
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      password: "",
      role: user?.role || "ADMIN",
      status: user?.status || "ACTIVE",
      organizationName: user?.organizationName || "",
      organizationCode: user?.organizationCode || "",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setDeleteConfirmText("");
    setShowDeleteModal(true);
  };

  const openStatusModal = (user) => {
    setSelectedUser(user);
    setFormData((prev) => ({
      ...prev,
      status: user?.status || "ACTIVE",
    }));
    setShowStatusModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return toast.error("Name is required");
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!formData.password.trim()) return toast.error("Password is required");

    setProcessing(true);
    try {
      const res = await api.post(ENDPOINTS.createUser, formData);
      toast.success(res.data?.message || "User created successfully");
      setShowCreateModal(false);
      resetForm();
      await loadUsers();
    } catch (err) {
      console.error("Create user error:", err);
      toast.error(err.response?.data?.message || "Failed to create user");
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;

    const id = selectedUser._id || selectedUser.id;
    const payload = { ...formData };
    if (!payload.password.trim()) delete payload.password;

    setProcessing(true);
    try {
      const res = await api.put(ENDPOINTS.updateUser(id), payload);
      toast.success(res.data?.message || "User updated successfully");
      setShowEditModal(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (err) {
      console.error("Update user error:", err);
      toast.error(err.response?.data?.message || "Failed to update user");
    } finally {
      setProcessing(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedUser) return;

    const id = selectedUser._id || selectedUser.id;
    setProcessing(true);
    try {
      const res = await api.patch(ENDPOINTS.updateUserStatus(id), {
        status: formData.status,
      });
      toast.success(res.data?.message || "User status updated successfully");
      setShowStatusModal(false);
      setSelectedUser(null);
      await loadUsers();
      if (selectedDetails?._id === id || selectedDetails?.id === id) {
        setSelectedDetails((prev) =>
          prev ? { ...prev, status: formData.status } : prev,
        );
      }
    } catch (err) {
      console.error("Status update error:", err);
      toast.error(
        err.response?.data?.message || "Failed to update user status",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    const id = selectedUser._id || selectedUser.id;
    const userName = selectedUser.name || "user";

    if (
      deleteConfirmText.trim().toLowerCase() !== userName.trim().toLowerCase()
    ) {
      toast.error(`Type "${userName}" to confirm deletion`);
      return;
    }

    setProcessing(true);
    try {
      const res = await api.delete(ENDPOINTS.deleteUser(id));
      toast.success(res.data?.message || "User deleted successfully");
      setShowDeleteModal(false);
      setSelectedUser(null);
      setDeleteConfirmText("");
      await loadUsers();

      if (selectedDetails?._id === id || selectedDetails?.id === id) {
        setSelectedDetails(null);
      }
    } catch (err) {
      console.error("Delete user error:", err);
      toast.error(err.response?.data?.message || "Failed to delete user");
    } finally {
      setProcessing(false);
    }
  };

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const admins = users.filter(
      (u) => String(u.role || "").toUpperCase() === "ADMIN",
    ).length;
    const doctors = users.filter(
      (u) => String(u.role || "").toUpperCase() === "DOCTOR",
    ).length;
    const staff = users.filter(
      (u) => String(u.role || "").toUpperCase() === "STAFF",
    ).length;
    const active = users.filter(
      (u) => String(u.status || "").toUpperCase() === "ACTIVE",
    ).length;

    return { totalUsers, admins, doctors, staff, active };
  }, [users]);

  return (
    <div className="min-h-screen overflow-hidden bg-[#050816] text-white relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 h-[420px] w-[420px] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute top-24 right-0 h-[420px] w-[420px] rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-violet-400">
                  Superadmin Users
                </p>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  Users Management
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
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.02]"
                >
                  <UserPlus className="h-4 w-4" />
                  Create User
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 lg:p-10">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute left-0 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
                  <Sparkles className="h-4 w-4" />
                  Manage platform users, permissions, and access
                </div>

                <h2 className="mt-6 text-4xl sm:text-5xl font-black leading-tight text-white">
                  Search, filter, edit, suspend, and delete users securely
                </h2>

                <p className="mt-4 max-w-3xl text-gray-400 leading-relaxed">
                  Use this control panel to manage doctors, staff, admins, and
                  other platform users with a structured workflow and safe
                  action handling.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatBox
                  label="Total users"
                  value={loading ? "..." : stats.totalUsers}
                  color="text-violet-300"
                />
                <StatBox
                  label="Admins"
                  value={loading ? "..." : stats.admins}
                  color="text-amber-300"
                />
                <StatBox
                  label="Doctors"
                  value={loading ? "..." : stats.doctors}
                  color="text-emerald-300"
                />
                <StatBox
                  label="Active"
                  value={loading ? "..." : stats.active}
                  color="text-cyan-300"
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="mt-6 rounded-[28px] border border-amber-500/20 bg-amber-500/10 p-4 text-amber-200">
              {error}
            </div>
          )}

          <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search name, email, phone, organization..."
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/40 py-4 pl-12 pr-5 text-white placeholder:text-gray-500 outline-none transition focus:border-violet-500 focus:bg-white/10"
                  />
                </div>

                <div className="relative">
                  <Filter className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <select
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/40 py-4 pl-12 pr-12 text-white outline-none transition focus:border-violet-500 focus:bg-white/10"
                  >
                    {ROLE_OPTIONS.map((opt) => (
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

                <div className="relative">
                  <Filter className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/40 py-4 pl-12 pr-12 text-white outline-none transition focus:border-violet-500 focus:bg-white/10"
                  >
                    {STATUS_OPTIONS.map((opt) => (
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
                  {ROLE_OPTIONS.find((o) => o.value === roleFilter)?.label ||
                    "All Roles"}{" "}
                  •{" "}
                  {STATUS_OPTIONS.find((o) => o.value === statusFilter)
                    ?.label || "All Status"}
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

          <section className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-cyan-400">
                    Platform users
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    All users list
                  </h3>
                </div>

                <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-gray-300">
                  <Users className="h-4 w-4 text-cyan-300" />
                  {loading ? "Loading..." : `${totalItems} results`}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {loading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
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
                        <div className="h-10 w-32 rounded-2xl bg-white/10" />
                      </div>
                    </div>
                  ))
                ) : users.length > 0 ? (
                  users.map((user) => {
                    const id = user._id || user.id;
                    const isActive =
                      selectedUser &&
                      (selectedUser._id || selectedUser.id) === id;

                    const role = String(user.role || "").toUpperCase();
                    const meta = roleMeta[role] || {
                      icon: Users,
                      accent: "text-gray-300",
                    };
                    const RoleIcon = meta.icon;

                    return (
                      <div
                        key={id}
                        className={`rounded-[26px] border p-5 transition cursor-pointer ${
                          isActive
                            ? "border-violet-500/40 bg-violet-500/10"
                            : "border-white/10 bg-slate-950/40 hover:border-white/20"
                        }`}
                        onClick={() => openDetails(user)}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                              <RoleIcon className={`h-6 w-6 ${meta.accent}`} />
                            </div>

                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-3">
                                <h4 className="text-lg font-bold text-white">
                                  {user.name || "User"}
                                </h4>
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                                  {normalizeRoleLabel(role)}
                                </span>
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs ${getStatusStyle(user.status)}`}
                                >
                                  {normalizeStatusLabel(user.status)}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-400">
                                <span className="inline-flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  {user.email || "-"}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  {user.phone || "-"}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                  <Hash className="h-4 w-4" />
                                  {user.organizationCode || "-"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetails(user);
                              }}
                              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(user);
                              }}
                              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
                            >
                              <Edit2 className="h-4 w-4" />
                              Edit
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openStatusModal(user);
                              }}
                              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
                            >
                              <Ban className="h-4 w-4" />
                              Status
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(user);
                              }}
                              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-10 text-center">
                    <Users className="mx-auto h-12 w-12 text-gray-500" />
                    <h4 className="mt-4 text-xl font-bold text-white">
                      No users found
                    </h4>
                    <p className="mt-2 text-gray-400">
                      Try changing the search, role filter, or status filter.
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
                              ? "border-violet-500/30 bg-violet-500/15 text-violet-300"
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
                    User profile
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    {selectedDetails ? "Details" : "Select a user"}
                  </h3>
                </div>

                {selectedUser && (
                  <button
                    onClick={closeDetails}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3 text-gray-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="mt-6">
                {!selectedUser ? (
                  <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-8 text-center">
                    <Users className="mx-auto h-12 w-12 text-gray-500" />
                    <p className="mt-4 text-gray-400">
                      Click a user to inspect profile details.
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
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15">
                          <UserCog className="h-7 w-7 text-violet-300" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-white">
                            {selectedDetails?.name || "User"}
                          </h4>
                          <p className="mt-1 text-sm text-gray-400">
                            {normalizeRoleLabel(selectedDetails?.role)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <InfoRow
                        icon={Mail}
                        label="Email"
                        value={selectedDetails?.email || "-"}
                      />
                      <InfoRow
                        icon={Phone}
                        label="Phone"
                        value={selectedDetails?.phone || "-"}
                      />
                      <InfoRow
                        icon={Hash}
                        label="Organization Code"
                        value={selectedDetails?.organizationCode || "-"}
                      />
                      <InfoRow
                        icon={Briefcase}
                        label="Organization"
                        value={selectedDetails?.organizationName || "-"}
                      />
                      <InfoRow
                        icon={KeyRound}
                        label="Role"
                        value={normalizeRoleLabel(selectedDetails?.role)}
                      />
                      <InfoRow
                        icon={CheckCircle2}
                        label="Status"
                        value={normalizeStatusLabel(selectedDetails?.status)}
                        highlight
                      />
                      <InfoRow
                        icon={CalendarDays}
                        label="Last Login"
                        value={formatDateTime(selectedDetails?.lastLogin)}
                      />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                      <p className="text-sm uppercase tracking-[0.2em] text-gray-400">
                        Notes
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-gray-300">
                        Use Edit to update profile information, Status to
                        activate or suspend access, and Delete for permanent
                        removal.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </section>
        </main>
      </div>

      {showCreateModal && (
        <UserFormModal
          title="Create user"
          description="Add a new user to the platform."
          formData={formData}
          handleChange={handleChange}
          onClose={() => {
            if (processing) return;
            setShowCreateModal(false);
            resetForm();
          }}
          onConfirm={handleCreate}
          confirmLabel={processing ? "Creating..." : "Create"}
          accent="from-violet-500 via-fuchsia-500 to-pink-500"
          loading={processing}
          mode="create"
        />
      )}

      {showEditModal && (
        <UserFormModal
          title="Edit user"
          description="Update the selected user profile."
          formData={formData}
          handleChange={handleChange}
          onClose={() => {
            if (processing) return;
            setShowEditModal(false);
            setSelectedUser(null);
            resetForm();
          }}
          onConfirm={handleEdit}
          confirmLabel={processing ? "Saving..." : "Save changes"}
          accent="from-cyan-500 to-blue-500"
          loading={processing}
          mode="edit"
        />
      )}

      {showStatusModal && (
        <StatusModal
          title="Update user status"
          description="Change the access state for this user."
          formData={formData}
          handleChange={handleChange}
          onClose={() => {
            if (processing) return;
            setShowStatusModal(false);
            setSelectedUser(null);
          }}
          onConfirm={handleStatusUpdate}
          confirmLabel={processing ? "Updating..." : "Update status"}
          accent="from-amber-500 to-orange-500"
          loading={processing}
        />
      )}

      {showDeleteModal && selectedUser && (
        <DeleteModal
          title="Delete user"
          description={`This will permanently delete ${selectedUser.name || "this user"} from the platform.`}
          confirmText={deleteConfirmText}
          setConfirmText={setDeleteConfirmText}
          targetName={selectedUser.name || ""}
          onClose={() => {
            if (processing) return;
            setShowDeleteModal(false);
            setSelectedUser(null);
            setDeleteConfirmText("");
          }}
          onConfirm={handleDelete}
          loading={processing}
        />
      )}
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">Users</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, highlight = false }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-xl p-2 ${highlight ? "bg-violet-500/15" : "bg-white/10"}`}
        >
          <Icon
            className={`h-4 w-4 ${highlight ? "text-violet-300" : "text-gray-300"}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
            {label}
          </p>
          <p
            className={`mt-1 break-words text-sm font-semibold ${highlight ? "text-violet-300" : "text-white"}`}
          >
            {value || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

function UserFormModal({
  title,
  description,
  formData,
  handleChange,
  onClose,
  onConfirm,
  confirmLabel,
  accent,
  loading,
  mode = "create",
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#09111f] p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accent}`}
          >
            {mode === "create" ? (
              <UserPlus className="h-7 w-7 text-white" />
            ) : (
              <Edit2 className="h-7 w-7 text-white" />
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-2xl font-black text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              {description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter full name"
          />
          <Field
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="user@example.com"
          />
          <Field
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="10 digit phone"
          />
          <Field
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            as="select"
            options={[
              "ADMIN",
              "STAFF",
              "DOCTOR",
              "HOSPITAL",
              "BLOODBANK",
              "NGO",
            ]}
          />
          <Field
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            as="select"
            options={["ACTIVE", "INACTIVE", "SUSPENDED"]}
          />
          <Field
            label="Organization Code"
            name="organizationCode"
            value={formData.organizationCode}
            onChange={handleChange}
            placeholder="ORG-001"
          />
          <Field
            label="Organization Name"
            name="organizationName"
            value={formData.organizationName}
            onChange={handleChange}
            placeholder="Organization name"
            className="md:col-span-2"
          />
          {mode === "create" && (
            <Field
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create password"
              type="password"
              className="md:col-span-2"
            />
          )}
          {mode === "edit" && (
            <div className="md:col-span-2 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                Password
              </p>
              <p className="mt-2 text-sm text-gray-300">
                Leave empty to keep the existing password unchanged.
              </p>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="New password (optional)"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-500 outline-none transition focus:border-violet-500 focus:bg-white/10"
              />
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-semibold text-white transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-2xl bg-gradient-to-r ${accent} px-5 py-4 font-bold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusModal({
  title,
  description,
  formData,
  handleChange,
  onClose,
  onConfirm,
  confirmLabel,
  accent,
  loading,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-[#09111f] p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accent}`}
          >
            <Ban className="h-7 w-7 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="text-2xl font-black text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              {description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-gray-300">
            New Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none transition focus:border-amber-500 focus:bg-white/10"
          >
            <option value="ACTIVE" className="bg-slate-950">
              ACTIVE
            </option>
            <option value="INACTIVE" className="bg-slate-950">
              INACTIVE
            </option>
            <option value="SUSPENDED" className="bg-slate-950">
              SUSPENDED
            </option>
          </select>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-semibold text-white transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-2xl bg-gradient-to-r ${accent} px-5 py-4 font-bold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  title,
  description,
  confirmText,
  setConfirmText,
  targetName,
  onClose,
  onConfirm,
  loading,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-[#09111f] p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-500">
            <Trash2 className="h-7 w-7 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="text-2xl font-black text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              {description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
          Type <strong>{targetName}</strong> to confirm permanent deletion.
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Confirmation text
          </label>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={targetName}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-gray-500 outline-none transition focus:border-rose-500 focus:bg-white/10"
          />
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-semibold text-white transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 px-5 py-4 font-bold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
