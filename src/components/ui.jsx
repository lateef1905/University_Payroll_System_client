import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { nairaParts } from "../lib/format";

const cx = (...c) => c.filter(Boolean).join(" ");
export { cx };

/* ---------------------------------------------------------------- buttons */
const BTN = {
  ink: "bg-ink text-white hover:bg-ink-2 shadow-sm",
  moss: "bg-moss text-white hover:bg-moss-deep shadow-sm",
  line: "bg-card text-ink border border-rule-strong hover:border-ink-2 hover:bg-paper shadow-sm",
  ghost: "bg-transparent text-ink-2 hover:bg-paper-2",
  danger: "bg-danger text-white hover:brightness-110 shadow-sm",
  lime: "bg-marker text-moss-deep hover:brightness-95 shadow-sm",
  white: "bg-white text-moss-deep hover:bg-moss-wash shadow-sm",
};
const SIZE = { sm: "h-8 px-3 text-[13px] rounded-lg", md: "h-10 px-4 text-sm rounded-xl", lg: "h-12 px-5 text-[15px] rounded-xl" };

export function Button({ variant = "ink", size = "md", className, loading, children, icon, ...props }) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 whitespace-nowrap",
        BTN[variant], SIZE[size], className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

export function Spinner({ className = "size-4" }) {
  return (
    <svg className={cx("animate-spin", className)} viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity=".25" strokeWidth="2" />
      <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------------------------------------------------------- icons (20px grid, 1.6px stroke) */
const PATHS = {
  arrow: "M4 10h12M11 5l5 5-5 5",
  back: "M16 10H4M9 5l-5 5 5 5",
  plus: "M10 4v12M4 10h12",
  close: "M5 5l10 10M15 5L5 15",
  download: "M10 3v10M6 9l4 4 4-4M4 17h12",
  search: "M9 15A6 6 0 1 0 9 3a6 6 0 0 0 0 12zM13.5 13.5L17 17",
  menu: "M3 6h14M3 10h14M3 14h14",
  check: "M4 10.5l4 4 8-9",
  alert: "M10 3l8 14H2L10 3zM10 8v4M10 14.5v.5",
  edit: "M13 3l4 4-9 9H4v-4l9-9z",
  trash: "M4 6h12M8 6V4h4v2M6 6l1 11h6l1-11",
  refresh: "M16 10a6 6 0 1 1-2-4.5M16 3v4h-4",
  play: "M6 4l10 6-10 6V4z",
  logout: "M12 4h4v12h-4M8 6l-4 4 4 4M4 10h9",
  chevron: "M8 5l5 5-5 5",
  home: "M3 9l7-6 7 6v8H3V9zM8 17v-5h4v5",
  runs: "M3 5h14M3 10h9M3 15h6M15 12l3 3-3 3",
  receipt: "M5 2h10v16l-2.5-1.5L10 18l-2.5-1.5L5 18V2zM8 6h4M8 9h4M8 12h2",
  people: "M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 17c0-3 2.2-5 5-5s5 2 5 5M14 4a2.5 2.5 0 0 1 0 5M15 12c2 .4 3 2 3 5",
  building: "M3 17V7l7-4 7 4v10M3 17h14M7 17v-4h6v4M7 9h1M12 9h1",
  sliders: "M4 4v12M10 4v12M16 4v12M2 7h4M8 12h4M14 9h4",
  shield: "M10 2l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V5l7-3zM7 10l2 2 4-4",
  key: "M7 13a4 4 0 1 1 3-3l7 7v2h-2v-2h-2v-2l-2-2",
  wallet: "M3 6h13a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H3V4a1 1 0 0 1 1-1h10M13 11h4",
  user: "M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM3 18c0-4 3-6 7-6s7 2 7 6",
  settings: "M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM10 1v3M10 16v3M1 10h3M16 10h3M3.6 3.6l2.1 2.1M14.3 14.3l2.1 2.1M3.6 16.4l2.1-2.1M14.3 5.7l2.1-2.1",
  tax: "M4 16L16 4M6 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM14 16a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  piggy: "M4 10a6 5 0 0 1 11-2.5L17 7v4l-1.5.5A6 5 0 0 1 12 15v2H9v-1.5A6 5 0 0 1 4 10zM2 9h2M13 9h.01",
  calendar: "M3 5h14v12H3V5zM3 9h14M7 3v4M13 3v4",
  trend: "M2 15l5-5 3 3 7-8M12 5h5v5",
  bank: "M2 8l8-5 8 5M4 8v7M8 8v7M12 8v7M16 8v7M2 17h16",
  sparkle: "M10 2l1.8 5.2L17 9l-5.2 1.8L10 16l-1.8-5.2L3 9l5.2-1.8L10 2z",
};
export function Icon({ name, className = "size-4", strokeWidth = 1.6 }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}

const CHIP = {
  moss: "bg-moss-wash text-moss",
  azure: "bg-azure-wash text-azure",
  terra: "bg-terra-wash text-terra",
  plum: "bg-plum-wash text-plum",
  ochre: "bg-ochre-wash text-ochre",
  ink: "bg-paper-2 text-ink-2",
};
/** A soft rounded square holding an icon: the colour key for stat tiles. */
export function IconChip({ name, tone = "moss", className }) {
  return (
    <span className={cx("inline-flex size-9 shrink-0 items-center justify-center rounded-xl", CHIP[tone], className)}>
      <Icon name={name} className="size-[18px]" strokeWidth={1.8} />
    </span>
  );
}

/* ---------------------------------------------------------------- form fields */
export function Field({ label, hint, error, children, className }) {
  const id = useId();
  const child = typeof children === "function" ? children({ id, invalid: !!error }) : children;
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      {label && <label htmlFor={id} className="text-[13px] font-semibold text-ink-2">{label}</label>}
      {child}
      {error ? <p className="text-[12.5px] text-danger">{error}</p> : hint ? <p className="text-[12.5px] text-muted">{hint}</p> : null}
    </div>
  );
}

export function Input({ label, hint, error, className, inputClassName, ...props }) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {({ id, invalid }) => <input id={id} aria-invalid={invalid} className={cx("input", inputClassName)} {...props} />}
    </Field>
  );
}

export function Select({ label, hint, error, className, children, ...props }) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {({ id, invalid }) => (
        <select id={id} aria-invalid={invalid} className="input" {...props}>{children}</select>
      )}
    </Field>
  );
}

export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <label className={cx("inline-flex items-center gap-2.5 text-sm select-none", disabled ? "opacity-50" : "cursor-pointer")}>
      <button
        type="button" role="switch" aria-checked={checked} disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx("relative h-6 w-10 rounded-full transition-colors", checked ? "bg-moss" : "bg-rule-strong")}
      >
        <span className={cx("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", checked ? "left-[18px]" : "left-0.5")} />
      </button>
      {label}
    </label>
  );
}

/* ---------------------------------------------------------------- money */
/** Naira with the kobo set smaller and lighter: the eye reads the whole number first. */
export function Money({ value, className, koboClass = "text-faint", hideKobo }) {
  const { whole, kobo } = nairaParts(value);
  return (
    <span className={cx("figure whitespace-nowrap", className)}>
      {whole}
      {!hideKobo && <span className={cx("text-[0.72em] font-medium", koboClass)}>{kobo}</span>}
    </span>
  );
}

/* ---------------------------------------------------------------- status badges */
const STAMP = {
  COMPLETED: ["Paid", "bg-moss-wash text-moss"],
  COMPLETED_WITH_ERRORS: ["Paid with errors", "bg-warn-wash text-warn"],
  FAILED: ["Failed", "bg-danger-wash text-danger"],
  PENDING: ["Queued", "bg-azure-wash text-azure"],
  PROCESSING: ["Processing", "bg-azure-wash text-azure"],
  ACTIVE: ["Active", "bg-moss-wash text-moss"],
  INACTIVE: ["Inactive", "bg-paper-2 text-muted"],
};

export function Stamp({ status, label, className }) {
  const [text, tone] = STAMP[status] || [label || status, "bg-paper-2 text-muted"];
  const busy = status === "PROCESSING" || status === "PENDING";
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold leading-none whitespace-nowrap", tone, className)}>
      <span className={cx("size-1.5 rounded-full bg-current", busy && "animate-pulse")} />
      {label || text}
    </span>
  );
}

export function Tag({ children, className }) {
  return (
    <span className={cx("inline-flex items-center rounded-md bg-paper-2 px-1.5 py-0.5 text-[12px] font-semibold tabular-nums text-ink-2", className)}>{children}</span>
  );
}

/* ---------------------------------------------------------------- layout pieces */
export function PageHeader({ eyebrow, title, children, actions }) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between animate-rise">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="text-[1.75rem] font-bold leading-tight tracking-[-0.025em] md:text-[2rem]">{title}</h1>
        {children && <div className="mt-1.5 max-w-2xl text-[14.5px] text-muted">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ className, children, ...props }) {
  return <div className={cx("card", className)} {...props}>{children}</div>;
}

/**
 * A titled block. By default it is a card; `plain` drops the card chrome
 * (use it when the content is already a card, such as a table).
 */
export function Section({ title, aside, children, className, plain, icon }) {
  return (
    <section className={cx("min-w-0", !plain && "card p-5 sm:p-6", className)}>
      {(title || aside) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h2 className="flex items-center gap-2.5 text-[15px] font-bold tracking-[-0.01em]">
            {icon && <IconChip name={icon} tone="ink" className="size-7 rounded-lg" />}
            {title}
          </h2>
          {aside && <div className="text-[13px] text-muted">{aside}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/** A key figure with a coloured icon chip, a value and an optional footnote/delta. */
export function StatTile({ icon, tone = "moss", label, value, foot, className }) {
  return (
    <div className={cx("card flex flex-col gap-4 p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-muted">{label}</span>
        <IconChip name={icon} tone={tone} />
      </div>
      <div className="min-w-0 text-[1.6rem] font-bold leading-none tracking-[-0.03em]">{value}</div>
      {foot && <div className="text-[12.5px] text-muted">{foot}</div>}
    </div>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-rule-strong bg-card/60 px-6 py-14 text-center">
      <IconChip name="sparkle" tone="ink" className="mb-2" />
      <p className="text-[17px] font-bold">{title}</p>
      {children && <p className="max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cx("animate-pulse rounded-xl bg-paper-2", className)} />;
}

export function TableSkeleton({ rows = 8, cols = 5 }) {
  return (
    <div className="card overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-rule px-4 py-4 last:border-0">
          {Array.from({ length: cols }).map((__, j) => <Skeleton key={j} className={cx("h-3.5", j === 0 ? "w-28" : "flex-1")} />)}
        </div>
      ))}
    </div>
  );
}

export function ErrorNote({ error, className }) {
  if (!error) return null;
  return (
    <div role="alert" className={cx("flex items-start gap-2.5 rounded-xl bg-danger-wash px-3.5 py-3 text-sm text-danger", className)}>
      <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
      <span>{error.message || String(error)}</span>
    </div>
  );
}

export function Pagination({ page, count, pageSize = 50, onPage }) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  if (count <= pageSize) return count ? <p className="mt-3 text-xs text-muted">{count} {count === 1 ? "row" : "rows"}</p> : null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(count, page * pageSize);
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <p className="text-[13px] text-muted"><span className="font-semibold text-ink-2">{from}–{to}</span> of {count.toLocaleString()}</p>
      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="line" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <span className="px-2 text-[13px] tabular-nums text-muted">{page} / {pages}</span>
        <Button size="sm" variant="line" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

/** Segmented control: the modern replacement for underline tabs. */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-paper-2 p-1">
      {tabs.map((t) => (
        <button
          key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cx(
            "whitespace-nowrap rounded-lg px-3.5 py-1.5 text-[13.5px] font-semibold transition-all",
            value === t.value ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink",
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 text-[11px] text-faint">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** A label/value row. */
export function Leader({ label, children, strong, className }) {
  return (
    <div className={cx("flex items-baseline justify-between gap-4 border-b border-rule py-2.5 text-sm last:border-0", strong && "font-bold", className)}>
      <span className={strong ? "text-ink" : "text-muted"}>{label}</span>
      <span className="text-right font-semibold text-ink">{children}</span>
    </div>
  );
}

/* ---------------------------------------------------------------- overlays */
function useEscape(onClose, active) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, active]);
}

export function Drawer({ open, onClose, title, eyebrow, children, footer, width = "max-w-xl" }) {
  useEscape(onClose, open);
  const panel = useRef(null);
  useEffect(() => { if (open) panel.current?.focus(); }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end sm:p-3">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={onClose} />
      <aside
        ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}
        className={cx("relative flex h-full w-full flex-col overflow-hidden bg-card shadow-lift outline-none sm:rounded-2xl animate-[rise_.25s_ease-out]", width)}
      >
        <div className="flex items-start justify-between gap-4 border-b border-rule px-6 py-5">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
            <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          </div>
          <button onClick={onClose} className="-mr-2 rounded-lg p-2 text-muted hover:bg-paper-2 hover:text-ink" aria-label="Close"><Icon name="close" className="size-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-rule bg-paper/60 px-6 py-4">{footer}</div>}
      </aside>
    </div>,
    document.body,
  );
}

export function Modal({ open, onClose, title, children, footer }) {
  useEscape(onClose, open);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-lift animate-rise">
        <div className="px-6 pt-6">
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          <div className="mt-3 text-sm text-ink-2">{children}</div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-rule bg-paper/60 px-6 py-4">{footer}</div>
      </div>
    </div>,
    document.body,
  );
}

/* ---------------------------------------------------------------- toasts */
const ToastContext = createContext(() => {});
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, tone = "ok") => {
    const id = Math.random().toString(36).slice(2);
    setItems((xs) => [...xs, { id, message, tone }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2" aria-live="polite">
          {items.map((t) => (
            <div key={t.id} className={cx("pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lift animate-rise", t.tone === "error" ? "bg-danger text-white" : "bg-ink text-white")}>
              <Icon name={t.tone === "error" ? "alert" : "check"} className="size-4 shrink-0" />
              {t.message}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);

/* ---------------------------------------------------------------- hooks */
export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
