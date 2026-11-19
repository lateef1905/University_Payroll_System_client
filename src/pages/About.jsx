import { Link } from "react-router";
import { PROJECT, SitePage } from "../components/site";
import { Icon } from "../components/ui";

const PRINCIPLES = [
  ["Every figure is traceable", "Each payslip stores a frozen snapshot of the grade, rules and tax bands used, so any naira can be traced back to the rule that produced it."],
  ["Nobody is paid twice", "A pay run can be repeated safely after a failure. Anyone already paid for the month is skipped, and the database enforces it."],
  ["Access is enforced by the server", "Staff see only their own payslips. The Bursary manages payroll. Only super administrators manage accounts."],
  ["Changes leave a trail", "Every edit to a salary row, allowance, tax band or staff record is versioned, with who changed it and when."],
];

const STACK = [
  ["Server", "Django 5 and Django REST Framework, JWT sign-in, Celery for pay runs, ReportLab for PDF payslips"],
  ["Client", "React 19, Vite and Tailwind CSS, with TanStack Query for data"],
  ["Payroll rules", "CONUASS and CONTISS scales, allowances, 8% / 10% pension and PAYE under the Nigeria Tax Act 2025"],
];

export default function About() {
  return (
    <SitePage>
      <section className="mx-auto max-w-[1240px] px-4 pb-16 pt-14 sm:px-8 lg:pt-20">
        <p className="eyebrow mb-6">About Ledger</p>
        <h1 className="max-w-4xl font-display text-[3rem] leading-[0.92] tracking-[-0.02em] sm:text-[4.6rem]">
          A payroll system for the University of Ibadan, <em>built by its students.</em>
        </h1>
        <p className="mt-8 max-w-2xl text-[17px] leading-relaxed text-ink-2">
          Ledger computes and pays monthly salaries for academic and non-academic staff, issues PDF payslips,
          and keeps a complete audit trail for the Bursary. It began as a course project and is designed to
          the standard a real payroll office would expect.
        </p>
      </section>

      {/* project credit */}
      <section className="border-y border-ink bg-card">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-4 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow mb-4">§ 01 · The project</p>
            <h2 className="font-display text-[2.4rem] leading-[0.95] sm:text-[3rem]">Who built it</h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-2">
              Ledger was designed and built by students of the {PROJECT.department} as their group project
              for {PROJECT.course}.
            </p>
          </div>
          <dl className="grid grid-cols-1 border-l border-t border-rule sm:grid-cols-2">
            {[
              ["Course", PROJECT.course],
              ["Team", PROJECT.group],
              ["Lecturer", PROJECT.lecturer],
              ["Department", PROJECT.department],
              ["Institution", PROJECT.university],
              ["Year", "2026"],
            ].map(([k, v]) => (
              <div key={k} className="border-b border-r border-rule p-5">
                <dt className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">{k}</dt>
                <dd className="mt-2 text-[17px] font-semibold tracking-[-0.01em]">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* principles */}
      <section className="mx-auto max-w-[1240px] px-4 py-20 sm:px-8">
        <p className="eyebrow mb-4">§ 02 · What it promises</p>
        <h2 className="max-w-2xl font-display text-[2.4rem] leading-[0.95] sm:text-[3rem]">Four things it gets right.</h2>
        <div className="mt-10 grid gap-px border border-rule bg-rule md:grid-cols-2">
          {PRINCIPLES.map(([t, b], i) => (
            <div key={t} className="bg-paper p-6">
              <span className="font-mono text-[11px] text-faint">0{i + 1}</span>
              <h3 className="mt-6 text-[17px] font-semibold tracking-[-0.01em]">{t}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* stack */}
      <section className="mx-auto max-w-[1240px] px-4 pb-20 sm:px-8">
        <p className="eyebrow mb-4">§ 03 · How it&rsquo;s built</p>
        <ul className="border-t border-ink">
          {STACK.map(([k, v]) => (
            <li key={k} className="grid grid-cols-1 gap-1 border-b border-rule py-4 sm:grid-cols-[200px_1fr]">
              <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-muted">{k}</span>
              <span className="text-[15px] text-ink-2">{v}</span>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/login" className="inline-flex h-12 items-center gap-2.5 bg-moss px-6 text-[15px] font-medium text-white hover:bg-moss-deep">
            Sign in to the portal <Icon name="arrow" />
          </Link>
          <Link to="/support" className="inline-flex h-12 items-center px-4 text-[15px] text-ink underline decoration-rule-strong underline-offset-[6px] hover:decoration-ink">
            Need help? Contact support
          </Link>
        </div>
      </section>
    </SitePage>
  );
}
