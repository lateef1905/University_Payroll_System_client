import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, fetchAll } from "../../lib/api";
import { ALLOWANCE_LABEL, compact, naira, num } from "../../lib/format";
import {
  Button, cx, Empty, ErrorNote, Icon, Input, Modal, Money, PageHeader, Section, Select, Skeleton, Stamp, Tabs, Toggle, useToast,
} from "../../components/ui";

export default function PayRules() {
  const [tab, setTab] = useState("scales");
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Configuration" title="Pay rules">
        The inputs every pay run reads. Every edit is recorded in the audit trail. Payslips already issued are never rewritten.
      </PageHeader>
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: "scales", label: "Salary scales" },
        { value: "allowances", label: "Allowances" },
        { value: "tax", label: "PAYE tax bands" },
      ]} />
      {tab === "scales" && <Scales />}
      {tab === "allowances" && <Allowances />}
      {tab === "tax" && <TaxBands />}
    </div>
  );
}

/* ------------------------------------------------------------------ salary scale matrix */
function Scales() {
  const qc = useQueryClient();
  const toast = useToast();
  const [scale, setScale] = useState("CONUASS");
  const [editing, setEditing] = useState(null);
  const [value, setValue] = useState("");
  const q = useQuery({ queryKey: ["scales"], queryFn: () => fetchAll("payroll/salary-scales/"), staleTime: 60_000 });

  const rows = useMemo(() => (q.data ?? []).filter((r) => r.scale === scale), [q.data, scale]);
  const grades = [...new Set(rows.map((r) => r.grade_level))].sort((a, b) => a - b);
  const steps = [...new Set(rows.map((r) => r.step))].sort((a, b) => a - b);
  const cell = Object.fromEntries(rows.map((r) => [`${r.grade_level}-${r.step}`, r]));
  const max = Math.max(1, ...rows.map((r) => num(r.annual_basic)));

  const save = useMutation({
    mutationFn: () => api(`payroll/salary-scales/${editing.id}/`, { method: "PATCH", body: { annual_basic: value } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scales"] }); setEditing(null); toast("Salary row updated. It applies from the next pay run."); },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-grid grid-cols-3 gap-1 rounded-xl bg-paper-2 p-1">
          {["CONUASS", "CONTISS", "CONPCASS"].map((s) => (
            <button key={s} onClick={() => setScale(s)} className={cx("rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-all", scale === s ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink")}>{s}</button>
          ))}
        </div>
        <p className="text-[13px] text-muted">Annual basic in naira. Darker cells earn more. Select a cell to edit it.</p>
      </div>
      <ErrorNote error={q.error} />
      {q.isLoading ? <Skeleton className="h-96 w-full" /> : !rows.length ? (
        <Empty title={`No ${scale} rows loaded`}>Load the official {scale} table through the API or the admin before paying staff on this scale.</Empty>
      ) : (
        <div className="overflow-x-auto border-l border-t border-rule">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 border-b border-r border-rule bg-paper px-3 py-2 text-left tabular-nums text-[10.5px] font-normal tracking-wide text-muted">GL \ Step</th>
                {steps.map((s) => <th key={s} className="border-b border-r border-rule px-3 py-2 text-right tabular-nums text-[11px] font-normal text-muted">{s}</th>)}
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <tr key={g}>
                  <th className="sticky left-0 z-10 border-b border-r border-rule bg-paper px-3 py-2 text-left tabular-nums text-[12px] font-medium">GL {String(g).padStart(2, "0")}</th>
                  {steps.map((s) => {
                    const r = cell[`${g}-${s}`];
                    if (!r) return <td key={s} className="border-b border-r border-rule bg-paper-2/50" />;
                    const t = num(r.annual_basic) / max;
                    return (
                      <td key={s} className="border-b border-r border-rule p-0">
                        <button onClick={() => { save.reset(); setEditing(r); setValue(r.annual_basic); }}
                          className="w-full px-3 py-2 text-right tabular-nums transition-[outline] hover:outline hover:outline-2 hover:-outline-offset-2 hover:outline-ink"
                          style={{ background: `rgba(30,122,80,${0.05 + t * 0.32})` }}
                          title={`${scale} GL${g} step ${s}: ${naira(r.annual_basic)} a year, ${naira(r.monthly_basic)} a month`}>
                          {compact(r.annual_basic)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[12.5px] text-muted">Figures in this environment are illustrative placeholders. Replace them with the official tables before go-live.</p>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing && `${editing.scale} · GL ${editing.grade_level}, step ${editing.step}`}
        footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button loading={save.isPending} onClick={() => save.mutate()}>Save</Button></>}>
        <Input label="Annual basic (₦)" type="number" min="0.01" step="0.01" value={value} onChange={(e) => setValue(e.target.value)}
          hint={`Monthly basic: ${naira(num(value) / 12)}`} error={save.error?.fields?.annual_basic} autoFocus />
        {save.error && !save.error.fields?.annual_basic && <ErrorNote error={save.error} className="mt-3" />}
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ allowances */
const BLANK_RULE = { allowance_type: "HOUSING", calc_method: "PERCENT_OF_BASIC", value: "", employment_type: "ALL", salary_scale: "", min_grade: 1, max_grade: 17, is_active: true };

function Allowances() {
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const q = useQuery({ queryKey: ["allowances"], queryFn: () => fetchAll("payroll/allowance-rules/") });

  const save = useMutation({
    mutationFn: (f) => {
      const body = { ...f, salary_scale: f.salary_scale || null, min_grade: Number(f.min_grade), max_grade: Number(f.max_grade) };
      return f.id ? api(`payroll/allowance-rules/${f.id}/`, { method: "PATCH", body }) : api("payroll/allowance-rules/", { method: "POST", body });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["allowances"] }); setForm(null); toast("Allowance rule saved."); },
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));
  const fields = save.error?.fields ?? {};

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-xl text-[13px] text-muted">At most one active rule of each type may match a person. Overlapping rules are refused, because paying twice is worse than refusing.</p>
        <Button variant="line" icon={<Icon name="plus" />} onClick={() => { save.reset(); setForm({ ...BLANK_RULE }); }}>New rule</Button>
      </div>
      <ErrorNote error={q.error} />
      {q.isLoading ? <Skeleton className="h-48 w-full" /> : (
        <div className="overflow-x-auto">
          <table className="ledger-table min-w-[760px]">
            <thead><tr><th>Allowance</th><th className="num">Amount</th><th>Applies to</th><th>Grades</th><th>Status</th><th className="w-20" /></tr></thead>
            <tbody>
              {(q.data ?? []).map((r) => (
                <tr key={r.id} className={cx(!r.is_active && "text-muted")}>
                  <td className="font-medium">{ALLOWANCE_LABEL[r.allowance_type]}</td>
                  <td className="num">{r.calc_method === "PERCENT_OF_BASIC" ? `${num(r.value)}% of basic` : <><Money value={r.value} /> / mo</>}</td>
                  <td>{r.employment_type === "ALL" ? "All staff" : r.employment_type === "ACADEMIC" ? "Academic" : "Non-academic"}{r.salary_scale && <span className="tabular-nums text-[12px] text-muted"> · {r.salary_scale}</span>}</td>
                  <td className="tabular-nums text-[12px]">GL {r.min_grade}–{r.max_grade}</td>
                  <td><Stamp status={r.is_active ? "ACTIVE" : "INACTIVE"} /></td>
                  <td className="text-right"><Button size="sm" variant="ghost" onClick={() => { save.reset(); setForm({ ...r, salary_scale: r.salary_scale ?? "" }); }}>Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Edit allowance rule" : "New allowance rule"}
        footer={<><Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button><Button loading={save.isPending} onClick={() => save.mutate(form)}>Save rule</Button></>}>
        {form && (
          <div className="grid grid-cols-2 gap-4">
            <Select label="Allowance" value={form.allowance_type} onChange={set("allowance_type")}>
              {Object.entries(ALLOWANCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Select label="Method" value={form.calc_method} onChange={set("calc_method")}>
              <option value="PERCENT_OF_BASIC">% of basic</option><option value="FIXED_MONTHLY">Fixed ₦ / month</option>
            </Select>
            <Input label={form.calc_method === "PERCENT_OF_BASIC" ? "Percentage" : "Naira per month"} type="number" min="0" step="0.01" value={form.value} onChange={set("value")} error={fields.value} className="col-span-2" />
            <Select label="Employment type" value={form.employment_type} onChange={set("employment_type")}>
              <option value="ALL">All staff</option><option value="ACADEMIC">Academic</option><option value="NON_ACADEMIC">Non-academic</option>
            </Select>
            <Select label="Scale" value={form.salary_scale} onChange={set("salary_scale")}>
              <option value="">Any scale</option><option>CONUASS</option><option>CONTISS</option><option>CONPCASS</option>
            </Select>
            <Input label="From grade" type="number" min="1" max="17" value={form.min_grade} onChange={set("min_grade")} error={fields.min_grade} />
            <Input label="To grade" type="number" min="1" max="17" value={form.max_grade} onChange={set("max_grade")} error={fields.max_grade} />
            <div className="col-span-2"><Toggle checked={form.is_active} onChange={set("is_active")} label="Active: used by pay runs" /></div>
            {save.error && !Object.keys(fields).length && <ErrorNote error={save.error} className="col-span-2" />}
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ tax ladder */
function TaxBands() {
  const qc = useQueryClient();
  const toast = useToast();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [form, setForm] = useState(null);
  const q = useQuery({ queryKey: ["taxbands"], queryFn: () => fetchAll("payroll/tax-bands/") });
  const years = [...new Set([thisYear, thisYear + 1, ...(q.data ?? []).map((b) => b.tax_year)])].sort((a, b) => b - a);
  const bands = (q.data ?? []).filter((b) => b.tax_year === year).sort((a, b) => num(a.lower_bound) - num(b.lower_bound));
  useEffect(() => { setForm(null); }, [year]);

  const save = useMutation({
    mutationFn: (f) => {
      const body = { tax_year: year, lower_bound: f.lower_bound, upper_bound: f.upper_bound === "" ? null : f.upper_bound, rate_percent: f.rate_percent };
      return f.id ? api(`payroll/tax-bands/${f.id}/`, { method: "PATCH", body }) : api("payroll/tax-bands/", { method: "POST", body });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["taxbands"] }); setForm(null); toast("Tax band saved."); },
  });
  const remove = useMutation({
    mutationFn: (b) => api(`payroll/tax-bands/${b.id}/`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["taxbands"] }); toast("Tax band removed."); },
    onError: (e) => toast(e.message, "error"),
  });
  const fields = save.error?.fields ?? {};
  const maxRate = Math.max(25, ...bands.map((b) => num(b.rate_percent)));

  // Mirrors the server's validate_tax_bands, so problems show before a run is refused.
  const problem = !bands.length ? "No bands: pay runs for this year will be refused."
    : num(bands[0].lower_bound) !== 0 ? "The first band must start at ₦0."
    : bands.some((b, i) => i < bands.length - 1 && (b.upper_bound === null || num(b.upper_bound) !== num(bands[i + 1].lower_bound))) ? "Bands have a gap or overlap."
    : bands.at(-1).upper_bound !== null ? "The top band must be open-ended."
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Select label="Tax year" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-40">
          {years.map((y) => <option key={y}>{y}</option>)}
        </Select>
        <Button variant="line" icon={<Icon name="plus" />} onClick={() => { save.reset(); setForm({ lower_bound: bands.at(-1)?.upper_bound ?? "0", upper_bound: "", rate_percent: "" }); }}>Add band</Button>
      </div>
      <ErrorNote error={q.error} />
      {problem ? (
        <div className="flex items-center gap-2 border-l-2 border-warn bg-warn-wash px-3 py-2.5 text-sm text-warn"><Icon name="alert" /> {problem}</div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-moss"><Icon name="check" strokeWidth={2} /> A complete, gap-free ladder. {year} pay runs can use it.</p>
      )}

      {q.isLoading ? <Skeleton className="h-64 w-full" /> : bands.length > 0 && (
        <Section title={`The ${year} ladder`} aside="Each rate applies only to income inside its band">
          <ol className="space-y-2">
            {bands.map((b, i) => (
              <li key={b.id} className="group grid grid-cols-[minmax(0,210px)_minmax(0,1fr)_auto] items-center gap-4">
                <span className="tabular-nums text-[12.5px] text-ink-2">{compact(b.lower_bound)} – {b.upper_bound ? compact(b.upper_bound) : "above"}</span>
                <span className="flex items-center gap-3">
                  <span className="h-7 rounded-r-[3px] bg-terra transition-all" style={{ width: `${Math.max(1.5, (num(b.rate_percent) / maxRate) * 100)}%`, opacity: 0.35 + (i / bands.length) * 0.65 }} />
                  <span className="tabular-nums text-sm">{num(b.rate_percent)}%</span>
                </span>
                <span className="flex gap-1 opacity-50 group-hover:opacity-100">
                  <button className="p-1.5 hover:text-ink" title="Edit" onClick={() => { save.reset(); setForm({ ...b, upper_bound: b.upper_bound ?? "" }); }}><Icon name="edit" /></button>
                  <button className="p-1.5 hover:text-danger" title="Delete" onClick={() => remove.mutate(b)}><Icon name="trash" /></button>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-[12.5px] text-muted">Taxable income = gross × 12 − employee pension × 12 − rent relief. Monthly PAYE is the annual tax ÷ 12.</p>
        </Section>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? `Edit ${year} band` : `New ${year} band`}
        footer={<><Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button><Button loading={save.isPending} onClick={() => save.mutate(form)}>Save band</Button></>}>
        {form && (
          <div className="grid grid-cols-2 gap-4">
            <Input label="From (₦ a year)" type="number" min="0" value={form.lower_bound} onChange={(e) => setForm({ ...form, lower_bound: e.target.value })} error={fields.lower_bound} />
            <Input label="To (₦ a year)" type="number" min="0" value={form.upper_bound} onChange={(e) => setForm({ ...form, upper_bound: e.target.value })} error={fields.upper_bound} hint="Leave empty for the top band." />
            <Input label="Rate (%)" type="number" min="0" max="100" step="0.01" value={form.rate_percent} onChange={(e) => setForm({ ...form, rate_percent: e.target.value })} error={fields.rate_percent} />
            {save.error && !Object.keys(fields).length && <ErrorNote error={save.error} className="col-span-2" />}
          </div>
        )}
      </Modal>
    </div>
  );
}
