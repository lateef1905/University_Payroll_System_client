import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../lib/auth";
import { compact, count, dateTime, greeting, num, pctChange, period, relative } from "../../lib/format";
import { useAllBatches, useStats } from "../../lib/queries";
import { Donut, Legend, PayTrendChart, RankBars, SERIES, Sparkline } from "../../components/charts";
import { NewRunDrawer, PayCalendar, periodStatus } from "../../components/payroll";
import { Button, cx, Empty, ErrorNote, Icon, Money, PageHeader, Section, Skeleton, Stamp, StatTile } from "../../components/ui";

function Delta({ value, invert }) {
  if (value === null || !isFinite(value)) return <span>No prior month</span>;
  const up = value >= 0;
  const good = invert ? !up : up;
  const flat = Math.abs(value) < 0.05;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cx("rounded-full px-1.5 py-0.5 text-[11.5px] font-bold", flat ? "bg-paper-2 text-muted" : good ? "bg-moss-wash text-moss" : "bg-terra-wash text-terra")}>
        {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}%
      </span>
      vs last month
    </span>
  );
}

/** The one thing to do next, in the place the eye lands first. */
function ActionHero({ open, thisYear, thisMonth, last, headcount, onRun, latestBatch }) {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-moss-deep p-6 text-white shadow-lift sm:p-7">
      <svg aria-hidden className="absolute -bottom-24 -right-20 size-80 text-white/[0.06]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="18">
        <circle cx="100" cy="100" r="40" /><circle cx="100" cy="100" r="80" />
      </svg>
      <div className="relative">
        <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold", open ? "bg-marker text-moss-deep" : "bg-white/10 text-white")}>
          <Icon name={open ? "calendar" : "check"} className="size-3.5" strokeWidth={2.2} />
          {open ? "Action needed" : "All caught up"}
        </span>
        <h2 className="mt-5 text-[1.6rem] font-extrabold leading-tight tracking-[-0.03em] sm:text-[1.9rem]">
          {open ? <>{period(thisYear, thisMonth)} payroll is ready to run</> : <>{period(thisYear, thisMonth)} has been paid</>}
        </h2>
        <p className="mt-2 max-w-sm text-[14px] text-white/70">
          {open
            ? <>{count(headcount?.active)} active staff will be paid using today&rsquo;s pay rules. Anyone already paid is skipped automatically.</>
            : latestBatch ? <>Last run {relative(latestBatch.created_at)} by {latestBatch.initiated_by?.split(" (")[0]}.</> : null}
        </p>
      </div>
      <div className="relative mt-7 flex flex-wrap items-end justify-between gap-4">
        {open ? (
          <Button variant="lime" size="lg" onClick={onRun} icon={<Icon name="play" className="size-3.5" />}>Run {period(thisYear, thisMonth, true)} payroll</Button>
        ) : (
          <Link to={latestBatch ? `/app/runs/${latestBatch.id}` : "/app/runs"} className="inline-flex h-12 items-center gap-2 rounded-xl bg-white/10 px-5 text-[15px] font-semibold hover:bg-white/15">
            View the run <Icon name="arrow" />
          </Link>
        )}
        {last && (
          <div className="text-right">
            <p className="text-[12px] font-semibold text-white/60">Last paid · {period(last.year, last.month, true)}</p>
            <Money value={last.net} hideKobo className="text-[1.35rem] font-extrabold tracking-tight" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Overview() {
  const { user } = useAuth();
  const stats = useStats();
  const batches = useAllBatches();
  const [runFor, setRunFor] = useState(null);
  const today = new Date();
  const thisYear = today.getFullYear(), thisMonth = today.getMonth() + 1;

  const s = stats.data;
  const trend = s?.trend ?? [];
  const last = trend.at(-1);
  const prev = trend.at(-2);
  const currentOpen = batches.data ? periodStatus(batches.data, thisYear, thisMonth) === "open" : false;
  const firstName = user.first_name || user.username;
  const loading = stats.isLoading || batches.isLoading;
  const donutParts = last ? SERIES.map((x) => ({ ...x, v: num(last[x.key]) })) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        title={`${greeting()}, ${firstName}`}
        actions={<Button variant="line" icon={<Icon name="plus" />} onClick={() => setRunFor({})}>New pay run</Button>}
      >
        Here&rsquo;s where the University&rsquo;s payroll stands today.
      </PageHeader>

      <ErrorNote error={stats.error || batches.error} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-5">
          {loading ? <Skeleton className="h-full min-h-[300px] rounded-3xl" /> : (
            <ActionHero open={currentOpen} thisYear={thisYear} thisMonth={thisMonth} last={last} headcount={s?.headcount}
              latestBatch={batches.data?.[0]} onRun={() => setRunFor({ year: thisYear, month: thisMonth })} />
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-7">
          {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[146px] rounded-2xl" />) : (
            <>
              <StatTile icon="wallet" tone="moss" label={`Net paid · ${last ? period(last.year, last.month, true) : "—"}`}
                value={<span className="flex items-end justify-between gap-2"><Money value={last?.net} hideKobo /><Sparkline values={trend.map((t) => t.net)} width={72} height={26} /></span>}
                foot={last && <Delta value={pctChange(last.net, prev?.net)} />} />
              <StatTile icon="trend" tone="azure" label="Gross earnings" value={<Money value={last?.gross} hideKobo />}
                foot={last && <Delta value={pctChange(last.gross, prev?.gross)} />} />
              <StatTile icon="tax" tone="terra" label="PAYE withheld" value={<Money value={last?.paye} hideKobo />}
                foot={last && <>{((num(last.paye) / Math.max(1, num(last.gross))) * 100).toFixed(1)}% of gross · due to the tax authority</>} />
              <StatTile icon="people" tone="plum" label="Active staff" value={<span className="tabular-nums">{count(s?.headcount.active)}</span>}
                foot={s && <>{count(s.headcount.academic)} academic · {count(s.headcount.non_academic)} non-academic</>} />
            </>
          )}
        </div>
      </div>

      <Section title={`Pay calendar ${thisYear}`} icon="calendar" aside="Click an open month to run it">
        {batches.isLoading ? <Skeleton className="h-[88px] w-full" /> : (
          <PayCalendar batches={batches.data ?? []} trend={trend} year={thisYear} onRun={setRunFor} />
        )}
      </Section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Section className="xl:col-span-8" title="Payroll cost by month" icon="trend" aside={<Legend className="hidden md:flex" />}>
          <Legend className="mb-4 md:hidden" />
          {stats.isLoading ? <Skeleton className="h-[280px] w-full" /> : trend.length ? <PayTrendChart data={trend} /> : (
            <Empty title="Nothing to chart yet">Run a payroll and each month will appear here.</Empty>
          )}
        </Section>
        <Section className="xl:col-span-4" title="Where gross pay went" icon="sparkle" aside={last && period(last.year, last.month, true)}>
          {last ? (
            <>
              <Donut parts={donutParts} size={176} />
              <p className="mt-4 rounded-xl bg-paper px-3.5 py-2.5 text-[12.5px] text-muted">
                Plus <span className="font-bold text-ink-2">{compact(last.pension_employer)}</span> employer pension (10%), paid on top of gross.
              </p>
            </>
          ) : <Skeleton className="h-64 w-full" />}
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Section className="xl:col-span-7" title="Gross pay by faculty & unit" icon="building" aside={s?.period && period(s.period.year, s.period.month, true)}>
          {s?.by_faculty?.length ? (
            <RankBars rows={s.by_faculty.slice(0, 10)} label={(r) => r.name} meta={(r) => `${count(r.staff)} staff`} />
          ) : <Skeleton className="h-64 w-full" />}
          {s?.by_faculty?.length > 10 && <p className="mt-4 text-[12.5px] text-muted">Showing the 10 largest of {s.by_faculty.length}.</p>}
        </Section>

        <Section className="xl:col-span-5" title="Recent pay runs" icon="runs" aside={<Link to="/app/runs" className="font-semibold text-moss hover:underline">See all</Link>}>
          {batches.isLoading ? <Skeleton className="h-64 w-full" /> : (
            <ul className="-mx-2 space-y-1">
              {(batches.data ?? []).slice(0, 6).map((b) => (
                <li key={b.id}>
                  <Link to={`/app/runs/${b.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-paper">
                    <span className={cx("flex size-10 shrink-0 flex-col items-center justify-center rounded-xl text-[10px] font-bold leading-tight",
                      b.status === "COMPLETED" ? "bg-moss-wash text-moss" : b.status === "FAILED" ? "bg-danger-wash text-danger" : "bg-warn-wash text-warn")}>
                      <span>{period(b.period_year, b.period_month, true).slice(0, 3).toUpperCase()}</span>
                      <span className="opacity-70">{String(b.period_year).slice(2)}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold">{period(b.period_year, b.period_month)}</span>
                      <span className="block truncate text-[12px] text-muted" title={dateTime(b.created_at)}>
                        {count(b.processed_count)} paid{b.failed_count ? ` · ${b.failed_count} failed` : ""} · {relative(b.created_at)}
                      </span>
                    </span>
                    <span className="text-right">
                      <Money value={b.total_net} hideKobo className="block text-[13.5px] font-bold" />
                      <Stamp status={b.status} className="mt-1" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <NewRunDrawer open={!!runFor} onClose={() => setRunFor(null)} initial={runFor} />
    </div>
  );
}
