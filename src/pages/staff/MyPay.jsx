import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAll } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { date, EMPLOYMENT_LABEL, greeting, initials, num, pctChange, period } from "../../lib/format";
import { useMyProfile } from "../../lib/queries";
import { Donut, MonthBars, RECORD_KEYS, SERIES } from "../../components/charts";
import { useDownloadPayslip } from "../../components/records";
import { Button, cx, Empty, ErrorNote, Icon, Leader, Money, PageHeader, Section, Skeleton, StatTile } from "../../components/ui";

const EARNINGS = [
  ["basic_salary", "Basic salary"], ["housing_allowance", "Housing allowance"], ["transport_allowance", "Transport allowance"],
  ["research_allowance", "Research allowance"], ["medical_allowance", "Medical allowance"],
];
const DEDUCTIONS = [
  ["pension_employee", "Pension (8%)", "#2F5DB0"], ["paye_tax", "PAYE tax", "#C9502A"],
  ["cooperative_dues", "Cooperative dues", "#8E4AA0"], ["loan_repayment", "Loan repayment", "#A87D0E"],
];

/** The big green card: this month's net pay and the one action people come here for. */
function HeroCard({ record, profile, onDownload, downloading, delta, onBreakdown }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-moss-deep p-6 text-white shadow-lift sm:p-8">
      {/* decorative rings */}
      <svg aria-hidden className="absolute -right-16 -top-20 size-80 text-white/[0.06]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="18">
        <circle cx="100" cy="100" r="40" /><circle cx="100" cy="100" r="80" />
      </svg>
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-marker px-2.5 py-1 text-[12px] font-bold text-moss-deep">
            <Icon name="check" className="size-3.5" strokeWidth={2.4} /> Paid
          </span>
          <span className="text-[13px] font-semibold text-white/70">{period(record.period_year, record.period_month)}</span>
        </div>
        <p className="mt-6 text-[13px] font-semibold text-white/70">Net pay</p>
        <Money value={record.net_pay} className="mt-1 block text-[2.6rem] font-extrabold leading-none tracking-[-0.04em] sm:text-[3.25rem]" koboClass="text-white/50" />
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] text-white/75">
          <Icon name="bank" className="size-4" />
          {profile.bank_name || "Your bank account"} <span className="tabular-nums">{profile.account_number}</span>
          {delta !== null && Math.abs(delta) >= 0.05 && (
            <span className={cx("ml-1 rounded-full px-2 py-0.5 text-[12px] font-bold", delta > 0 ? "bg-marker/20 text-marker" : "bg-white/10 text-white")}>
              {delta > 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% vs last month
            </span>
          )}
        </p>

        <div className="mt-7 grid grid-cols-3 gap-3 rounded-2xl bg-white/[0.07] p-4">
          {[["Gross", record.gross_earnings], ["Deductions", record.total_deductions], ["Employer pension", record.pension_employer]].map(([l, v]) => (
            <div key={l} className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-white/60">{l}</p>
              <Money value={v} hideKobo className="mt-1 block truncate text-[15px] font-bold sm:text-[17px]" />
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="lime" size="lg" onClick={onDownload} loading={downloading} icon={<Icon name="download" />}>Download payslip</Button>
          <Button size="lg" className="bg-white/10 text-white hover:bg-white/15" variant="ghost" onClick={onBreakdown}>See breakdown</Button>
        </div>
      </div>
    </div>
  );
}

function BreakdownRows({ rows, record, total, colorOf }) {
  return (
    <ul className="space-y-3.5">
      {rows.filter(([k]) => num(record[k]) > 0).map(([k, label, color]) => (
        <li key={k}>
          <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
            <span className="font-medium text-ink-2">{label}</span>
            <Money value={record[k]} className="font-bold" />
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-2">
            <div className="h-full rounded-full" style={{ width: `${(num(record[k]) / total) * 100}%`, background: color || colorOf }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function MyPay() {
  const { user } = useAuth();
  const profile = useMyProfile();
  const p = profile.data;
  const records = useQuery({
    queryKey: ["records", "mine", p?.staff_id],
    // staff_id narrows a manager's view to their own slips; for staff the server already does.
    queryFn: () => fetchAll("payroll/records/", { staff_id: p.staff_id }),
    enabled: !!p,
  });
  const [selectedId, setSelectedId] = useState(null);
  const [downloadPdf, busy] = useDownloadPayslip();
  const breakdownRef = useRef(null);

  const list = records.data ?? [];
  const current = list.find((r) => r.id === selectedId) ?? list[0];
  const previous = current && list[list.indexOf(current) + 1];
  const year = current?.period_year;
  const yearRows = useMemo(() => list.filter((r) => r.period_year === year), [list, year]);
  const ytd = useMemo(() => {
    const sum = (k) => yearRows.reduce((a, r) => a + num(r[k]), 0);
    return { n: yearRows.length, gross: sum("gross_earnings"), net: sum("net_pay"), paye: sum("paye_tax"), pension: sum("pension_employee") + sum("pension_employer") };
  }, [yearRows]);
  const firstName = user.first_name || user.username;

  if (profile.isLoading) return <div className="space-y-6"><Skeleton className="h-16 w-1/2" /><Skeleton className="h-80 w-full rounded-3xl" /></div>;
  if (profile.error) return <ErrorNote error={profile.error} />;
  if (!p) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="My pay" title={`${greeting()}, ${firstName}`} />
        <Empty title="No staff profile linked">Your sign-in isn&rsquo;t attached to a staff record, so there are no payslips to show. The Bursary can link one for you.</Empty>
      </div>
    );
  }

  const delta = current && previous ? pctChange(current.net_pay, previous.net_pay) : null;
  const donutParts = current ? SERIES.map((s) => ({ ...s, v: num(current[RECORD_KEYS[s.key]]) })) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${p.staff_id} · ${p.designation}`}
        title={`${greeting()}, ${firstName}`}
        actions={current && current !== list[0] && <Button variant="line" onClick={() => setSelectedId(null)}>Back to latest</Button>}
      >
        {current ? "Here’s your pay at a glance. Pick any month below to see its payslip." : "No payslips have been issued to you yet."}
      </PageHeader>

      <ErrorNote error={records.error} />
      {records.isLoading ? <Skeleton className="h-80 w-full rounded-3xl" /> : !current ? (
        <Empty title="Nothing issued yet">Your first payslip will appear here after the next pay run. You&rsquo;ll get an email when it&rsquo;s ready.</Empty>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <HeroCard
                record={current} profile={p} delta={delta}
                onDownload={() => downloadPdf(current)} downloading={busy === current.id}
                onBreakdown={() => breakdownRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-5">
              <StatTile icon="wallet" tone="moss" label={`Net received · ${year}`} value={<Money value={ytd.net} hideKobo />} foot={`Across ${ytd.n} payslip${ytd.n === 1 ? "" : "s"}`} />
              <StatTile icon="tax" tone="terra" label="PAYE paid" value={<Money value={ytd.paye} hideKobo />} foot={`${((ytd.paye / Math.max(1, ytd.gross)) * 100).toFixed(1)}% of gross this year`} />
              <StatTile icon="piggy" tone="azure" label="Pension saved" value={<Money value={ytd.pension} hideKobo />} foot="Yours + the University’s, this year" />
              <StatTile icon="trend" tone="plum" label={`Grade · ${p.salary_scale}`} value={<span className="tabular-nums">{p.grade_level}<span className="text-faint">/</span>{p.step}</span>} foot={`${EMPLOYMENT_LABEL[p.employment_type]} · since ${date(p.date_of_employment, { month: "short", year: "numeric" })}`} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <Section className="xl:col-span-7" title="Net pay by month" aside="Tap a month to open it">
              <MonthBars rows={[...yearRows].reverse()} valueKey="net_pay" selected={current.id} onSelect={(r) => setSelectedId(r.id)} height={230} />
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-rule pt-5">
                {[["Average a month", ytd.net / Math.max(1, ytd.n)], [`Gross · ${year}`, ytd.gross], [`Deductions · ${year}`, ytd.gross - ytd.net]].map(([l, v]) => (
                  <div key={l} className="min-w-0 rounded-xl bg-paper px-3 py-2.5">
                    <p className="truncate text-[12px] font-semibold text-muted">{l}</p>
                    <Money value={v} hideKobo className="mt-0.5 block truncate text-[15px] font-bold" />
                  </div>
                ))}
              </div>
            </Section>
            <Section className="xl:col-span-5" title="Where your pay went" aside={period(current.period_year, current.period_month, true)}>
              <Donut parts={donutParts} />
            </Section>
          </div>

          <div ref={breakdownRef} className="grid scroll-mt-6 grid-cols-1 gap-6 xl:grid-cols-12">
            <Section className="xl:col-span-7" title={`Payslip breakdown · ${period(current.period_year, current.period_month)}`}
              aside={<button onClick={() => downloadPdf(current)} className="inline-flex items-center gap-1.5 font-semibold text-moss hover:underline"><Icon name="download" /> PDF</button>}>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <div className="mb-4 flex items-baseline justify-between rounded-xl bg-moss-wash px-3.5 py-2.5">
                    <span className="text-[13px] font-bold text-moss-deep">Earnings</span>
                    <Money value={current.gross_earnings} className="font-extrabold text-moss-deep" koboClass="text-moss/60" />
                  </div>
                  <BreakdownRows rows={EARNINGS} record={current} total={num(current.gross_earnings)} colorOf="#1E7A50" />
                </div>
                <div>
                  <div className="mb-4 flex items-baseline justify-between rounded-xl bg-terra-wash px-3.5 py-2.5">
                    <span className="text-[13px] font-bold text-terra">Deductions</span>
                    <Money value={current.total_deductions} className="font-extrabold text-terra" koboClass="text-terra/60" />
                  </div>
                  <BreakdownRows rows={DEDUCTIONS} record={current} total={num(current.gross_earnings)} />
                </div>
              </div>
              <p className="mt-6 rounded-xl bg-paper px-3.5 py-2.5 text-[12.5px] text-muted">
                PAYE was worked out on an annual taxable income of <Money value={current.annual_taxable_income} className="font-semibold text-ink-2" />, after pension and rent relief.
              </p>
            </Section>

            <Section className="xl:col-span-5" title="Your record">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-moss text-[15px] font-bold text-white">{initials(p.full_name)}</span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold">{p.full_name}</p>
                  <p className="truncate text-[13px] text-muted">{p.designation} · {p.department_name}</p>
                </div>
              </div>
              <Leader label="Staff ID"><span className="tabular-nums">{p.staff_id}</span></Leader>
              <Leader label="Faculty / unit">{p.faculty_name}</Leader>
              <Leader label="Grading"><span className="tabular-nums">{p.salary_scale} · GL {p.grade_level}, step {p.step}</span></Leader>
              <Leader label="Employed since">{date(p.date_of_employment)}</Leader>
              <Leader label="Paid into">{p.bank_name} <span className="tabular-nums">{p.account_number}</span></Leader>
              <p className="mt-4 text-[12.5px] text-muted">Something wrong? Contact the Bursary. Corrections apply from the next pay run.</p>
            </Section>
          </div>

          <Section plain title="Payslip history" aside={`${list.length} payslips`}>
            <div className="overflow-x-auto">
              <table className="ledger-table min-w-[640px]">
                <thead><tr><th>Period</th><th>Status</th><th className="num">Gross</th><th className="num">Deductions</th><th className="num">Net pay</th><th className="w-14" /></tr></thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.id} data-clickable onClick={() => { setSelectedId(r.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className={cx(r.id === current.id && "bg-moss-wash/50")}>
                      <td>
                        <span className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-xl bg-paper-2 text-[11px] font-bold text-ink-2">{period(r.period_year, r.period_month, true).slice(0, 3)}</span>
                          <span className="font-semibold">{period(r.period_year, r.period_month)}</span>
                        </span>
                      </td>
                      <td><span className="inline-flex items-center gap-1.5 rounded-full bg-moss-wash px-2.5 py-1 text-[12px] font-semibold text-moss"><span className="size-1.5 rounded-full bg-current" />Paid</span></td>
                      <td className="num"><Money value={r.gross_earnings} /></td>
                      <td className="num text-muted"><Money value={r.total_deductions} /></td>
                      <td className="num font-bold"><Money value={r.net_pay} /></td>
                      <td>
                        <button onClick={(e) => { e.stopPropagation(); downloadPdf(r); }} disabled={busy === r.id}
                          className="rounded-lg p-2 text-muted hover:bg-moss-wash hover:text-moss" aria-label={`Download ${period(r.period_year, r.period_month)} payslip`}>
                          <Icon name="download" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
