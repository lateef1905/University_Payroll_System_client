import { Link, NavLink } from "react-router";
import { useAuth } from "../lib/auth";
import { Wordmark } from "./brand";
import { cx, Icon } from "./ui";

/** Academic project credit, shown in the footer and on the About page. */
export const PROJECT = {
  course: "CSC 476",
  group: "Group 21",
  lecturer: "Prof. Oladejo",
  department: "Department of Computer Science",
  university: "University of Ibadan",
};

/** Support desk details. The address is configurable per deployment (VITE_SUPPORT_EMAIL). */
export const SUPPORT = {
  email: import.meta.env.VITE_SUPPORT_EMAIL || "payroll.support@ui.test",
  office: "Payroll Unit, Office of the Bursar",
  hours: "Monday to Friday, 8:00 am to 4:00 pm",
};

const NAV = [["/about", "About"], ["/support", "Support"]];

/** Public-site masthead (landing, about, support). `anchors` adds in-page links on the landing page. */
export function SiteHeader({ anchors = [] }) {
  const { status } = useAuth();
  const authed = status === "authed";
  return (
    <header className="border-b border-ink">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Link to="/" aria-label="Ledger home"><Wordmark /></Link>
        <nav className="flex items-center gap-1 sm:gap-6">
          {anchors.map(([href, label]) => (
            <a key={href} href={href} className="hidden text-sm text-ink-2 hover:text-ink lg:block">{label}</a>
          ))}
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => cx("hidden px-2 text-sm sm:block sm:px-0", isActive ? "font-semibold text-ink underline decoration-marker decoration-[3px] underline-offset-[6px]" : "text-ink-2 hover:text-ink")}>
              {label}
            </NavLink>
          ))}
          <Link to={authed ? "/app" : "/login"} className="inline-flex h-9 items-center gap-2 border border-ink bg-ink px-4 text-sm font-medium text-paper hover:bg-ink-2">
            {authed ? "Open the portal" : "Sign in"} <Icon name="arrow" className="size-3.5" />
          </Link>
        </nav>
      </div>
      <div className="mx-auto flex max-w-[1240px] justify-between border-t border-rule px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted sm:px-8">
        <span>University of Ibadan · Office of the Bursar</span>
        <span className="flex gap-4 sm:hidden">
          {NAV.map(([to, label]) => <Link key={to} to={to} className="hover:text-ink">{label}</Link>)}
        </span>
        <span className="hidden sm:inline">Payroll edition · {new Date().getFullYear()}</span>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-ink">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-8 px-4 py-10 sm:px-8 md:grid-cols-[1fr_auto] md:items-start">
        <div className="space-y-4">
          <Wordmark />
          <p className="max-w-xl text-[13px] leading-relaxed text-ink-2">
            Built by <strong className="font-semibold text-ink">{PROJECT.group}</strong>, {PROJECT.department} students,
            for <span className="font-mono text-[12px]">{PROJECT.course}</span> under {PROJECT.lecturer}, {PROJECT.university}.
          </p>
        </div>
        <nav className="flex gap-6 text-[13px] md:justify-end" aria-label="Footer">
          {[["/about", "About"], ["/support", "Contact support"], ["/login", "Sign in"]].map(([to, l]) => (
            <Link key={to} to={to} className="text-ink-2 underline decoration-rule-strong underline-offset-4 hover:text-ink hover:decoration-ink">{l}</Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-rule">
        <p className="mx-auto max-w-[1240px] px-4 py-4 text-[11.5px] text-muted sm:px-8">
          Salary scales in this environment are illustrative placeholders, not the official CONUASS/CONTISS tables.
          Confirm statutory rates with the Bursary before go-live.
        </p>
      </div>
    </footer>
  );
}

/** Shared page frame for the public pages. */
export function SitePage({ children, anchors }) {
  return (
    <div className="flex min-h-svh flex-col overflow-x-clip bg-paper">
      <SiteHeader anchors={anchors} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
