import { useMemo } from "react";
import { useNgoData } from "./context";

const metricMeta = [
  { label: "Total Camps", key: "totalCamps", meta: "Portfolio" },
  { label: "Active Camps", key: "active", meta: "On ground" },
  { label: "Upcoming", key: "upcoming", meta: "Next 30 days" },
  { label: "Completed", key: "completed", meta: "Closed" },
  { label: "Total Slots", key: "totalSlots", meta: "Across camps" },
  { label: "Registered Donors", key: "totalRegistered", meta: "Confirmed" },
];

export default function NgoOverview() {
  const { stats, expectedActualRatio } = useNgoData();

  const cards = useMemo(
    () =>
      metricMeta.map((meta) => ({
        ...meta,
        value: stats[meta.key] ?? 0,
      })),
    [stats]
  );

  return (
    <section className="space-y-8">
      <div className="rounded-[32px] border border-white/70 bg-white p-8 shadow-[0_35px_80px_rgba(111,18,36,0.1)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">Snapshot</p>
            <h2 className="text-2xl font-semibold text-[#2a0814]">
              Operational Overview
            </h2>
            <p className="text-sm text-[#7a4456]">
              Real-time metrics mapped to NgoCamp · CampSlot · CampRegistration collections.
            </p>
          </div>
          <div className="rounded-3xl bg-[#2f0a19] px-6 py-4 text-white shadow-[0_18px_50px_rgba(47,10,25,0.5)]">
            <p className="text-xs uppercase tracking-[0.5em] text-white/60">
              Expected vs Actual
            </p>
            <div className="mt-3 flex items-end gap-4">
              <div>
                <p className="text-sm text-white/70">Expected</p>
                <p className="text-3xl font-semibold">{stats.expectedDonors}</p>
              </div>
              <div>
                <p className="text-sm text-white/70">Actual</p>
                <p className="text-3xl font-semibold">{stats.actualDonors}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-lg font-semibold text-[#ffb4c3]">
                  {expectedActualRatio}%
                </p>
                <p className="text-[11px] uppercase tracking-[0.4em] text-white/50">
                  conversion
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-linear-to-r from-[#ff4d6d] to-[#ff7b9c]"
                style={{ width: `${expectedActualRatio}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {cards.map((card) => (
            <article
              key={card.label}
              className="rounded-2xl border border-[#ffe0e8] bg-[#fff7f9] p-4 text-sm shadow-[0_20px_45px_rgba(255,122,149,0.12)]"
            >
              <p className="text-[11px] uppercase tracking-[0.4em] text-[#a44255]">
                {card.meta}
              </p>
              <p className="mt-3 text-3xl font-semibold text-[#2a0814]">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-[#a44255]">{card.label}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <article className="rounded-[28px] border border-[#ffdbe4] bg-white p-6 shadow-[0_30px_70px_rgba(255,122,149,0.15)]">
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
                Pipeline
              </p>
              <h3 className="text-2xl font-semibold text-[#2a0814]">
                Upcoming Milestones
              </h3>
              <p className="text-sm text-[#7a4456]">
                Prioritize active camps, approvals, and donor surges in one view.
              </p>
            </div>
            <button className="rounded-full border border-[#ffd1df] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#7a0f25]">
              View Planner
            </button>
          </header>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Active Camps",
                value: stats.active,
                meta: "On-ground",
                accent: "from-[#f72585] to-[#b5179e]",
              },
              {
                title: "Pending Approvals",
                value: Math.max(stats.totalCamps - stats.active - stats.completed, 0),
                meta: "Await admin",
                accent: "from-[#ff4d6d] to-[#ff8fa3]",
              },
              {
                title: "Expected Donors",
                value: stats.expectedDonors,
                meta: "Across camps",
                accent: "from-[#ffb703] to-[#fb8500]",
              },
              {
                title: "Registered Donors",
                value: stats.totalRegistered,
                meta: "Confirmed",
                accent: "from-[#4361ee] to-[#3a0ca3]",
              },
            ].map((card) => (
              <article
                key={card.title}
                className="rounded-3xl border border-[#ffe0e8] bg-[#fff9fb] p-5 shadow-[0_20px_50px_rgba(42,8,20,0.08)]"
              >
                <p className="text-xs uppercase tracking-[0.4em] text-[#b45a6f]">
                  {card.meta}
                </p>
                <h4 className="mt-3 text-3xl font-semibold text-[#2a0814]">
                  {card.value}
                </h4>
                <p className="text-sm text-[#7a4456]">{card.title}</p>
                <div
                  className={`mt-4 h-1 rounded-full bg-linear-to-r ${card.accent}`}
                />
              </article>
            ))}
          </div>
        </article>
        <article className="rounded-[28px] border border-[#ffe4ec] bg-white p-6 shadow-[0_30px_70px_rgba(66,7,18,0.08)]">
          <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
            Command Alerts
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-[#2a0814]">
            Emergency Readiness
          </h3>
          <p className="text-sm text-[#7a4456]">
            Monitor real-time donor conversions across metro clusters to stay ready for
            trauma escalations.
          </p>
          <div className="mt-6 space-y-4 text-sm text-[#7a4456]">
            <p>• 3 camps awaiting admin clearance</p>
            <p>• 412 donors in warm outreach</p>
            <p>• 5 hospitals requesting immediate pairing</p>
          </div>
        </article>
      </div>
    </section>
  );
}
