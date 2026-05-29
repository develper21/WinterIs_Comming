import { useNavigate } from "react-router-dom";
import {
  Building2,
  ClipboardCheck,
  ShieldCheck,
  Crown,
  ArrowRight,
  Sparkles,
  BadgeCheck,
  LockKeyhole,
  Clock3,
} from "lucide-react";

export default function OrganizationPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-hidden bg-[#050816] text-white relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute top-24 right-0 h-[420px] w-[420px] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
              {/* Logo */}
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-3 group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/30 blur-2xl rounded-full"></div>

                  <img
                    src="./public/favicon_io/favicon.ico"
                    alt="BloodBridge"
                    className="relative w-11 h-11 object-contain drop-shadow-[0_0_15px_rgba(255,0,0,0.8)] transition-all duration-300 hover:scale-110"
                  />
                </div>

                <div className="leading-tight text-left">
                  <span className="block text-xl sm:text-2xl font-extrabold tracking-wide text-white">
                    BloodBridge
                  </span>
                  <span className="block text-xs sm:text-sm text-gray-400">
                    Connect. Donate. Save lives.
                  </span>
                </div>
              </button>

              {/* Actions */}
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => navigate("/login")}
                  className="rounded-full px-5 py-2.5 text-sm font-medium text-gray-300 transition-all duration-300 hover:bg-white/10 hover:text-white"
                >
                  Login
                </button>

                <button
                  onClick={() => navigate("/organization")}
                  className="rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 px-5 sm:px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-all duration-300 hover:scale-[1.03] hover:shadow-red-500/40"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-500/20 blur-3xl rounded-full"></div>

          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/20 blur-3xl rounded-full"></div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* LEFT */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-5 py-2 text-sm text-red-300 backdrop-blur-xl mb-8">
                  <Sparkles className="h-4 w-4" />
                  Trusted Healthcare Infrastructure
                </div>

                <h1 className="text-5xl sm:text-6xl xl:text-7xl font-black leading-[0.95]">
                  <span className="text-white">Healthcare</span>

                  <br />

                  <span className="bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                    Organization
                  </span>

                  <br />

                  <span className="text-white">Portal</span>
                </h1>

                <p className="mt-8 text-lg sm:text-xl leading-relaxed text-gray-400 max-w-2xl">
                  Register hospitals, NGOs, and blood banks into one intelligent
                  healthcare ecosystem designed for verification, coordination,
                  and emergency response management.
                </p>

                {/* Buttons */}
                <div className="mt-10 flex flex-wrap gap-5">
                  <button
                    onClick={() => navigate("/organization-registration")}
                    className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 px-8 py-5 text-lg font-bold text-white shadow-2xl shadow-red-500/20 transition-all duration-300 hover:scale-[1.03]"
                  >
                    Start Registration
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>

                  <button
                    onClick={() => navigate("/login")}
                    className="rounded-2xl border border-white/10 bg-white/5 px-8 py-5 text-lg font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:bg-white/10"
                  >
                    Organization Login
                  </button>
                </div>

                {/* Stats */}
                <div className="mt-14 grid grid-cols-3 gap-5 max-w-xl">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                    <div className="text-3xl font-black text-white">1K+</div>

                    <div className="mt-2 text-sm text-gray-400">
                      Organizations
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                    <div className="text-3xl font-black text-white">24/7</div>

                    <div className="mt-2 text-sm text-gray-400">Operations</div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                    <div className="text-3xl font-black text-white">Secure</div>

                    <div className="mt-2 text-sm text-gray-400">Access</div>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE PANEL */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-purple-500/20 blur-3xl rounded-[40px]"></div>

                <div className="relative rounded-[36px] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 overflow-hidden">
                  {/* top */}
                  <div className="flex items-center justify-between pb-6 border-b border-white/10">
                    <div>
                      <div className="text-xl font-bold text-white">
                        Organization Dashboard
                      </div>

                      <div className="text-sm text-gray-400 mt-1">
                        Real-time coordination system
                      </div>
                    </div>

                    <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse"></div>
                  </div>

                  {/* cards */}
                  <div className="mt-8 space-y-5">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20">
                          <Building2 className="h-6 w-6 text-red-300" />
                        </div>

                        <div>
                          <div className="font-semibold text-white">
                            Registration Approved
                          </div>

                          <div className="text-sm text-gray-400">
                            Blood Bank Organization
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
                          <ShieldCheck className="h-6 w-6 text-green-300" />
                        </div>

                        <div>
                          <div className="font-semibold text-white">
                            Secure Access Enabled
                          </div>

                          <div className="text-sm text-gray-400">
                            Organization dashboard activated
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
                          <ClipboardCheck className="h-6 w-6 text-purple-300" />
                        </div>

                        <div>
                          <div className="font-semibold text-white">
                            Verification In Progress
                          </div>

                          <div className="text-sm text-gray-400">
                            Compliance review processing
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* REGISTER */}
            <div className="group rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 transition-all duration-500 hover:-translate-y-2 hover:border-red-500/20">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 mb-8">
                <Building2 className="h-8 w-8 text-red-300" />
              </div>

              <h3 className="text-3xl font-black text-white">Register</h3>

              <p className="mt-4 text-gray-400 leading-relaxed">
                Submit organization credentials and onboarding details.
              </p>

              <button
                onClick={() => navigate("/organization-registration")}
                className="mt-8 w-full rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 py-4 font-semibold text-white"
              >
                Start Registration
              </button>
            </div>

            {/* STATUS */}
            <div className="group rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 transition-all duration-500 hover:-translate-y-2 hover:border-purple-500/20">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/15 mb-8">
                <ClipboardCheck className="h-8 w-8 text-purple-300" />
              </div>

              <h3 className="text-3xl font-black text-white">Track Status</h3>

              <p className="mt-4 text-gray-400 leading-relaxed">
                Monitor organization approval and verification progress.
              </p>

              <button
                onClick={() => navigate("/registration-status")}
                className="mt-8 w-full rounded-2xl border border-purple-500/20 bg-purple-500/10 py-4 font-semibold text-purple-300"
              >
                Check Status
              </button>
            </div>

            {/* LOGIN */}
            <div className="group rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 transition-all duration-500 hover:-translate-y-2 hover:border-green-500/20">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/15 mb-8">
                <ShieldCheck className="h-8 w-8 text-green-300" />
              </div>

              <h3 className="text-3xl font-black text-white">Login</h3>

              <p className="mt-4 text-gray-400 leading-relaxed">
                Access operational dashboards and donor management tools.
              </p>

              <button
                onClick={() => navigate("/login")}
                className="mt-8 w-full rounded-2xl border border-green-500/20 bg-green-500/10 py-4 font-semibold text-green-300"
              >
                Organization Login
              </button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
          <div className="rounded-[36px] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 sm:p-12 overflow-hidden">
            {/* Heading */}
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-300 mb-6">
                <Sparkles className="h-4 w-4" />
                Guided onboarding roadmap
              </div>

              <h2 className="text-4xl sm:text-5xl font-black text-white">
                From registration to secure access
              </h2>

              <p className="mt-4 text-lg text-gray-400 leading-relaxed">
                A clear workflow that shows exactly how an organization moves
                through registration, verification, and dashboard access.
              </p>
            </div>

            {/* Roadmap */}
            <div className="relative mt-16">
              {/* Desktop connector */}
              <div className="grid gap-6 lg:grid-cols-3 relative z-10">
                {/* Step 1 */}
                <div className="relative rounded-[30px] border border-white/10 bg-slate-950/40 p-8 backdrop-blur-xl">
                  <div className="absolute -top-5 left-8 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-sm font-bold text-white shadow-lg shadow-rose-500/30">
                    01
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 mb-6">
                    <BadgeCheck className="h-7 w-7 text-rose-300" />
                  </div>

                  <h3 className="text-2xl font-black text-white">Register</h3>

                  <p className="mt-4 text-gray-400 leading-relaxed">
                    Submit organization details, category, and required
                    credentials to begin onboarding.
                  </p>

                  <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-gray-300">
                      Best for: Hospitals, blood banks, and NGOs starting fresh.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative rounded-[30px] border border-white/10 bg-slate-950/40 p-8 backdrop-blur-xl">
                  <div className="absolute -top-5 left-8 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-pink-500/30">
                    02
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 mb-6">
                    <Clock3 className="h-7 w-7 text-violet-300" />
                  </div>

                  <h3 className="text-2xl font-black text-white">
                    Verification
                  </h3>

                  <p className="mt-4 text-gray-400 leading-relaxed">
                    Your application is reviewed for authenticity, compliance,
                    and organization validation.
                  </p>

                  <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-gray-300">
                      Status updates can be tracked anytime from the portal.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative rounded-[30px] border border-white/10 bg-slate-950/40 p-8 backdrop-blur-xl">
                  <div className="absolute -top-5 left-8 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-green-500 text-sm font-bold text-white shadow-lg shadow-violet-500/30">
                    03
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/15 mb-6">
                    <LockKeyhole className="h-7 w-7 text-green-300" />
                  </div>

                  <h3 className="text-2xl font-black text-white">Access</h3>

                  <p className="mt-4 text-gray-400 leading-relaxed">
                    Once approved, your team can log in and manage operations
                    from a secure dashboard.
                  </p>

                  <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-gray-300">
                      Ready for blood requests, donor coordination, and
                      inventory tools.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom summary */}
            <div className="mt-12 rounded-[28px] border border-white/10 bg-gradient-to-r from-white/5 to-white/10 p-6 sm:p-8">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/15">
                    <Building2 className="h-6 w-6 text-rose-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Fast onboarding</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Clear registration without confusion.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15">
                    <ClipboardCheck className="h-6 w-6 text-violet-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      Tracked verification
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      Know exactly where the approval stands.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/15">
                    <ShieldCheck className="h-6 w-6 text-green-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Secure access</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Move into the dashboard only after approval.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Superadmin Banner */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
          <div className="relative overflow-hidden rounded-[36px] border border-amber-500/10 bg-white/5 backdrop-blur-2xl">
            {/* Background glow */}
            <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
            <div className="absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl" />

            <div className="relative z-10 p-8 sm:p-10 lg:p-12">
              <div className="grid gap-10 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
                {/* Left side */}
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
                    <Crown className="h-4 w-4" />
                    Administrative control layer
                  </div>

                  <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                    Superadmin Control Center
                  </h2>

                  <p className="mt-4 max-w-2xl text-gray-300 leading-relaxed">
                    Manage approvals, review organizations, monitor onboarding
                    activity, and keep the BloodBridge network running with
                    secure administrative oversight.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                      <p className="text-sm font-semibold text-white">
                        Approval Queue
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Track pending requests
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                      <p className="text-sm font-semibold text-white">
                        Audit Logs
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Review secure actions
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                      <p className="text-sm font-semibold text-white">
                        Network Oversight
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Maintain platform trust
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right side */}
                <div className="rounded-[30px] border border-white/10 bg-slate-950/40 p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Admin access</p>
                      <p className="text-2xl font-bold text-white">
                        Restricted Area
                      </p>
                    </div>

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15">
                      <Crown className="h-7 w-7 text-amber-300" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-green-400" />
                      <div>
                        <p className="font-semibold text-white">
                          Verified dashboard entry
                        </p>
                        <p className="text-sm text-gray-400">
                          Access only for superadmin users
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <div>
                        <p className="font-semibold text-white">
                          Organization review tools
                        </p>
                        <p className="text-sm text-gray-400">
                          Approve, reject, or monitor registrations
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/superadmin-login")}
                    className="mt-8 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-7 py-4 font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/20"
                  >
                    Admin Access
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
