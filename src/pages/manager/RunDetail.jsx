import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { api } from "../../lib/api";
import { count, dateTime, duration, num, period } from "../../lib/format";
import { useFaculties } from "../../lib/queries";
import { RecordsTable } from "../../components/records";
import { NewRunDrawer } from "../../components/payroll";
import { Button, cx, ErrorNote, Icon, Input, Leader, Modal, Money, PageHeader, Section, Skeleton, Stamp, Tag, useDebounced, useToast } from "../../components/ui";
import { scopeLabel } from "./Runs";

function Tally({ batch }) {
  const total = Math.max(1, batch.total_staff);
  const parts = [
    ["Paid in this run", batch.processed_count, "bg-moss"],
    ["Already paid · skipped", batch.skipped_count, "bg-rule-strong"],
    ["Failed", batch.failed_count, "bg-danger"],
  ];
  const reconciled = batch.processed_count + batch.skipped_count + batch.failed_count === batch.total_staff;
  return (
    <div>
      <div className="flex h-4 w-full gap-[2px] bg-paper-2">
        {parts.filter(([, v]) => v > 0).map(([l, v, c]) => <div key={l} className={c} style={{ width: `${(v / total) * 100}%` }} title={`${l}: ${v}`} />)}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-y-4 sm:grid-cols-4">
        <div><dt className="eyebrow">In scope</dt><dd className="mt-1 tabular-nums text-2xl">{count(batch.total_staff)}</dd></div>
        {parts.map(([l, v, c]) => (
          <div key={l}>
            <dt className="eyebrow flex items-center gap-1.5"><span className={cx("size-2", c)} />{l}</dt>
            <dd className={cx("mt-1 tabular-nums text-2xl", l === "Failed" && v > 0 && "text-danger")}>{count(v)}</dd>
          </div>
        ))}
      </dl>
      {["COMPLETED", "COMPLETED_WITH_ERRORS"].includes(batch.status) && (
        <p className={cx("mt-4 flex items-center gap-2 text-[13px]", reconciled ? "text-moss" : "text-danger")}>
          <Icon name={reconciled ? "check" : "alert"} className="size-4" strokeWidth={2} />
          {reconciled ? "Reconciled: every person in scope is accounted for." : "Does not reconcile. See the error log."}
        </p>
      )}
    </div>
  );
}

export default function RunDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const { data: faculties } = useFaculties();
  const [confirmFail, setConfirmFail] = useState(false);
  const [rerun, setRerun] = useState(null);
  const [search, setSearch] = useState("");
  const staffId = useDebounced(search.trim().toUpperCase(), 350);

  const q = useQuery({
    queryKey: ["batches", id],
    queryFn: () => api(`payroll/batches/${id}/`),
    refetchInterval: (query) => (["PENDING", "PROCESSING"].includes(query.state.data?.status) ? 1500 : false),
  });

  const markFailed = useMutation({
    mutationFn: () => api(`payroll/batches/${id}/mark-failed/`, { method: "POST" }),
    onSuccess: (b) => {
      qc.setQueryData(["batches", id], b);
      qc.invalidateQueries({ queryKey: ["batches"] });
      setConfirmFail(false);
      toast("Run marked as failed. The period can be run again.");
    },
    onError: (e) => toast(e.message, "error"),
  });

  if (q.isLoading) return <div className="space-y-6"><Skeleton className="h-24 w-2/3" /><Skeleton className="h-40 w-full" /></div>;
  if (q.error) return <ErrorNote error={q.error.status === 404 ? new Error("This pay run doesn’t exist.") : q.error} />;
  const b = q.data;
  const running = ["PENDING", "PROCESSING"].includes(b.status);
  const canRerun = ["COMPLETED_WITH_ERRORS", "FAILED"].includes(b.status);
  const staffErrors = b.error_log.filter((e) => e.staff_id);
  const batchErrors = b.error_log.filter((e) => !e.staff_id);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/app/runs" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><Icon name="back" className="size-3.5" /> Pay runs</Link>
        <PageHeader
          eyebrow={<span className="flex flex-wrap items-center gap-3">Pay run <span className="normal-case tracking-normal">{b.id}</span></span>}
          title={period(b.period_year, b.period_month)}
          actions={<>
            {running && <Button variant="danger" onClick={() => setConfirmFail(true)}>Mark as failed</Button>}
            {canRerun && <Button variant="moss" icon={<Icon name="refresh" />} onClick={() => setRerun({ year: b.period_year, month: b.period_month, facultyIds: b.faculties })}>Run again</Button>}
          </>}
        >
          <span className="flex flex-wrap items-center gap-3">
            <Stamp status={b.status} />
            <span>{scopeLabel(b.faculties, faculties)}</span>
            <span className="text-muted">· triggered by {b.initiated_by}</span>
          </span>
        </PageHeader>
      </div>

      {running && (
        <div className="flex items-center gap-3 border border-azure/40 bg-card px-4 py-3 text-sm text-azure">
          <span className="size-2 animate-pulse rounded-full bg-azure" />
          This run is {b.status === "PENDING" ? "queued" : "being processed"}. The page updates on its own.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Section n={1} title="Who was accounted for"><Tally batch={b} /></Section>
        <Section n={2} title="Totals">
          <Leader label="Gross earnings"><Money value={b.total_gross} /></Leader>
          <Leader label="Deductions"><Money value={b.total_deductions} /></Leader>
          <Leader label="Net paid" strong className="border-t border-ink mt-1 pt-2"><Money value={b.total_net} koboClass="text-muted" /></Leader>
          <Leader label="Average net per person"><Money value={num(b.total_net) / Math.max(1, b.processed_count)} /></Leader>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Section n={3} title="Timeline">
          <ol className="relative ml-1 space-y-5 border-l border-rule-strong pl-5">
            {[["Triggered", b.created_at], ["Started", b.started_at], [running ? "Finishing…" : "Finished", b.completed_at]].map(([l, t]) => (
              <li key={l} className="relative">
                <span className={cx("absolute -left-[25px] top-1.5 size-2.5 rounded-full border-2 border-paper", t ? "bg-ink" : "bg-rule-strong")} />
                <p className="text-[13px] font-medium">{l}</p>
                <p className="tabular-nums text-[12px] text-muted">{t ? dateTime(t) : "—"}</p>
              </li>
            ))}
          </ol>
          <p className="mt-5 tabular-nums text-[12px] text-muted">Duration {duration(b.started_at, b.completed_at)}</p>
        </Section>
        <Section n={4} title="Error log" aside={b.error_log.length ? `${b.error_log.length} ${b.error_log.length === 1 ? "entry" : "entries"}` : null}>
          {!b.error_log.length ? (
            <p className="flex items-center gap-2 text-sm text-moss"><Icon name="check" strokeWidth={2} /> Clean run. Nothing was logged.</p>
          ) : (
            <ul className="divide-y divide-rule border-y border-rule">
              {batchErrors.map((e, i) => (
                <li key={`b${i}`} className="flex gap-3 py-3 text-sm"><Tag className="border-danger text-danger">Batch</Tag><span>{e.error}</span></li>
              ))}
              {staffErrors.map((e, i) => (
                <li key={i} className="flex flex-col gap-1.5 py-3 text-sm sm:flex-row sm:gap-3">
                  <button className="self-start" onClick={() => setSearch(e.staff_id)} title="Show this person’s record below"><Tag className="hover:border-ink">{e.staff_id}</Tag></button>
                  <span className="text-ink-2">{e.error}</span>
                </li>
              ))}
            </ul>
          )}
          {staffErrors.length > 0 && (
            <p className="mt-3 text-[12.5px] text-muted">Fix the staff record or pay rule, then <strong className="font-medium text-ink">Run again</strong>: only the people who failed will be paid.</p>
          )}
        </Section>
      </div>

      <Section n={5} title="Payslips written by this run" aside={<span className="tabular-nums">{count(b.processed_count)}</span>}>
        <div className="mb-4 max-w-xs">
          <Input placeholder="Filter by staff ID, e.g. UI/AC/2951" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <RecordsTable params={{ batch: b.id, staff_id: staffId || undefined }} showPeriod={false}
          emptyText={staffId ? `No payslip for ${staffId} in this run.` : "This run didn’t write any payslips."} />
      </Section>

      <Modal open={confirmFail} onClose={() => setConfirmFail(false)} title="Mark this run as failed?"
        footer={<><Button variant="ghost" onClick={() => setConfirmFail(false)}>Keep waiting</Button><Button variant="danger" loading={markFailed.isPending} onClick={() => markFailed.mutate()}>Mark as failed</Button></>}>
        Use this when a worker has died and the run is stuck. Payslips already written stay; running the period again pays only the people who were missed.
      </Modal>
      <NewRunDrawer open={!!rerun} onClose={() => setRerun(null)} initial={rerun} />
    </div>
  );
}
