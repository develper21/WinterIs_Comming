const adminSnapshot = {
  verificationStatus: "VERIFIED",
  verifiedBy: "System Admin",
  verifiedAt: "2025-12-18",
  message: "Your hospital has been successfully verified.",
};

const timeline = [
  {
    title: "Verification Approved",
    body: "Compliance review complete. Hospital cleared for statewide emergency requests.",
    date: "18 Dec 2025",
  },
  {
    title: "Documentation Submitted",
    body: "Uploaded NABH accreditation & transfusion SOPs.",
    date: "15 Dec 2025",
  },
  {
    title: "Preliminary Screening",
    body: "SEBN admin initiated onboarding call with hospital administration.",
    date: "12 Dec 2025",
  },
];

const statusBadgeStyles = {
  VERIFIED:
    "bg-[#ecf8ef] text-[#1f7a3a] border border-[#a2d8b3] shadow-[0_3px_12px_rgba(31,122,58,0.18)]",
  PENDING:
    "bg-[#fff3e4] text-[#b05f09] border border-[#f0c18c] shadow-[0_3px_12px_rgba(219,149,58,0.2)]",
  SUSPENDED:
    "bg-[#fde4e4] text-[#9e121c] border border-[#f5a5ad] shadow-[0_3px_12px_rgba(181,39,57,0.25)]",
};

export default function HospitalAdminVerification() {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <article className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-[0_30px_60px_rgba(77,10,15,0.12)]">
        <p className="text-xs uppercase tracking-[0.35em] text-[#8f0f1a]">
          Verification Status
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              statusBadgeStyles[adminSnapshot.verificationStatus]
            }`}
          >
            {adminSnapshot.verificationStatus}
          </span>
          <p className="text-sm text-[#7a4c4c]">
            Verified by {adminSnapshot.verifiedBy} on {adminSnapshot.verifiedAt}
          </p>
        </div>
        <p className="mt-5 rounded-2xl border border-[#f6ddd4] bg-[#fff2ee] p-4 text-sm text-[#5c2a2a]">
          {adminSnapshot.message}
        </p>

        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.35em] text-[#b05f09]">
            Compliance Notes
          </p>
          <ul className="mt-3 space-y-3 text-sm text-[#6a3a3a]">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#8f0f1a]" />
              Maintain 24×7 transfusion specialist coverage.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#8f0f1a]" />
              Update inventory at least twice a day during alert periods.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#8f0f1a]" />
              Report all request closures within 30 minutes of fulfillment.
            </li>
          </ul>
        </div>
      </article>

      <article className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-[0_30px_60px_rgba(77,10,15,0.12)]">
        <p className="text-xs uppercase tracking-[0.35em] text-[#8f0f1a]">
          Admin Timeline
        </p>
        <div className="mt-4 space-y-5">
          {timeline.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#f6ddd4] bg-[#fff9f6] p-4"
            >
              <div className="flex items-center justify-between text-sm text-[#8b6161]">
                <p>{item.date}</p>
                <span className="h-2 w-2 rounded-full bg-[#c62832]" />
              </div>
              <h4 className="mt-2 text-lg font-semibold text-[#2f1012]">
                {item.title}
              </h4>
              <p className="text-sm text-[#6a3a3a]">{item.body}</p>
            </div>
          ))}
        </div>

        <button className="mt-6 w-full rounded-2xl border border-[#f3c9c0] px-4 py-3 text-sm font-semibold text-[#8f0f1a] transition hover:border-[#8f0f1a]">
          Download Verification Letter (PDF)
        </button>
      </article>
    </section>
  );
}
