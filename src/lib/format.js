export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

const nf2 = new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

export const num = (v) => (v === null || v === undefined || v === "" ? 0 : Number(v));

/** "₦1,234,567.89" */
export function naira(v) {
  const n = num(v);
  return `${n < 0 ? "−" : ""}₦${nf2.format(Math.abs(n))}`;
}

/** Split for display: { whole: "₦1,234,567", kobo: ".89" } */
export function nairaParts(v) {
  const [whole, kobo] = naira(v).split(".");
  return { whole, kobo: `.${kobo}` };
}

/** "₦127.7m", "₦448k" */
export function compact(v) {
  const n = num(v);
  const abs = Math.abs(n);
  if (abs >= 1e9) return `₦${(n / 1e9).toFixed(2)}bn`;
  if (abs >= 1e6) return `₦${(n / 1e6).toFixed(abs >= 1e8 ? 0 : 1)}m`;
  if (abs >= 1e3) return `₦${(n / 1e3).toFixed(0)}k`;
  return `₦${nf0.format(n)}`;
}

export const count = (v) => nf0.format(num(v));

export const period = (year, month, short = false) => `${(short ? MONTHS_SHORT : MONTHS)[month - 1]} ${year}`;

export function date(value, opts = { day: "numeric", month: "short", year: "numeric" }) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", opts);
}

export function dateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function relative(value) {
  if (!value) return "—";
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} d ago`;
  return date(value);
}

export function duration(start, end) {
  if (!start || !end) return "—";
  const s = Math.max(0, Math.round((new Date(end) - new Date(start)) / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function pctChange(curr, prev) {
  const a = num(curr), b = num(prev);
  if (!b) return null;
  return ((a - b) / b) * 100;
}

export const initials = (name = "") =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "·";

export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export const SCALE_LABEL = { CONUASS: "CONUASS", CONTISS: "CONTISS", CONPCASS: "CONPCASS" };
export const EMPLOYMENT_LABEL = { ACADEMIC: "Academic", NON_ACADEMIC: "Non-academic" };
export const ALLOWANCE_LABEL = { HOUSING: "Housing", TRANSPORT: "Transport", RESEARCH: "Research", MEDICAL: "Medical" };
