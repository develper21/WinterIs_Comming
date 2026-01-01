import { connectivityTiles } from "./constants";

export default function ConnectivityGrid() {
  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-[#ffe5ed] bg-white p-8 shadow-[0_35px_90px_rgba(42,8,20,0.08)]">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">
              Connectivity Grid
            </p>
            <h3 className="text-2xl font-semibold text-[#2a0814]">
              NGO + Ecosystem Interfaces
            </h3>
            <p className="text-sm text-[#7a4456]">
              Future scope-ready tiles keep hospitals, blood banks, and admins plugged in.
            </p>
          </div>
          <button className="rounded-full border border-[#ffd1df] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#7a0f25]">
            Export Snapshot
          </button>
        </header>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {connectivityTiles.map((tile) => (
            <article
              key={tile.label}
              className="rounded-3xl border border-[#ffe0e8] bg-[#fff9fb] p-5 shadow-[0_25px_60px_rgba(42,8,20,0.08)]"
            >
              <div className={`inline-flex rounded-full bg-linear-to-r ${tile.accent} px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-white`}>
                {tile.label}
              </div>
              <p className="mt-4 text-lg font-semibold text-[#2a0814]">
                {tile.description}
              </p>
              <p className="mt-3 text-xs text-[#7a4456]">{tile.meta}</p>
            </article>
          ))}
        </div>
      </div>

      <article className="rounded-[32px] border border-[#ffe5ed] bg-white p-8 shadow-[0_35px_90px_rgba(42,8,20,0.08)]">
        <p className="text-xs uppercase tracking-[0.4em] text-[#ff4d6d]">Admin Connectivity</p>
        <h4 className="mt-2 text-xl font-semibold text-[#2a0814]">
          Oversight & Approvals
        </h4>
        <p className="text-sm text-[#7a4456]">
          Camp status flow: Pending → Approved → Active → Completed or Cancelled. Manage remarks and escalations here.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {["Pending", "Approved", "Active", "Completed", "Cancelled"].map((status) => (
            <div
              key={status}
              className="rounded-2xl border border-[#ffe0e8] bg-[#fff9fb] px-5 py-4 text-sm text-[#2a0814]"
            >
              <p className="text-[11px] uppercase tracking-[0.4em] text-[#b45a6f]">{status}</p>
              <p className="mt-2 text-lg font-semibold">Camp status checkpoint</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
