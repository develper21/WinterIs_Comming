import { useState } from "react";
import { checkRegistrationStatus } from "../services/organizationApi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Building2,
  Search,
  Copy,
  ArrowRight,
  CheckCircle2,
  Clock3,
  XCircle,
  CalendarDays,
  Hash,
  ShieldCheck,
  Sparkles,
  FileSearch,
  RefreshCcw,
  Mail,
} from "lucide-react";

export default function RegistrationStatus() {
  const navigate = useNavigate();
  const [organizationCode, setOrganizationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState(null);
  const [error, setError] = useState("");

  const handleCheckStatus = async (e) => {
    e.preventDefault();

    if (!organizationCode.trim()) {
      setError("Organization code is required");
      return;
    }

    setLoading(true);
    setError("");
    setStatusData(null);

    try {
      const res = await checkRegistrationStatus(organizationCode);

      if (res.data.success) {
        setStatusData(res.data.data);
        toast.success("Status retrieved!");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to check status";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";
      case "PENDING":
        return "bg-amber-500/10 border-amber-500/20 text-amber-300";
      case "REJECTED":
        return "bg-rose-500/10 border-rose-500/20 text-rose-300";
      default:
        return "bg-slate-500/10 border-slate-500/20 text-slate-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle2 className="h-12 w-12 text-emerald-300" />;
      case "PENDING":
        return <Clock3 className="h-12 w-12 text-amber-300" />;
      case "REJECTED":
        return <XCircle className="h-12 w-12 text-rose-300" />;
      default:
        return <ShieldCheck className="h-12 w-12 text-slate-300" />;
    }
  };

  const statusLabel =
    statusData?.status === "APPROVED"
      ? "Approved"
      : statusData?.status === "PENDING"
        ? "Pending Review"
        : statusData?.status === "REJECTED"
          ? "Rejected"
          : "Unknown";

  return (
    <div className="min-h-screen overflow-hidden bg-[#031014] text-white relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 h-[420px] w-[420px] rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute top-24 right-0 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-3 group"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-2xl" />
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                </div>

                <div className="text-left leading-tight">
                  <span className="block text-lg sm:text-xl font-extrabold tracking-tight text-white">
                    BloodBridge
                  </span>
                  <span className="block text-xs sm:text-sm text-gray-400">
                    Registration status portal
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigate("/organization")}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                Organization Portal
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <section className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
            {/* Left panel */}
            <div className="rounded-[36px] border border-white/10 bg-white/5 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
                <Sparkles className="h-4 w-4" />
                Track your organization in real time
              </div>

              <h1 className="mt-6 text-4xl sm:text-5xl font-black leading-tight text-white">
                Check registration status
              </h1>

              <p className="mt-4 max-w-2xl text-lg text-gray-400 leading-relaxed">
                Enter your organization code to see whether your application is
                approved, pending, or rejected. The portal shows the code,
                registration date, and the next action clearly.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="text-xs text-gray-400">Status</div>
                  <div className="mt-2 font-semibold text-white">
                    Live verification
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="text-xs text-gray-400">Time</div>
                  <div className="mt-2 font-semibold text-white">
                    24–48 hour review
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="text-xs text-gray-400">Access</div>
                  <div className="mt-2 font-semibold text-white">
                    Approval based
                  </div>
                </div>
              </div>

              <div className="mt-10 space-y-4">
                <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15">
                    <Hash className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Find your code</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Use the organization code you received after registration.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15">
                    <Clock3 className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Check progress</p>
                    <p className="mt-1 text-sm text-gray-400">
                      See whether your registration is still pending review or
                      already approved.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/15">
                    <ShieldCheck className="h-5 w-5 text-teal-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Proceed safely</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Approved organizations can move straight to the login
                      page.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form panel */}
            <div className="rounded-[36px] border border-white/10 bg-white/5 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl">
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Status lookup</p>
                    <h2 className="mt-2 text-3xl font-black text-white">
                      Organization Code
                    </h2>
                  </div>

                  <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15">
                    <FileSearch className="h-7 w-7 text-emerald-300" />
                  </div>
                </div>
              </div>

              <form onSubmit={handleCheckStatus} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Organization Code
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={organizationCode}
                      onChange={(e) => {
                        setOrganizationCode(e.target.value);
                        setError("");
                      }}
                      placeholder="e.g. HOSP-DEL-001"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-5 text-white placeholder:text-gray-500 outline-none transition focus:border-emerald-500 focus:bg-white/10"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    The code was given during registration.
                  </p>
                </div>

                {error && (
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
                    <p className="text-sm font-medium text-rose-200">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-4 font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Checking...
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2">
                      Check Status
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-8 rounded-[28px] border border-white/10 bg-slate-950/40 p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                    <Mail className="h-4 w-4 text-gray-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Need your code?</p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-400">
                      Check the confirmation email or the registration success
                      screen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {statusData && (
            <section className="mt-8 grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
              {/* Status result */}
              <div className="rounded-[36px] border border-white/10 bg-white/5 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                      {getStatusIcon(statusData.status)}
                    </div>

                    <div>
                      <h2 className="text-3xl font-black text-white">
                        {statusData.name}
                      </h2>
                      <p className="mt-1 text-gray-400">
                        Registration status overview
                      </p>
                    </div>
                  </div>

                  <p
                    className={`inline-flex items-center rounded-full border px-5 py-2 text-sm font-semibold ${getStatusColor(
                      statusData.status,
                    )}`}
                  >
                    {statusLabel}
                  </p>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Organization Code
                    </p>
                    <p className="mt-2 break-all font-mono text-lg font-bold text-white">
                      {statusData.organizationCode}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Registration Date
                    </p>
                    <p className="mt-2 text-lg font-bold text-white">
                      {new Date(
                        statusData.registrationDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  {statusData.approvalDate && (
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 sm:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Approval Date
                      </p>
                      <p className="mt-2 text-lg font-bold text-emerald-300">
                        {new Date(statusData.approvalDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                <div
                  className={`mt-8 rounded-[28px] border p-6 ${getStatusColor(
                    statusData.status,
                  )}`}
                >
                  {statusData.status === "APPROVED" && (
                    <>
                      <h3 className="text-lg font-black text-emerald-200">
                        Your registration has been approved
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-emerald-100/90">
                        Your organization is active and ready for login. Use the
                        admin credentials you created during registration.
                      </p>
                    </>
                  )}

                  {statusData.status === "PENDING" && (
                    <>
                      <h3 className="text-lg font-black text-amber-200">
                        Your registration is pending review
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-amber-100/90">
                        The superadmin team is reviewing your application. This
                        usually takes 24–48 hours.
                      </p>
                    </>
                  )}

                  {statusData.status === "REJECTED" && (
                    <>
                      <h3 className="text-lg font-black text-rose-200">
                        Your registration has been rejected
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-rose-100/90">
                        Please contact the superadmin team for more information
                        and next steps.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Actions panel */}
              <div className="rounded-[36px] border border-white/10 bg-white/5 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl">
                <h3 className="text-3xl font-black text-white">Next actions</h3>
                <p className="mt-3 text-gray-400 leading-relaxed">
                  Quick actions based on your current registration status.
                </p>

                <div className="mt-8 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                        <Copy className="h-4 w-4 text-gray-300" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          Copy organization code
                        </p>
                        <p className="mt-1 text-sm text-gray-400">
                          Keep the code safe for future login and support.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          statusData.organizationCode,
                        );
                        toast.success("Organization code copied!");
                      }}
                      className="mt-5 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
                    >
                      Copy Code
                    </button>
                  </div>

                  {statusData.status === "APPROVED" && (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                      <p className="font-semibold text-emerald-200">
                        Approved organizations can log in now
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-emerald-100/90">
                        Go to the login page and access your dashboard using
                        your admin credentials.
                      </p>

                      <button
                        onClick={() => navigate("/login")}
                        className="mt-5 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 font-bold text-white transition hover:scale-[1.02]"
                      >
                        Go to Login
                      </button>
                    </div>
                  )}

                  {statusData.status === "PENDING" && (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
                      <p className="font-semibold text-amber-200">
                        Still waiting for review
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-amber-100/90">
                        Check back later or refresh this page to see updates
                        from the superadmin team.
                      </p>
                    </div>
                  )}

                  {statusData.status === "REJECTED" && (
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5">
                      <p className="font-semibold text-rose-200">
                        Need help with rejection?
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-rose-100/90">
                        Contact the superadmin team for clarification or
                        resubmission steps.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setOrganizationCode("");
                      setStatusData(null);
                      setError("");
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-semibold text-white transition hover:bg-white/10"
                  >
                    Check Another Code
                  </button>
                </div>
              </div>
            </section>
          )}

          {!statusData && (
            <section className="mt-8 rounded-[36px] border border-white/10 bg-white/5 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                  <RefreshCcw className="h-5 w-5 text-gray-300" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Need help?</h3>
                  <p className="mt-1 text-gray-400">
                    A few quick notes before you check the status.
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                  <p className="font-semibold text-white">
                    Where to find the code
                  </p>
                  <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                    The code was shown after registration and can also be found
                    in the confirmation details.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                  <p className="font-semibold text-white">Review timeline</p>
                  <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                    Applications are typically reviewed within 24–48 hours.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                  <p className="font-semibold text-white">Approved next step</p>
                  <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                    Once approved, use the login page with your organization
                    code and admin credentials.
                  </p>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
