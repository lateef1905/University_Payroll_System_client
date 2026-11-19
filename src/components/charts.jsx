import { useEffect, useRef, useState } from "react";
import { compact, count, MONTHS_SHORT, naira, num, period } from "../lib/format";
import { cx, Money } from "./ui";

/**
 * Where each naira of gross pay goes. Fixed order and hues (validated for colour-vision
 * deficiency and contrast against the white card); never re-ordered or cycled.
 */
export const SERIES = [
  { key: "net", label: "Net pay", color: "#1E7A50" },
  { key: "pension_employee", label: "Pension", color: "#2F5DB0" },
  { key: "paye", label: "PAYE tax", color: "#C9502A" },
  { key: "cooperative", label: "Cooperative", color: "#8E4AA0" },
  { key: "loans", label: "Loans", color: "#A87D0E" },
];

/** Same series, keyed by a payroll record's own field names. */
export const RECORD_KEYS = {
  net: "net_pay", pension_employee: "pension_employee", paye: "paye_tax", cooperative: "cooperative_dues", loans: "loan_repayment",
};

function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

function niceMax(v) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * p).find((m) => m >= v);
}

/** Rect with only the top corners rounded (data ends round, the baseline stays square). */
function topRounded(x, y, w, h, r) {
  r = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export function Legend({ series = SERIES, className }) {
  return (
    <ul className={cx("flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] font-medium text-ink-2", className)}>
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: s.color }} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

function Tooltip({ left, width, w = 236, children }) {
  const x = Math.min(Math.max(left - w / 2, 0), Math.max(0, width - w));
  return (
    <div className="pointer-events-none absolute top-0 z-10 rounded-xl bg-ink p-3 text-white shadow-lift" style={{ left: x, width: w }}>
      {children}
    </div>
  );
}

/** Gross pay per period, stacked by destination. Column height = gross. */
export function PayTrendChart({ data, height = 280 }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const pad = { t: 12, r: 4, b: 30, l: 52 };
  const innerW = Math.max(0, width - pad.l - pad.r);
  const innerH = height - pad.t - pad.b;
  const max = niceMax(Math.max(0, ...data.map((d) => num(d.gross))));
  const slot = data.length ? innerW / data.length : 0;
  const barW = Math.max(8, Math.min(40, slot * 0.56));
  const y = (v) => (num(v) / max) * innerH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Monthly gross pay split into net pay and deductions">
          {ticks.map((t) => {
            const ty = pad.t + innerH - y(t);
            return (
              <g key={t}>
                <line x1={pad.l} x2={width - pad.r} y1={ty} y2={ty} stroke="#E6E9E4" strokeDasharray={t === 0 ? "" : "3 4"} />
                <text x={pad.l - 10} y={ty + 4} textAnchor="end" className="fill-faint text-[11px] font-medium">{compact(t)}</text>
              </g>
            );
          })}
          {data.map((d, i) => {
            const x = pad.l + slot * i + (slot - barW) / 2;
            let acc = 0;
            const segs = SERIES.map((s) => ({ ...s, v: num(d[s.key]) })).filter((s) => s.v > 0);
            return (
              <g key={d.period} opacity={hover === null || hover === i ? 1 : 0.35} style={{ transition: "opacity 140ms" }}>
                {segs.map((s, j) => {
                  const h = y(s.v);
                  const top = pad.t + innerH - y(acc) - h;
                  acc += s.v;
                  const drawH = Math.max(0, h - (j > 0 ? 2 : 0)); // 2px surface gap above the segment below
                  return j === segs.length - 1
                    ? <path key={s.key} d={topRounded(x, top, barW, drawH, 6)} fill={s.color} />
                    : <rect key={s.key} x={x} y={top} width={barW} height={drawH} fill={s.color} />;
                })}
                <text x={x + barW / 2} y={height - 9} textAnchor="middle" className={cx("text-[11px] font-semibold", hover === i ? "fill-ink" : "fill-faint")}>
                  {MONTHS_SHORT[d.month - 1]}
                </text>
                <rect x={pad.l + slot * i} y={pad.t} width={slot} height={innerH + 20} fill="transparent"
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}
                  aria-label={`${period(d.year, d.month)}: gross ${naira(d.gross)}, net ${naira(d.net)}`} />
              </g>
            );
          })}
        </svg>
      )}
      {hover !== null && data[hover] && (
        <Tooltip left={pad.l + slot * hover + slot / 2} width={width}>
          <div className="mb-2 flex items-baseline justify-between border-b border-white/15 pb-1.5">
            <span className="text-[13px] font-bold">{period(data[hover].year, data[hover].month)}</span>
            <span className="text-[11.5px] text-white/60">{count(data[hover].staff)} paid</span>
          </div>
          {SERIES.map((s) => (
            <div key={s.key} className="flex items-center gap-2 py-0.5 text-[12px]">
              <span className="size-2 rounded-full" style={{ background: s.color }} />
              <span className="text-white/75">{s.label}</span>
              <span className="ml-auto font-semibold tabular-nums">{compact(data[hover][s.key])}</span>
            </div>
          ))}
          <div className="mt-1.5 flex justify-between border-t border-white/15 pt-1.5 text-[12px] font-bold">
            <span>Gross</span><span className="tabular-nums">{compact(data[hover].gross)}</span>
          </div>
        </Tooltip>
      )}
    </div>
  );
}

/**
 * Donut of where a gross amount goes. `parts` = [{key,label,color,v}].
 * Hovering a slice or a legend row highlights both; the centre shows the focused value.
 */
export function Donut({ parts, centerLabel = "Gross", size = 188, thickness = 22 }) {
  const [hover, setHover] = useState(null);
  const total = parts.reduce((a, p) => a + p.v, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const gap = parts.filter((p) => p.v > 0).length > 1 ? 3 : 0; // surface gap between slices
  let offset = 0;
  const focus = parts.find((p) => p.key === hover);

  return (
    <div className="@container">
    <div className="flex flex-col items-center gap-5 @[30rem]:flex-row">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label="Share of gross pay">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF0EC" strokeWidth={thickness} />
          {parts.filter((p) => p.v > 0).map((p) => {
            const len = (p.v / total) * c;
            const el = (
              <circle key={p.key} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth={hover === p.key ? thickness + 4 : thickness}
                strokeDasharray={`${Math.max(0, len - gap)} ${c}`} strokeDashoffset={-offset}
                opacity={hover && hover !== p.key ? 0.3 : 1} style={{ transition: "opacity 140ms, stroke-width 140ms" }}
                onMouseEnter={() => setHover(p.key)} onMouseLeave={() => setHover(null)} />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[12px] font-semibold text-muted">{focus ? focus.label : centerLabel}</span>
          <span className="mt-0.5 text-[1.15rem] font-bold tracking-tight tabular-nums">{compact(focus ? focus.v : total)}</span>
          {focus && <span className="text-[12px] font-semibold text-muted">{((focus.v / total) * 100).toFixed(1)}%</span>}
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-1">
        {parts.map((p) => (
          <li key={p.key} onMouseEnter={() => setHover(p.key)} onMouseLeave={() => setHover(null)}
            className={cx("flex items-center gap-3 rounded-lg px-2 py-1.5 text-[13.5px] transition-colors", hover === p.key && "bg-paper")}>
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
            <span className="flex-1 truncate font-medium text-ink-2">{p.label}</span>
            <span className="w-12 text-right text-[12px] font-semibold tabular-nums text-faint">{((p.v / total) * 100).toFixed(0)}%</span>
            <Money value={p.v} hideKobo className="w-24 text-right font-bold" />
          </li>
        ))}
      </ul>
    </div>
    </div>
  );
}

/** Single-series monthly columns (e.g. one person's net pay). The selected month is solid. */
export function MonthBars({ rows, valueKey, selected, onSelect, height = 200, color = "#1E7A50" }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const pad = { t: 28, b: 26 };
  const innerH = height - pad.t - pad.b;
  const max = Math.max(1, ...rows.map((r) => num(r[valueKey])));
  const slot = rows.length ? width / rows.length : 0;
  const barW = Math.max(8, Math.min(34, slot * 0.55));
  const active = hover ?? rows.findIndex((r) => r.id === selected);

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Net pay by month">
          <line x1={0} x2={width} y1={pad.t + innerH} y2={pad.t + innerH} stroke="#E6E9E4" />
          {rows.map((r, i) => {
            const h = Math.max(4, (num(r[valueKey]) / max) * innerH * 0.92);
            const x = slot * i + (slot - barW) / 2;
            const on = i === active;
            return (
              <g key={r.id ?? i} className="cursor-pointer" onClick={() => onSelect?.(r)}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <rect x={slot * i} y={0} width={slot} height={height} fill="transparent" />
                <path d={topRounded(x, pad.t + innerH - h, barW, h, 6)} fill={color} opacity={on ? 1 : 0.22} style={{ transition: "opacity 140ms" }} />
                {on && <text x={x + barW / 2} y={pad.t + innerH - h - 8} textAnchor="middle" className="fill-ink text-[11.5px] font-bold">{compact(r[valueKey])}</text>}
                <text x={x + barW / 2} y={height - 7} textAnchor="middle" className={cx("text-[11px] font-semibold", on ? "fill-ink" : "fill-faint")}>
                  {MONTHS_SHORT[r.period_month - 1]}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/** Ranked horizontal bars (single series, so a single hue). Values are direct-labelled. */
export function RankBars({ rows, valueKey = "gross", label = (r) => r.name, meta, max: maxIn }) {
  const max = maxIn ?? Math.max(1, ...rows.map((r) => num(r[valueKey])));
  return (
    <ol className="space-y-3">
      {rows.map((r, i) => (
        <li key={i} className="group">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-[13.5px] font-semibold text-ink-2 group-hover:text-ink">{label(r)}</span>
            <span className="shrink-0 text-[13px] font-bold tabular-nums">{compact(r[valueKey])}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-2">
              <div className="h-full rounded-full bg-moss transition-all group-hover:bg-moss-deep" style={{ width: `${(num(r[valueKey]) / max) * 100}%` }} />
            </div>
            {meta && <span className="w-20 shrink-0 text-right text-[12px] font-medium text-faint">{meta(r)}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Sparkline({ values, width = 120, height = 32, color = "#1E7A50", className }) {
  if (!values?.length) return null;
  const nums = values.map(num);
  const min = Math.min(...nums), max = Math.max(...nums);
  const span = max - min;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  // A flat series sits mid-height rather than on the floor.
  const pts = nums.map((v, i) => [i * step, span ? height - 3 - ((v - min) / span) * (height - 6) : height / 2]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} className={className} aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

/** Segmented tally: processed / skipped / failed out of total staff in scope. */
export function TallyBar({ batch, className }) {
  const total = Math.max(1, batch.total_staff);
  const parts = [
    { v: batch.processed_count, c: "bg-moss", l: "Paid" },
    { v: batch.skipped_count, c: "bg-rule-strong", l: "Already paid" },
    { v: batch.failed_count, c: "bg-danger", l: "Failed" },
  ].filter((p) => p.v > 0);
  return (
    <div className={cx("flex h-2 w-full gap-[2px] overflow-hidden rounded-full bg-paper-2", className)} title={parts.map((p) => `${p.l}: ${p.v}`).join(" · ")}>
      {parts.map((p) => <div key={p.l} className={p.c} style={{ width: `${(p.v / total) * 100}%` }} />)}
    </div>
  );
}
