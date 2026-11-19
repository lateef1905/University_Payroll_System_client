import { Link } from "react-router";
import { useAuth } from "../lib/auth";
import { PayslipPaper } from "../components/brand";
import { SiteFooter, SiteHeader } from "../components/site";
import { Icon } from "../components/ui";

/* A real record produced by the engine (staff.demo, October 2026, illustrative scales). */
const EXAMPLE = {
  staff_id: "UI/AC/2951", staff_name: "Dr Adebola Ogunleye", period_year: 2026, period_month: 10,
  salary_scale: "CONUASS", grade_level: 5, step: 4,
  basic_salary: "295625.00", housing_allowance: "73906.25", transport_allowance: "44343.75",
  research_allowance: "29562.50", medical_allowance: "5000.00", gross_earnings: "448437.50",
  pension_employee: "33110.00", paye_tax: "57258.95", cooperative_dues: "17000.00", loan_repayment: "0.00",
  total_deductions: "107368.95", net_pay: "341068.55", pension_employer: "41387.50",
};
const PERSON = { designation: "Senior Lecturer", department_name: "Computer Science and AI" };

const TICKER = [
  "PAYE · Nigeria Tax Act 2025 bands, 0% to 25%",
  "Pension · 8% employee, 10% employer",
  "Rent relief · 20%, capped at ₦500,000",
  "CONUASS · CONTISS · CONPCASS",
  "Every record immutable once paid",
  "Every change to pay data, on the record",
  "Re-runs never double-pay",
];

const STEPS = [
  ["Basic", "Annual basic for scale, grade and step, ÷ 12", "295,625.00"],
  ["+ Allowances", "Housing 25%, transport 15%, research 10%, medical fixed", "152,812.50"],
  ["= Gross", "", "448,437.50", true],
  ["− Pension", "8% of basic + housing + transport", "33,110.00"],
  ["− PAYE", "Progressive bands on annual taxable income, ÷ 12", "57,258.95"],
  ["− Voluntary", "Cooperative dues and loan repayment", "17,000.00"],
  ["= Net pay", "Rejected outright if it would fall below zero", "341,068.55", true],
];

const FEATURES = [
  ["Pay runs that finish what they start", "Trigger a month for one faculty or all of them. Runs are resumable and idempotent: anyone already paid for the period is skipped, and every person in scope is accounted for as paid, skipped or failed."],
  ["Payslips people can trust", "Each staff member sees their own slips and nobody else's. PDFs are generated on request, and every download is logged."],
  ["Rules that refuse to double-pay", "Salary scales, allowance rules and PAYE bands are edited in one place. Overlapping allowances and gapped tax ladders are rejected before they reach a run."],
  ["An audit trail auditors will like", "Who changed which salary row, when and from what. Logins, pay runs and payslip access sit in a separate activity log."],
];

const ROLES = [
  ["Run payroll and see every record", true, true, false],
  ["Edit scales, allowances and tax bands", true, true, false],
  ["Manage staff profiles and faculties", true, true, false],
  ["Read change history", true, true, false],
  ["Manage user accounts and the activity log", true, false, false],
  ["View and download own payslips", true, true, true],
];

export default function Landing() {
  const { status } = useAuth();
  const authed = status === "authed";
  const cta = authed ? "/app" : "/login";

  return (
    <div className="min-h-svh overflow-x-clip bg-paper">
      <SiteHeader anchors={[["#arithmetic", "How pay is computed"], ["#roles", "Access"]]} />

      {/* hero */}
      <section className="mx-auto grid max-w-[1240px] gap-12 px-4 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:pt-20">
        <div className="animate-rise">
          <p className="eyebrow mb-6">Staff payroll, end to end</p>
          <h1 className="font-display text-[3.4rem] leading-[0.9] tracking-[-0.02em] sm:text-[5rem] lg:text-[6.1rem]">
            Every naira,<br />
            <em className="relative whitespace-nowrap">
              <span className="relative z-10">accounted for.</span>
              <span aria-hidden className="absolute inset-x-[-0.08em] bottom-[0.1em] z-0 h-[0.32em] -rotate-1 bg-marker/80" />
            </em>
          </h1>
          <p className="mt-8 max-w-[34rem] text-[17px] leading-relaxed text-ink-2">
            Ledger runs the University&rsquo;s monthly payroll: CONUASS and CONTISS scales, allowances, pension,
            and PAYE under the Nigeria Tax Act 2025. Every payslip it issues can be traced back to the rule that produced it.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link to={cta} className="inline-flex h-12 items-center gap-2.5 bg-moss px-6 text-[15px] font-medium text-white hover:bg-moss-deep">
              {authed ? "Go to your dashboard" : "Sign in to the portal"} <Icon name="arrow" />
            </Link>
            <a href="#arithmetic" className="inline-flex h-12 items-center px-4 text-[15px] text-ink underline decoration-rule-strong decoration-1 underline-offset-[6px] hover:decoration-ink">
              See the arithmetic
            </a>
          </div>
          <dl className="mt-14 grid max-w-lg grid-cols-3 border-t border-ink">
            {[["3", "salary structures supported"], ["6", "PAYE bands, Tax Act 2025"], ["0", "double payments, by design"]].map(([n, l]) => (
              <div key={l} className="border-r border-rule pr-3 pt-4 last:border-0 [&:not(:first-child)]:pl-4">
                <dt className="font-display text-[2.4rem] leading-none">{n}</dt>
                <dd className="mt-1.5 text-[12.5px] leading-snug text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* the slip stack */}
        <div className="relative mx-auto w-full max-w-[520px] lg:mt-6">
          <div aria-hidden className="absolute inset-x-6 -top-3 h-full rotate-[3deg] bg-card/70 shadow-slip" />
          <div aria-hidden className="absolute inset-x-3 -top-1.5 h-full -rotate-[1.6deg] bg-card/90 shadow-slip" />
          <PayslipPaper record={EXAMPLE} person={PERSON} className="relative animate-rise [animation-delay:120ms]">
            <span className="font-mono text-[11px] text-muted">FCMB ******4417</span>
          </PayslipPaper>
          <p className="mt-5 text-center font-mono text-[11px] text-muted">Computed by the payroll engine · illustrative salary scales</p>
        </div>
      </section>

      {/* ticker */}
      <div className="overflow-hidden border-y border-ink bg-ink py-3 text-paper" aria-label="Statutory figures applied">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap font-mono text-[12px] uppercase tracking-[0.14em]">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-10">{t}<span className="text-marker">✦</span></span>
          ))}
        </div>
      </div>

      {/* arithmetic */}
      <section id="arithmetic" className="mx-auto max-w-[1240px] scroll-mt-8 px-4 py-24 sm:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow mb-4">§ 01 · The arithmetic</p>
            <h2 className="font-display text-[2.8rem] leading-[0.95] sm:text-[3.6rem]">Nothing hidden between gross and net.</h2>
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-ink-2">
              The same calculation runs for a graduate assistant and a vice-chancellor. Money is kept as exact decimals,
              rounded once to the kobo. Statutory rates live in configuration, not scattered through code.
            </p>
            <p className="mt-6 max-w-md border-l-2 border-marker pl-4 text-[14px] text-muted">
              Worked example: a Senior Lecturer on CONUASS 5, step 4, October 2026.
            </p>
          </div>
          <ol className="border-t border-ink">
            {STEPS.map(([label, note, amount, total], i) => (
              <li key={label} className={`grid grid-cols-[3rem_minmax(0,1fr)_auto] items-baseline gap-x-4 border-b py-4 ${total ? "border-ink" : "border-rule"}`}>
                <span className="font-mono text-[11px] text-faint">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className={total ? "font-display text-[1.7rem] leading-none" : "text-[16px] font-medium"}>{label}</p>
                  {note && <p className="mt-1 text-[13px] text-muted">{note}</p>}
                </div>
                <span className={`figure text-right ${total ? "text-[1.35rem]" : "text-[15px] text-ink-2"}`}>₦{amount}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* features */}
      <section className="border-y border-ink bg-card">
        <div className="mx-auto max-w-[1240px] px-4 py-24 sm:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow mb-4">§ 02 · For the Bursary</p>
              <h2 className="max-w-2xl font-display text-[2.8rem] leading-[0.95] sm:text-[3.6rem]">Built around how payroll actually goes wrong.</h2>
            </div>
            <p className="max-w-sm text-[15px] text-ink-2">A worker that dies mid-run, a rule entered twice, a loan keyed with two extra zeros. Each one has an answer here.</p>
          </div>
          <div className="mt-14 grid gap-px border border-rule bg-rule md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(([title, body], i) => (
              <div key={title} className="flex flex-col bg-card p-6 transition-colors hover:bg-paper">
                <span className="font-mono text-[11px] text-faint">0{i + 1}</span>
                <h3 className="mt-10 text-[17px] font-semibold leading-snug tracking-[-0.01em]">{title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* roles */}
      <section id="roles" className="mx-auto max-w-[1240px] scroll-mt-8 px-4 py-24 sm:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow mb-4">§ 03 · Access</p>
            <h2 className="font-display text-[2.8rem] leading-[0.95] sm:text-[3.6rem]">Three roles. One set of books.</h2>
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-ink-2">
              Access is enforced by the server on every request, never by hiding buttons. Another person&rsquo;s payslip
              doesn&rsquo;t return &ldquo;forbidden&rdquo;: as far as you can tell, it doesn&rsquo;t exist.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="ledger-table min-w-[520px]">
              <thead>
                <tr><th>Capability</th><th className="text-center">Super admin</th><th className="text-center">Bursary</th><th className="text-center">Staff</th></tr>
              </thead>
              <tbody>
                {ROLES.map(([cap, ...cells]) => (
                  <tr key={cap}>
                    <td className="text-ink-2">{cap}</td>
                    {cells.map((ok, i) => (
                      <td key={i} className="text-center">
                        {ok ? <Icon name="check" className="mx-auto size-4 text-moss" strokeWidth={2} /> : <span className="text-faint">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* closing */}
      <section className="ruled bg-ink text-paper" style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 31px, rgba(243,239,230,0.05) 31px 32px)" }}>
        <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-10 px-4 py-24 sm:px-8 md:flex-row md:items-end">
          <h2 className="max-w-3xl font-display text-[3rem] leading-[0.92] sm:text-[4.6rem]">
            This month&rsquo;s payroll is <em className="text-marker">waiting</em> to be run.
          </h2>
          <Link to={cta} className="inline-flex h-12 shrink-0 items-center gap-2.5 bg-paper px-6 text-[15px] font-medium text-ink hover:bg-marker">
            {authed ? "Open the portal" : "Sign in"} <Icon name="arrow" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
