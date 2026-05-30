"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Users,
  BarChart3,
  Star,
  ExternalLink,
  TimerReset,
  Layers3,
  Target,
  Zap,
  CheckCircle2,
} from "lucide-react";

export default function CaseStudiesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const caseStudies = [
    {
      id: "bloodbridge-platform",
      title: "BloodBridge Healthcare Coordination Platform",
      category: "HealthTech",
      tag: "Platform Design",
      summary:
        "A unified healthcare coordination system connecting hospitals, blood banks, NGOs, and donors through real-time workflows.",
      problem:
        "Critical blood requests were being handled across disconnected systems, causing delays and poor coordination.",
      solution:
        "We built a single platform for registration, approval, inventory visibility, donor engagement, and emergency response.",
      results: [
        "Reduced coordination friction between organizations",
        "Improved request visibility and approval workflow",
        "Enabled real-time donor and camp management",
      ],
      technologies: ["React", "Next.js", "Tailwind CSS", "Node.js", "MongoDB"],
      impact: "Faster response cycles",
      duration: "6 Weeks",
      href: "/case-studies/bloodbridge-platform",
      accent: "from-red-500 via-pink-500 to-rose-500",
      icon: ShieldCheck,
    },
    {
      id: "healthcare-dashboard",
      title: "Superadmin Healthcare Control Center",
      category: "Dashboard",
      tag: "Admin UX",
      summary:
        "A secure administrative dashboard for approvals, system monitoring, organization management, and analytics.",
      problem:
        "Admins needed a central control panel to manage registrations, reviews, activity logs, and system health.",
      solution:
        "We designed a layered dashboard with filters, detail views, action flows, and operational visibility.",
      results: [
        "Centralized admin operations in one interface",
        "Simplified approval and organization management",
        "Created a clear hierarchy for high-trust actions",
      ],
      technologies: ["React", "Tailwind CSS", "Lucide React", "REST API"],
      impact: "Better admin productivity",
      duration: "4 Weeks",
      href: "/case-studies/healthcare-dashboard",
      accent: "from-cyan-500 via-blue-500 to-indigo-500",
      icon: BarChart3,
    },
    {
      id: "donor-workflow",
      title: "Donor Registration and Camp Booking Flow",
      category: "Workflow",
      tag: "Conversion Flow",
      summary:
        "A guided donor flow for camp selection, time-slot booking, and safe donation eligibility tracking.",
      problem:
        "The donor experience was too complex and lacked a guided path from registration to booking.",
      solution:
        "We built a step-driven registration flow with validated fields, camp discovery, and slot selection.",
      results: [
        "Simplified donor sign-up experience",
        "Improved clarity for camp and slot selection",
        "Helped communicate donation eligibility rules",
      ],
      technologies: ["React", "Axios", "Tailwind CSS", "Toast UI"],
      impact: "Higher completion clarity",
      duration: "3 Weeks",
      href: "/case-studies/donor-workflow",
      accent: "from-emerald-500 via-teal-500 to-cyan-500",
      icon: Users,
    },
    {
      id: "organization-onboarding",
      title: "Organization Onboarding and Verification",
      category: "Workflow",
      tag: "Multi-step Form",
      summary:
        "A premium onboarding process for hospitals, NGOs, and blood banks with status tracking and admin setup.",
      problem:
        "Organizations needed a structured registration journey that collected all necessary verification data.",
      solution:
        "We created a polished 3-step onboarding flow with validation, success tracking, and approval visibility.",
      results: [
        "Clear step-by-step onboarding flow",
        "Stronger trust through structured verification",
        "Easy status checking after submission",
      ],
      technologies: ["React", "Tailwind CSS", "Form Validation", "Axios"],
      impact: "Cleaner onboarding",
      duration: "2 Weeks",
      href: "/case-studies/organization-onboarding",
      accent: "from-violet-500 via-fuchsia-500 to-pink-500",
      icon: Layers3,
    },
    {
      id: "landing-redesign",
      title: "Startup Landing Page Refresh",
      category: "Branding",
      tag: "Marketing UI",
      summary:
        "A modern dark-themed landing page built to improve first impressions and guide users into the platform.",
      problem:
        "The original landing page lacked strong visual hierarchy and brand confidence.",
      solution:
        "We redesigned the page with stronger hero content, platform cards, and a cleaner conversion path.",
      results: [
        "Premium startup look and feel",
        "Better user flow toward login and registration",
        "Clearer brand identity across sections",
      ],
      technologies: ["Next.js", "Tailwind CSS", "Lucide React"],
      impact: "Stronger first impression",
      duration: "1 Week",
      href: "/case-studies/landing-redesign",
      accent: "from-amber-500 via-orange-500 to-red-500",
      icon: Sparkles,
    },
  ];

  const categories = useMemo(
    () => ["all", ...new Set(caseStudies.map((study) => study.category))],
    [caseStudies],
  );

  const filteredStudies = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return caseStudies.filter((study) => {
      const matchesCategory =
        activeFilter === "all" || study.category === activeFilter;

      const haystack = [
        study.title,
        study.category,
        study.tag,
        study.summary,
        study.problem,
        study.solution,
        ...(study.technologies || []),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || haystack.includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [activeFilter, searchTerm, caseStudies]);

  const featuredStudy = filteredStudies[0] || caseStudies[0];
  const visibleStudies = filteredStudies.slice(1);

  const featuredIcon = featuredStudy.icon;

  return (
    <div className="min-h-screen overflow-hidden bg-[#050816] text-white relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 h-[420px] w-[420px] rounded-full bg-red-500/20 blur-3xl" />
        <div className="absolute top-20 right-0 h-[420px] w-[420px] rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative z-10">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between gap-4">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-3 group"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-red-500/30 blur-2xl" />
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 shadow-lg shadow-red-500/20">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                </div>

                <div className="text-left leading-tight">
                  <span className="block text-lg sm:text-xl font-extrabold tracking-tight text-white">
                    BloodBridge
                  </span>
                  <span className="block text-xs sm:text-sm text-gray-400">
                    Case studies archive
                  </span>
                </div>
              </button>

              <div className="hidden sm:flex items-center gap-3">
                <Link
                  href="/"
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  Home
                </Link>

                <Link
                  href="/contact"
                  className="rounded-full bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition hover:scale-[1.03]"
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <section className="text-center max-w-5xl mx-auto pt-4 pb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 backdrop-blur-xl">
              <Star className="h-4 w-4 text-amber-300" />
              Selected product stories and redesigns
            </div>

            <h1 className="mt-7 text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95]">
              <span className="block text-white">Design systems,</span>
              <span className="block bg-gradient-to-r from-red-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                workflows, and outcomes
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-3xl text-lg sm:text-xl leading-relaxed text-gray-400">
              A curated set of case studies showing how BloodBridge evolved from
              concept screens into a cleaner, more usable healthcare platform.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-xl">
                <div className="text-3xl font-black text-white">5+</div>
                <div className="mt-1 text-sm text-gray-400">Projects</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-xl">
                <div className="text-3xl font-black text-white">3</div>
                <div className="mt-1 text-sm text-gray-400">Flows</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-xl">
                <div className="text-3xl font-black text-white">1</div>
                <div className="mt-1 text-sm text-gray-400">
                  Unified platform
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search case studies, technology, result, or problem..."
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/40 py-4 pl-12 pr-5 text-white placeholder:text-gray-500 outline-none transition focus:border-red-500 focus:bg-white/10"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const active = activeFilter === category;
                    return (
                      <button
                        key={category}
                        onClick={() => setActiveFilter(category)}
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                          active
                            ? "border-red-500/30 bg-red-500/15 text-red-300"
                            : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {category === "all" ? "All" : category}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                  Results
                </p>
                <p className="mt-1 font-semibold text-white">
                  {filteredStudies.length} case study
                  {filteredStudies.length === 1 ? "" : "ies"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                <Filter className="h-5 w-5 text-gray-300" />
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-white/10 p-8 sm:p-10 backdrop-blur-2xl">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${featuredStudy.accent} opacity-10`}
              />
              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                    Featured study
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                    {featuredStudy.category}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                    {featuredStudy.tag}
                  </span>
                </div>

                <div className="mt-8 flex items-start gap-5">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${featuredStudy.accent} shadow-2xl`}
                  >
                    <featuredIcon className="h-8 w-8 text-white" />
                  </div>

                  <div className="flex-1">
                    <h2 className="text-3xl sm:text-4xl font-black leading-tight text-white">
                      {featuredStudy.title}
                    </h2>
                    <p className="mt-4 max-w-2xl text-gray-300 leading-relaxed">
                      {featuredStudy.summary}
                    </p>
                  </div>
                </div>

                <div className="mt-10 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-5">
                    <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-red-300">
                      <Target className="h-4 w-4" />
                      Problem
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-gray-300">
                      {featuredStudy.problem}
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-slate-950/40 p-5">
                    <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-cyan-300">
                      <Zap className="h-4 w-4" />
                      Solution
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-gray-300">
                      {featuredStudy.solution}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-gray-400">Impact</p>
                    <p className="mt-2 font-semibold text-white">
                      {featuredStudy.impact}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-gray-400">Duration</p>
                    <p className="mt-2 font-semibold text-white">
                      {featuredStudy.duration}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-gray-400">Tech Stack</p>
                    <p className="mt-2 font-semibold text-white">
                      {featuredStudy.technologies.slice(0, 2).join(" · ")}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  {featuredStudy.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs text-gray-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Link
                    href={featuredStudy.href}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 px-6 py-4 font-semibold text-white transition hover:scale-[1.02]"
                  >
                    View full case study
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <button
                    onClick={() => {
                      const next = visibleStudies[0] || caseStudies[1];
                      if (next) {
                        setSearchTerm("");
                        setActiveFilter("all");
                        window.location.hash = next.id;
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-semibold text-white transition hover:bg-white/10"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Explore another study
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">
                      Highlights
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-white">
                      What this page shows
                    </h3>
                  </div>
                  <TrendingUp className="h-6 w-6 text-emerald-300" />
                </div>

                <div className="mt-6 space-y-4">
                  <HighlightRow
                    title="Platform thinking"
                    text="How BloodBridge evolved into a structured product."
                  />
                  <HighlightRow
                    title="Flow improvements"
                    text="How registration and approval journeys became clearer."
                  />
                  <HighlightRow
                    title="Design quality"
                    text="How the UI became more premium and startup-ready."
                  />
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                      Outcome
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-white">
                      Key result
                    </h3>
                  </div>
                  <TimerReset className="h-6 w-6 text-cyan-300" />
                </div>

                <div className="mt-6 rounded-[28px] border border-white/10 bg-slate-950/40 p-5">
                  <p className="text-sm text-gray-400">
                    Better structure, better hierarchy, and better navigation
                    across all user roles.
                  </p>

                  <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                    <p className="text-sm font-medium text-emerald-200">
                      More polished and product-led presentation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-10">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-gray-400">
                  All studies
                </p>
                <h2 className="mt-2 text-3xl font-black text-white">
                  More stories
                </h2>
              </div>
            </div>

            {visibleStudies.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {visibleStudies.map((study) => {
                  const Icon = study.icon;
                  return (
                    <article
                      key={study.id}
                      id={study.id}
                      className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-white/20"
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${study.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-10`}
                      />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-4">
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${study.accent}`}
                          >
                            <Icon className="h-7 w-7 text-white" />
                          </div>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                            {study.category}
                          </span>
                        </div>

                        <h3 className="mt-6 text-2xl font-bold text-white leading-tight">
                          {study.title}
                        </h3>

                        <p className="mt-3 text-sm leading-relaxed text-gray-400">
                          {study.summary}
                        </p>

                        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                            Result
                          </p>
                          <p className="mt-2 text-sm text-gray-300">
                            {study.impact}
                          </p>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {study.technologies.slice(0, 3).map((tech) => (
                            <span
                              key={tech}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>

                        <div className="mt-6 flex items-center justify-between gap-3">
                          <span className="text-xs text-gray-500">
                            {study.duration}
                          </span>

                          <Link
                            href={study.href}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-white transition group-hover:text-red-300"
                          >
                            Read case study
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
                <Layers3 className="mx-auto h-12 w-12 text-gray-500" />
                <h3 className="mt-4 text-2xl font-black text-white">
                  No case studies found
                </h3>
                <p className="mt-2 text-gray-400">
                  Try changing the search term or category filter.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function HighlightRow({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-gray-400">{text}</p>
    </div>
  );
}
