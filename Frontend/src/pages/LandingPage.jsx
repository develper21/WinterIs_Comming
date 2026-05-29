import { useNavigate } from "react-router-dom";
import {
  Activity,
  Database,
  ShieldCheck,
  BarChart3,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  // Add these arrays inside your component, above return()

  const platformHighlights = [
    {
      icon: <Activity />,
      title: "Real-Time Matching",
      description:
        "Connect urgent blood requests with nearby verified donors and institutions in minutes.",
    },
    {
      icon: <Database />,
      title: "Live Inventory Control",
      description:
        "Track blood stock, availability, and distribution flow from a single dashboard.",
    },
    {
      icon: <ShieldCheck />,
      title: "Verified Network",
      description:
        "Onboard hospitals, blood banks, NGOs, and donors through a trusted verification layer.",
    },
    {
      icon: <BarChart3 />,
      title: "Impact Analytics",
      description:
        "Measure response time, fulfilled requests, and operational performance at scale.",
    },
  ];

  const startupPillars = [
    {
      title: "Faster response",
      text: "Reduce delays in critical situations with intelligent request routing.",
    },
    {
      title: "Operational clarity",
      text: "Unify supply, demand, and donor activity in one clean system.",
    },
    {
      title: "Built to scale",
      text: "Designed for growing health-tech workflows and multi-organization collaboration.",
    },
  ];

  const journeySteps = [
    {
      step: "01",
      title: "Onboard your organization",
      description:
        "Create a verified profile for your hospital, blood bank, or NGO and set up your operating details.",
    },
    {
      step: "02",
      title: "Sync supply and demand",
      description:
        "Track inventory, request units, and connect the right stakeholders in real time.",
    },
    {
      step: "03",
      title: "Act on live alerts",
      description:
        "Receive instant updates for urgent cases, donation drives, and stock movement.",
    },
    {
      step: "04",
      title: "Scale with insights",
      description:
        "Use analytics to improve response time, donor engagement, and service coverage.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Navigation Header */}
        {/* Navigation Header */}
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

        {/* Hero Section */}
        <section className="min-h-[calc(100vh-80px)] flex items-center px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 mb-6">
                  <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
                  Healthcare startup platform for blood coordination
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-red-400 via-pink-400 to-rose-300 bg-clip-text text-transparent">
                    Build a faster
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    blood network
                  </span>
                </h1>

                <p className="mt-6 text-lg sm:text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  BloodBridge is a startup platform that helps hospitals, blood
                  banks, NGOs, and donors work together through one verified
                  system for requests, inventory, alerts, and life-saving
                  coordination.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button
                    onClick={() => navigate("/organization")}
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-pink-500 px-8 py-3.5 font-bold text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-red-500/40"
                  >
                    Launch Your Network
                  </button>
                  <button
                    onClick={() => navigate("/donor-registration")}
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 font-bold text-white transition-all duration-300 hover:bg-white/10"
                  >
                    Register as Donor
                  </button>
                </div>

                <div className="mt-10 grid grid-cols-3 gap-4 max-w-xl mx-auto lg:mx-0">
                  {[
                    { value: "24/7", label: "Live operations" },
                    { value: "1 Platform", label: "Unified workflow" },
                    { value: "Fast", label: "Critical response" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center backdrop-blur-md"
                    >
                      <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                        {item.value}
                      </div>
                      <div className="mt-2 text-xs sm:text-sm text-gray-400">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-red-500/20 via-pink-500/10 to-blue-500/20 blur-3xl" />
                <div className="relative rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
                  <div className="grid gap-4">
                    {platformHighlights.map((item, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 transition-transform duration-300 hover:-translate-y-1"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-pink-500 text-2xl">
                            {item.icon}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">
                              {item.title}
                            </h3>
                            <p className="mt-2 text-sm text-gray-400">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Startup Value Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-red-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                  Built for modern healthcare operations
                </span>
              </h2>
              <p className="mt-5 text-lg text-gray-300 max-w-3xl mx-auto">
                A startup-grade platform should be fast, reliable, and scalable.
                BloodBridge is designed to support critical workflows without
                making the experience heavy or complicated.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {startupPillars.map((item, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md transition-all duration-300 hover:border-pink-500/40 hover:bg-white/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-4 text-gray-400 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Simple flow. Faster action.
                </span>
              </h2>
              <p className="mt-5 text-lg text-gray-300">
                A clean operational journey that helps every stakeholder move
                faster with less friction.
              </p>
            </div>

            <div className="space-y-6">
              {journeySteps.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
                >
                  <div className="flex-shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 text-lg font-bold text-white shadow-lg shadow-red-500/20">
                      {item.step}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-gray-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto text-center rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/5 to-white/10 px-6 sm:px-10 py-14 backdrop-blur-xl shadow-2xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-red-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                Ready to scale life-saving operations?
              </span>
            </h2>

            <p className="mt-5 text-lg text-gray-300">
              Bring hospitals, blood banks, NGOs, and donors into one reliable
              startup platform built for speed, trust, and impact.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/organization")}
                className="rounded-xl bg-gradient-to-r from-red-500 to-pink-500 px-8 py-3.5 font-bold text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-red-500/40"
              >
                Start Now
              </button>
              <button
                onClick={() => navigate("/login")}
                className="rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 font-bold text-white transition-all duration-300 hover:bg-white/10"
              >
                Login to Dashboard
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative border-t border-white/10 bg-black/20 backdrop-blur-xl overflow-hidden">
          {/* Glow Effects */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-red-500/10 blur-3xl rounded-full"></div>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-500/10 blur-3xl rounded-full"></div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
            {/* Top Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 pb-14 border-b border-white/10">
              {/* Brand Section */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500/30 blur-xl rounded-full"></div>

                    <img
                      src="./public/favicon_io/favicon.ico"
                      alt="BloodBridge"
                      className="relative w-12 h-12 object-contain"
                    />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      BloodBridge
                    </h3>
                    <p className="text-sm text-gray-400">
                      Connect. Donate. Save lives.
                    </p>
                  </div>
                </div>

                <p className="text-gray-400 leading-relaxed mb-6 max-w-md">
                  BloodBridge is a healthcare startup platform helping
                  hospitals, blood banks, NGOs, and donors collaborate through a
                  smarter, faster, and more connected blood management
                  ecosystem.
                </p>

                {/* Newsletter */}
                <div>
                  <h4 className="text-white font-semibold mb-3">
                    Stay Updated
                  </h4>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-red-500"
                    />

                    <button className="rounded-xl bg-gradient-to-r from-red-500 to-pink-500 px-5 py-3 font-semibold text-white transition-all duration-300 hover:scale-[1.03]">
                      Subscribe
                    </button>
                  </div>
                </div>
              </div>

              {/* Platform */}
              <div>
                <h4 className="text-white font-semibold mb-5">Platform</h4>

                <ul className="space-y-3 text-gray-400">
                  <li>
                    <a
                      href="#"
                      className="hover:text-red-400 transition-colors"
                    >
                      Live Blood Requests
                    </a>
                  </li>

                  <li>
                    <a
                      href="#"
                      className="hover:text-red-400 transition-colors"
                    >
                      Donor Management
                    </a>
                  </li>

                  <li>
                    <a
                      href="#"
                      className="hover:text-red-400 transition-colors"
                    >
                      Blood Inventory
                    </a>
                  </li>

                  <li>
                    <a
                      href="#"
                      className="hover:text-red-400 transition-colors"
                    >
                      Emergency Alerts
                    </a>
                  </li>

                  <li>
                    <a
                      href="#"
                      className="hover:text-red-400 transition-colors"
                    >
                      Analytics Dashboard
                    </a>
                  </li>
                </ul>
              </div>

              {/* Solutions */}
              <div>
                <h4 className="text-white font-semibold mb-5">Solutions</h4>

                <ul className="space-y-3 text-gray-400">
                  <li>
                    <a
                      href="#"
                      className="hover:text-pink-400 transition-colors"
                    >
                      Hospitals
                    </a>
                  </li>

                  <li>
                    <a
                      href="#"
                      className="hover:text-pink-400 transition-colors"
                    >
                      Blood Banks
                    </a>
                  </li>

                  <li>
                    <a
                      href="#"
                      className="hover:text-pink-400 transition-colors"
                    >
                      NGOs
                    </a>
                  </li>

                  <li>
                    <a
                      href="#"
                      className="hover:text-pink-400 transition-colors"
                    >
                      Donors
                    </a>
                  </li>

                  <li>
                    <a
                      href="#"
                      className="hover:text-pink-400 transition-colors"
                    >
                      Healthcare Networks
                    </a>
                  </li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="text-white font-semibold mb-5">Company</h4>

                <ul className="space-y-3 text-gray-400">
                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-400 transition-colors"
                    >
                      About Us
                    </a>
                  </li>

                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-400 transition-colors"
                    >
                      Careers
                    </a>
                  </li>

                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-400 transition-colors"
                    >
                      Contact
                    </a>
                  </li>

                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-400 transition-colors"
                    >
                      Press Kit
                    </a>
                  </li>

                  <li>
                    <a
                      href="#"
                      className="hover:text-blue-400 transition-colors"
                    >
                      Partners
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="text-white font-semibold mb-5">Legal</h4>

                <ul className="space-y-3 text-gray-400">
                  <li>
                    <a
                      href="#"
                      className="hover:text-purple-400 transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </li>

                  <li>
                    <a
                      href="#"
                      className="hover:text-purple-400 transition-colors"
                    >
                      Terms & Conditions
                    </a>
                  </li>

                  <li>
                    <a
                      href="#"
                      className="hover:text-purple-400 transition-colors"
                    >
                      Data Security
                    </a>
                  </li>

                  <li>
                    <a
                      href="#"
                      className="hover:text-purple-400 transition-colors"
                    >
                      Compliance
                    </a>
                  </li>

                  <li>
                    <a
                      href="#"
                      className="hover:text-purple-400 transition-colors"
                    >
                      Support Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Copyright */}
              <div className="text-gray-500 text-sm text-center md:text-left">
                © 2026 BloodBridge. All rights reserved. Building smarter
                healthcare coordination systems.
              </div>

              {/* Social Icons */}
              <div className="flex items-center gap-4">
                <a
                  href="#"
                  className="group flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition-all duration-300 hover:border-red-500 hover:bg-red-500/10 hover:text-white"
                >
                  <Twitter className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                </a>

                <a
                  href="#"
                  className="group flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition-all duration-300 hover:border-pink-500 hover:bg-pink-500/10 hover:text-white"
                >
                  <Linkedin className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                </a>

                <a
                  href="#"
                  className="group flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition-all duration-300 hover:border-blue-500 hover:bg-blue-500/10 hover:text-white"
                >
                  <Youtube className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                </a>

                <a
                  href="#"
                  className="group flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition-all duration-300 hover:border-purple-500 hover:bg-purple-500/10 hover:text-white"
                >
                  <Instagram className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
