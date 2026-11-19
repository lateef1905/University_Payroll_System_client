import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { api } from "../../lib/api";
import { count, dateTime, duration, period } from "../../lib/format";
import { useFaculties } from "../../lib/queries";
import { TallyBar } from "../../components/charts";
import { NewRunDrawer } from "../../components/payroll";
import { Button, Empty, ErrorNote, Icon, Money, PageHeader, Pagination, Stamp, TableSkeleton } from "../../components/ui";

export function scopeLabel(ids, faculties) {
  if (faculties && ids.length >= faculties.length) return "All faculties & units";
  if (ids.length === 1) return faculties?.find((f) => f.id === ids[0])?.name ?? "1 unit";
  const codes = ids.map((id) => faculties?.find((f) => f.id === id)?.code).filter(Boolean);
  return codes.length <= 4 ? codes.join(" · ") : `${ids.length} units`;
}

export default function Runs() {
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { data: faculties } = useFaculties();
  const q = useQuery({
    queryKey: ["batches", "page", page],
    queryFn: () => api("payroll/batches/", { params: { page } }),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => query.state.data?.results?.some((b) => ["PENDING", "PROCESSING"].includes(b.status)) ? 2500 : false,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payroll"
        title="Pay runs"
        actions={<Button variant="moss" onClick={() => setCreating(true)} icon={<Icon name="plus" />}>New pay run</Button>}
      >
        Every batch ever triggered, newest first. A run that finished with errors can simply be run again:
        people already paid are skipped.
      </PageHeader>

      <ErrorNote error={q.error} />
      {q.isLoading ? <TableSkeleton cols={6} /> : !q.data?.results.length ? (
        <Empty title="No pay runs yet" action={<Button onClick={() => setCreating(true)}>Run the first payroll</Button>}>
          Start with the current month. The run takes seconds and can be repeated safely.
        </Empty>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="ledger-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Period</th><th>Scope</th><th>Status</th><th className="w-[220px]">Accounted for</th>
                  <th className="num">Net paid</th><th>Triggered</th>
                </tr>
              </thead>
              <tbody>
                {q.data.results.map((b) => (
                  <tr key={b.id} data-clickable onClick={() => navigate(`/app/runs/${b.id}`)}>
                    <td className="whitespace-nowrap">
                      <span className="block font-medium">{period(b.period_year, b.period_month)}</span>
                      <span className="tabular-nums text-[11px] text-faint">{b.id.slice(0, 8)}</span>
                    </td>
                    <td className="max-w-[200px] truncate text-ink-2">{scopeLabel(b.faculties, faculties)}</td>
                    <td><Stamp status={b.status} /></td>
                    <td>
                      <TallyBar batch={b} />
                      <span className="mt-1.5 block tabular-nums text-[11px] text-muted">
                        {count(b.processed_count)} paid · {count(b.skipped_count)} skipped
                        {b.failed_count > 0 && <span className="text-danger"> · {b.failed_count} failed</span>}
                      </span>
                    </td>
                    <td className="num"><Money value={b.total_net} hideKobo /></td>
                    <td className="whitespace-nowrap">
                      <span className="block text-[13px]">{dateTime(b.created_at)}</span>
                      <span className="text-[12px] text-muted">{b.initiated_by?.split(" (")[0]} · {duration(b.started_at, b.completed_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} count={q.data.count} onPage={setPage} />
        </>
      )}
      <NewRunDrawer open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
