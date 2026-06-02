import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
      accent: "from-[#d93f42] via-[#ff4d6d] to-[#9b1e27]",
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
      accent: "from-[#1e5aa8] via-[#6fb1ff] to-[#9b1e27]",
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
      accent: "from-[#2c8a49] via-[#5ec271] to-[#1e5aa8]",
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
      accent: "from-[#9b1e27] via-[#ff4d6d] to-[#d93f42]",
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
      accent: "from-[#d1661c] via-[#f2994a] to-[#d93f42]",
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
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
            Case Studies
          </p>
          <h3 className="text-3xl font-semibold text-[#31101e]">
            Design systems, workflows, and outcomes
          </h3>
          <p className="text-sm text-[#7c4a5e]">
            A curated set of case studies showing how BloodBridge evolved
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-full border border-[#f2c8c8] bg-white/80 px-4 py-2 text-sm font-semibold text-[#ff4d6d] shadow-[0_10px_25px_rgba(255,77,109,0.15)] hover:shadow-[0_15px_35px_rgba(255,77,109,0.25)] transition-all"
          >
            Back
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-[#ffe0e8] bg-white/90 p-5 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
          <p className="text-xs text-[#7c4a5e]">Projects</p>
          <p className="mt-2 text-3xl font-semibold text-[#ff4d6d]">5+</p>
          <p className="mt-1 text-xs text-[#a44255]">Completed</p>
        </div>
        <div className="rounded-2xl border border-[#ffe0e8] bg-white/90 p-5 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
          <p className="text-xs text-[#7c4a5e]">Flows</p>
          <p className="mt-2 text-3xl font-semibold text-[#1e5aa8]">3</p>
          <p className="mt-1 text-xs text-[#a44255]">Redesigned</p>
        </div>
        <div className="rounded-2xl border border-[#ffe0e8] bg-white/90 p-5 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
          <p className="text-xs text-[#7c4a5e]">Platform</p>
          <p className="mt-2 text-3xl font-semibold text-[#2c8a49]">1</p>
          <p className="mt-1 text-xs text-[#a44255]">Unified system</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c4a5e]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search case studies, technology, result, or problem..."
              className="w-full rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] py-4 pl-12 pr-5 text-[#31101e] placeholder:text-[#a44255] outline-none transition focus:border-[#ff4d6d] focus:bg-white"
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
                      ? "border-[#ff4d6d] bg-[#fff0f3] text-[#ff4d6d]"
                      : "border-[#ffe0e8] bg-white/80 text-[#7c4a5e] hover:bg-white"
                  }`}
                >
                  {category === "all" ? "All" : category}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#7c4a5e]">
              Results
            </p>
            <p className="mt-1 font-semibold text-[#31101e]">
              {filteredStudies.length} case study
              {filteredStudies.length === 1 ? "" : "ies"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-3">
            <Filter className="h-5 w-5 text-[#7c4a5e]" />
          </div>
        </div>
      </div>

      {/* Featured Study */}
      <div className="relative overflow-hidden rounded-3xl border border-[#ffe0e8] bg-white/90 p-8 sm:p-10 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${featuredStudy.accent} opacity-5`}
        />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#f2c8c8] bg-white/80 px-3 py-1 text-xs font-semibold text-[#ff4d6d]">
              Featured study
            </span>
            <span className="rounded-full border border-[#f2c8c8] bg-white/80 px-3 py-1 text-xs font-semibold text-[#7c4a5e]">
              {featuredStudy.category}
            </span>
            <span className="rounded-full border border-[#f2c8c8] bg-white/80 px-3 py-1 text-xs font-semibold text-[#7c4a5e]">
              {featuredStudy.tag}
            </span>
          </div>

          <div className="mt-8 flex items-start gap-5">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${featuredStudy.accent} shadow-lg`}
            >
              <featuredIcon className="h-8 w-8 text-white" />
            </div>

            <div className="flex-1">
              <h2 className="text-3xl sm:text-4xl font-semibold leading-tight text-[#31101e]">
                {featuredStudy.title}
              </h2>
              <p className="mt-4 max-w-2xl text-[#7c4a5e] leading-relaxed">
                {featuredStudy.summary}
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#d93f42]">
                <Target className="h-4 w-4" />
                Problem
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#7c4a5e]">
                {featuredStudy.problem}
              </p>
            </div>

            <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#1e5aa8]">
                <Zap className="h-4 w-4" />
                Solution
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#7c4a5e]">
                {featuredStudy.solution}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#ffe0e8] bg-white/80 p-4">
              <p className="text-xs text-[#7c4a5e]">Impact</p>
              <p className="mt-2 font-semibold text-[#31101e]">
                {featuredStudy.impact}
              </p>
            </div>
            <div className="rounded-2xl border border-[#ffe0e8] bg-white/80 p-4">
              <p className="text-xs text-[#7c4a5e]">Duration</p>
              <p className="mt-2 font-semibold text-[#31101e]">
                {featuredStudy.duration}
              </p>
            </div>
            <div className="rounded-2xl border border-[#ffe0e8] bg-white/80 p-4">
              <p className="text-xs text-[#7c4a5e]">Tech Stack</p>
              <p className="mt-2 font-semibold text-[#31101e]">
                {featuredStudy.technologies.slice(0, 2).join(" · ")}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {featuredStudy.technologies.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-[#ffe0e8] bg-[#fff7f9] px-3 py-1 text-xs font-semibold text-[#7c4a5e]"
              >
                {tech}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href={featuredStudy.href}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#d93f42] via-[#ff4d6d] to-[#9b1e27] px-6 py-4 font-semibold text-white shadow-md transition hover:shadow-lg"
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
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#f2c8c8] bg-white/80 px-6 py-4 font-semibold text-[#ff4d6d] transition hover:bg-white"
            >
              <ExternalLink className="h-4 w-4" />
              Explore another study
            </button>
          </div>
        </div>
      </div>

      {/* Highlights */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#2c8a49]">
                Highlights
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
                What this page shows
              </h3>
            </div>
            <TrendingUp className="h-6 w-6 text-[#2c8a49]" />
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

        <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#1e5aa8]">
                Outcome
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[#31101e]">
                Key result
              </h3>
            </div>
            <TimerReset className="h-6 w-6 text-[#1e5aa8]" />
          </div>

          <div className="mt-6 rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-5">
            <p className="text-sm text-[#7c4a5e]">
              Better structure, better hierarchy, and better navigation across
              all user roles.
            </p>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#2c8a49]/20 bg-[#e8f5e9] p-4">
              <CheckCircle2 className="h-5 w-5 text-[#2c8a49]" />
              <p className="text-sm font-medium text-[#2c8a49]">
                More polished and product-led presentation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* All Studies */}
      <div>
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#7c4a5e]">
              All studies
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-[#31101e]">
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
                  className="group relative overflow-hidden rounded-3xl border border-[#ffe0e8] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,122,149,0.12)] transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${study.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-5`}
                  />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${study.accent}`}
                      >
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <span className="rounded-full border border-[#f2c8c8] bg-white/80 px-3 py-1 text-xs font-semibold text-[#7c4a5e]">
                        {study.category}
                      </span>
                    </div>

                    <h3 className="mt-6 text-2xl font-semibold text-[#31101e] leading-tight">
                      {study.title}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-[#7c4a5e]">
                      {study.summary}
                    </p>

                    <div className="mt-5 rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#7c4a5e]">
                        Result
                      </p>
                      <p className="mt-2 text-sm text-[#7c4a5e]">
                        {study.impact}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {study.technologies.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full border border-[#ffe0e8] bg-white/80 px-3 py-1 text-xs font-semibold text-[#7c4a5e]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-3">
                      <span className="text-xs text-[#a44255]">
                        {study.duration}
                      </span>

                      <Link
                        href={study.href}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#ff4d6d] transition group-hover:text-[#9b1e27]"
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
          <div className="rounded-3xl border border-[#ffe0e8] bg-white/90 p-10 text-center shadow-[0_20px_45px_rgba(255,122,149,0.12)]">
            <Layers3 className="mx-auto h-12 w-12 text-[#a44255]" />
            <h3 className="mt-4 text-2xl font-semibold text-[#31101e]">
              No case studies found
            </h3>
            <p className="mt-2 text-[#7c4a5e]">
              Try changing the search term or category filter.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function HighlightRow({ title, text }) {
  return (
    <div className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4">
      <p className="font-semibold text-[#31101e]">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-[#7c4a5e]">{text}</p>
    </div>
  );
}
