import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { ROLE_LABEL, useAuth } from "../lib/auth";
import { initials } from "../lib/format";
import { Mark } from "./brand";
import { cx, Icon } from "./ui";

function useNav() {
  const { isManager, isSuper } = useAuth();
  const groups = [];
  if (isManager) {
    groups.push(
      { title: "Payroll", items: [["overview", "Dashboard", "home"], ["runs", "Pay runs", "runs"], ["payslips", "Payslips", "receipt"]] },
      { title: "People", items: [["staff", "Staff", "people"], ["structure", "Faculties & units", "building"]] },
      { title: "Setup", items: [["rules", "Pay rules", "sliders"], ["audit", "Audit trail", "shield"], ...(isSuper ? [["users", "User accounts", "key"]] : [])] },
    );
  }
  groups.push({ title: isManager ? "Me" : "", items: [["my-pay", "My pay", "wallet"], ["settings", "Account", "user"]] });
  return groups;
}

function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <Mark className="size-8" />
      <span className="leading-tight">
        <span className="block text-[15px] font-extrabold tracking-[-0.02em]">Ledger</span>
        <span className="block text-[11px] font-semibold text-muted">UI Payroll</span>
      </span>
    </span>
  );
}

function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const groups = useNav();
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username;

  return (
    <div className="flex h-full flex-col border-r border-rule bg-card">
      <div className="px-5 pb-4 pt-5">
        <NavLink to="/app" onClick={onNavigate}><Brand /></NavLink>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-6" aria-label="Main">
        {groups.map((g, i) => (
          <div key={i} className="mt-5 first:mt-1">
            {g.title && <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">{g.title}</p>}
            <ul className="space-y-0.5">
              {g.items.map(([to, label, icon]) => (
                <li key={to}>
                  <NavLink
                    to={`/app/${to}`} onClick={onNavigate}
                    className={({ isActive }) => cx(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-semibold transition-colors",
                      isActive ? "bg-moss-wash text-moss-deep" : "text-ink-2 hover:bg-paper hover:text-ink",
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon name={icon} className={cx("size-[18px]", isActive ? "text-moss" : "text-faint")} strokeWidth={1.8} />
                        {label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="p-3">
        <NavLink to="/support" onClick={onNavigate} className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-semibold text-ink-2 hover:bg-paper hover:text-ink">
          <Icon name="alert" className="size-[18px] text-faint" strokeWidth={1.8} /> Help &amp; support
        </NavLink>
        <div className="flex items-center gap-3 rounded-xl bg-paper p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-moss text-[12px] font-bold text-white">{initials(name)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-bold">{name}</p>
            <p className="truncate text-[11.5px] font-medium text-muted">{ROLE_LABEL[user?.role]}</p>
          </div>
          <button
            onClick={async () => { await logout(); navigate("/login"); }}
            className="rounded-lg p-2 text-muted hover:bg-card hover:text-ink" title="Sign out" aria-label="Sign out"
          >
            <Icon name="logout" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppShell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-svh lg:block"><Sidebar /></aside>

      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-rule bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-paper-2" aria-label="Open menu"><Icon name="menu" className="size-5" /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] animate-[rise_.2s_ease-out]"><Sidebar onNavigate={() => setOpen(false)} /></div>
        </div>
      )}

      <main className="min-w-0 px-4 pb-20 pt-6 sm:px-8 lg:px-10 lg:pt-9">
        <div className="mx-auto max-w-[1280px]"><Outlet /></div>
      </main>
    </div>
  );
}
