import { period } from "../lib/format";
import { cx, Leader, Money } from "./ui";

export function Mark({ className = "size-7", inverted }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="6" fill={inverted ? "#F3EFE6" : "#16150F"} />
      <path d="M9 8v16h14" fill="none" stroke={inverted ? "#16150F" : "#F3EFE6"} strokeWidth="2.5" />
      <path d="M14 19h9M14 14h9" stroke="#1E7A50" strokeWidth="2.5" />
    </svg>
  );
}

export function Wordmark({ inverted, className }) {
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <Mark inverted={inverted} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.6rem] italic leading-[0.85]">Ledger</span>
        <span className={cx("font-mono text-[9px] uppercase tracking-[0.2em]", inverted ? "text-paper/55" : "text-muted")}>UI · Payroll</span>
      </span>
    </span>
  );
}

const EARNINGS = [
  ["basic_salary", "Basic salary"],
  ["housing_allowance", "Housing"],
  ["transport_allowance", "Transport"],
  ["research_allowance", "Research"],
  ["medical_allowance", "Medical"],
];
const DEDUCTIONS = [
  ["pension_employee", "Pension · 8%"],
  ["paye_tax", "PAYE tax"],
  ["cooperative_dues", "Cooperative"],
  ["loan_repayment", "Loan repayment"],
];

/**
 * The payslip as a physical object: a slip of paper with a perforated tear line
 * above the net figure and a rubber "PAID" stamp.
 */
export function PayslipPaper({ record, person, className, stamp = true, children }) {
  const nonZero = (rows) => rows.filter(([k]) => Number(record[k]) !== 0 || k === "basic_salary" || k === "pension_employee" || k === "paye_tax");
  return (
    <article className={cx("relative overflow-hidden bg-card shadow-slip", className)}>
      <div className="grain absolute inset-0 opacity-60" aria-hidden />
      <div className="relative px-6 pb-5 pt-6 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">University of Ibadan · Bursary</p>
            <p className="mt-1.5 font-display text-[2rem] leading-none">Payslip</p>
            <p className="mt-1 text-sm text-ink-2">{period(record.period_year, record.period_month)}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[12px]">{record.staff_id || person?.staff_id}</p>
            <p className="mt-0.5 font-mono text-[11px] text-muted">{record.salary_scale} · GL{String(record.grade_level).padStart(2, "0")}/{record.step}</p>
          </div>
        </div>
        <div className="mt-5 border-y border-ink py-2.5">
          <p className="font-semibold">{record.staff_name || person?.full_name}</p>
          {person && <p className="text-[13px] text-muted">{[person.designation, person.department_name].filter(Boolean).join(" · ")}</p>}
        </div>
        <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <p className="eyebrow mb-1">Earnings</p>
            {nonZero(EARNINGS).map(([k, l]) => <Leader key={k} label={l}><Money value={record[k]} /></Leader>)}
            <Leader label="Gross" strong className="border-t border-rule-strong mt-1"><Money value={record.gross_earnings} koboClass="text-muted" /></Leader>
          </div>
          <div>
            <p className="eyebrow mb-1">Deductions</p>
            {nonZero(DEDUCTIONS).map(([k, l]) => <Leader key={k} label={l}><Money value={record[k]} /></Leader>)}
            <Leader label="Total" strong className="border-t border-rule-strong mt-1"><Money value={record.total_deductions} koboClass="text-muted" /></Leader>
          </div>
        </div>
      </div>
      <div className="perforation relative" aria-hidden />
      <div className="relative flex flex-wrap items-end justify-between gap-4 bg-paper-2/60 px-6 pb-6 pt-4 sm:px-8">
        <div>
          <p className="eyebrow">Net pay</p>
          <Money value={record.net_pay} className="mt-1 block text-[2.1rem] font-medium leading-none tracking-[-0.03em]" koboClass="text-muted" />
          <p className="mt-2 text-[12px] text-muted">Employer pension contribution (not deducted): <Money value={record.pension_employer} /></p>
        </div>
        {children}
      </div>
      {stamp && (
        <div aria-hidden className="pointer-events-none absolute right-6 top-[104px] rotate-[-9deg] border-[2.5px] border-moss/70 px-3 py-1 font-mono text-lg font-semibold uppercase tracking-[0.3em] text-moss/70 mix-blend-multiply sm:right-10">
          Paid
        </div>
      )}
    </article>
  );
}
