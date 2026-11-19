import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { api } from "../lib/api";
import { compact, MONTHS, MONTHS_SHORT, period } from "../lib/format";
import { useFaculties } from "../lib/queries";
import { Button, cx, Drawer, ErrorNote, Icon, Select } from "./ui";

const now = () => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() + 1 }; };

/** Status of one pay period, derived from all of its batches. */
export function periodStatus(batches, year, month) {
  const today = now();
  const list = batches.filter((b) => b.period_year === year && b.period_month === month)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  if (list.some((b) => b.status === "PENDING" || b.status === "PROCESSING")) return "running";
  const done = list.filter((b) => b.status === "COMPLETED" || b.status === "COMPLETED_WITH_ERRORS");
  if (done.length) {
    const corrected = done.at(-1).status === "COMPLETED" && done.some((b) => b.status === "COMPLETED_WITH_ERRORS");
    return done.at(-1).status === "COMPLETED" ? (corrected ? "corrected" : "paid") : "issues";
  }
  if (list.length) return "failed";
  return year * 12 + month <= today.year * 12 + today.month ? "open" : "future";
}

const CELL = {
  paid: ["Paid", "bg-moss-wash text-moss", "border-transparent"],
  corrected: ["Paid · re-run", "bg-moss-wash text-moss", "border-transparent"],
  issues: ["Has errors", "bg-warn-wash text-warn", "border-transparent"],
  failed: ["Failed", "bg-danger-wash text-danger", "border-transparent"],
  running: ["Running", "bg-azure-wash text-azure", "border-transparent"],
  open: ["Not run", "bg-card text-ink", "border-dashed border-moss/50"],
  future: ["Upcoming", "bg-paper text-faint", "border-transparent"],
};

/** Twelve months as tiles. An open month invites a run. */
export function PayCalendar({ batches, trend, year, onRun }) {
  const netBy = Object.fromEntries((trend || []).map((t) => [`${t.year}-${t.month}`, t.net]));
  const today = now();
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 xl:grid-cols-12">
      {MONTHS_SHORT.map((m, i) => {
        const month = i + 1;
        const status = periodStatus(batches, year, month);
        const [label, tone, border] = CELL[status];
        const isCurrent = year === today.year && month === today.month;
        const clickable = status === "open" || status === "failed" || status === "issues";
        const net = netBy[`${year}-${month}`];
        return (
          <button
            key={m} type="button" disabled={!clickable} onClick={() => clickable && onRun?.({ year, month })}
            className={cx(
              "group relative flex min-h-[84px] flex-col justify-between rounded-xl border p-2.5 text-left transition-all",
              tone, border,
              clickable && "hover:-translate-y-0.5 hover:shadow-lift",
              isCurrent && "ring-2 ring-moss ring-offset-2 ring-offset-card",
            )}
            title={clickable ? `Run ${period(year, month)} payroll` : undefined}
          >
            <span className="flex items-center justify-between">
              <span className="text-[12px] font-bold">{m}</span>
              {(status === "paid" || status === "corrected") && <Icon name="check" className="size-3.5" strokeWidth={2.4} />}
              {(status === "issues" || status === "failed") && <Icon name="alert" className="size-3.5" />}
              {status === "running" && <span className="size-2 animate-pulse rounded-full bg-current" />}
            </span>
            <span>
              {net && <span className="block text-[13px] font-bold tabular-nums text-ink">{compact(net)}</span>}
              <span className="mt-0.5 block text-[11px] font-semibold opacity-90">
                {status === "open" ? <span className="text-moss group-hover:underline">Run now →</span> : label}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function NewRunDrawer({ open, onClose, initial }) {
  const { data: faculties = [] } = useFaculties();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const today = now();
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);
  const [scope, setScope] = useState("all");
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    if (!open) return;
    setYear(initial?.year ?? today.year);
    setMonth(initial?.month ?? today.month);
    setScope(initial?.facultyIds ? "some" : "all");
    setSelected(new Set(initial?.facultyIds ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const run = useMutation({
    mutationFn: () => api("payroll/batches/", {
      method: "POST",
      body: { period_year: Number(year), period_month: Number(month), ...(scope === "all" ? { all_faculties: true } : { faculty_ids: [...selected] }) },
    }),
    onSuccess: (batch) => {
      qc.invalidateQueries({ queryKey: ["batches"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["records"] });
      onClose();
      navigate(`/app/runs/${batch.id}`);
    },
  });

  const years = useMemo(() => Array.from({ length: today.year - 2024 + 1 }, (_, i) => today.year - i), [today.year]);
  const future = year * 12 + Number(month) > today.year * 12 + today.month;
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const valid = !future && (scope === "all" || selected.size > 0);

  return (
    <Drawer
      open={open} onClose={onClose} eyebrow="New pay run" title={period(year, Number(month))}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="moss" onClick={() => run.mutate()} loading={run.isPending} disabled={!valid} icon={<Icon name="play" className="size-3.5" />}>
          Run payroll{scope === "some" && selected.size ? ` for ${selected.size} ${selected.size === 1 ? "unit" : "units"}` : ""}
        </Button>
      </>}
    >
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <Select label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </Select>
          <Select label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => <option key={y}>{y}</option>)}
          </Select>
        </div>
        {future && <ErrorNote error="Payroll can’t be run for a future month." />}

        <fieldset>
          <legend className="mb-3 text-[13px] font-semibold text-ink-2">Who to pay</legend>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-paper-2 p-1">
            {[["all", "All faculties & units"], ["some", "Selected units"]].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setScope(v)}
                className={cx("rounded-lg py-2 text-sm font-semibold transition-all", scope === v ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink")}>{l}</button>
            ))}
          </div>
          {scope === "some" && (
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-[12.5px]">
                <span className="text-muted">{selected.size} of {faculties.length} selected</span>
                <button type="button" className="underline underline-offset-2" onClick={() => setSelected(selected.size === faculties.length ? new Set() : new Set(faculties.map((f) => f.id)))}>
                  {selected.size === faculties.length ? "Clear" : "Select all"}
                </button>
              </div>
              <ul className="max-h-[340px] divide-y divide-rule overflow-y-auto rounded-xl border border-rule">
                {faculties.map((f) => (
                  <li key={f.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-paper">
                      <input type="checkbox" className="size-4 accent-moss" checked={selected.has(f.id)} onChange={() => toggle(f.id)} />
                      <span className="w-10 tabular-nums text-[11px] text-muted">{f.code}</span>
                      {f.name}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </fieldset>

        <div className="space-y-2 rounded-xl bg-moss-wash px-4 py-3 text-[13px] text-ink-2">
          <p><strong className="font-semibold text-ink">Safe to re-run.</strong> Anyone already paid for {period(year, Number(month))} is skipped, so a run can never pay a person twice.</p>
          <p>The run uses the pay rules and staff records as they are right now, and writes a frozen snapshot for each person.</p>
        </div>
        <ErrorNote error={run.error} />
      </div>
    </Drawer>
  );
}
