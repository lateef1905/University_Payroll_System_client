import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, download } from "../lib/api";
import { period } from "../lib/format";
import { PayslipPaper } from "./brand";
import { Button, Drawer, Empty, ErrorNote, Icon, Money, Pagination, TableSkeleton, useToast } from "./ui";

export function useDownloadPayslip() {
  const toast = useToast();
  const [busy, setBusy] = useState(null);
  async function run(record) {
    setBusy(record.id);
    try {
      await download(`payroll/records/${record.id}/payslip/`);
    } catch (e) {
      toast(e.status === 429 ? "Download limit reached (60 an hour). Try again later." : e.message, "error");
    } finally {
      setBusy(null);
    }
  }
  return [run, busy];
}

export function RecordDrawer({ record, onClose }) {
  const [downloadPdf, busy] = useDownloadPayslip();
  return (
    <Drawer
      open={!!record} onClose={onClose} width="max-w-2xl"
      eyebrow={record && `${record.staff_id} · ${period(record.period_year, record.period_month)}`}
      title={record?.staff_name || "Payslip"}
      footer={record && <Button onClick={() => downloadPdf(record)} loading={busy === record.id} icon={<Icon name="download" />}>Download PDF</Button>}
    >
      {record && (
        <div className="rounded-2xl bg-paper p-3 sm:p-6">
          <PayslipPaper record={record} />
          <p className="mt-4 text-center tabular-nums text-[11px] text-muted">
            Annual taxable income used for PAYE: <Money value={record.annual_taxable_income} />
          </p>
        </div>
      )}
    </Drawer>
  );
}

/** Paginated payroll records for any filter set (batch, period, faculty, staff). */
export function RecordsTable({ params, showPeriod = true, emptyText = "No payslips match these filters." }) {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const [downloadPdf, busy] = useDownloadPayslip();
  const key = JSON.stringify(params);
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) { setLastKey(key); setPage(1); }

  const q = useQuery({
    queryKey: ["records", params, page],
    queryFn: () => api("payroll/records/", { params: { ...params, page } }),
    placeholderData: keepPreviousData,
  });

  if (q.isLoading) return <TableSkeleton cols={6} />;
  if (q.error) return <ErrorNote error={q.error} />;
  const rows = q.data.results;
  if (!rows.length) return <Empty title="Nothing here">{emptyText}</Empty>;

  return (
    <>
      <div className={`overflow-x-auto transition-opacity ${q.isFetching ? "opacity-60" : ""}`}>
        <table className="ledger-table min-w-[820px]">
          <thead>
            <tr>
              <th>Staff</th>
              {showPeriod && <th>Period</th>}
              <th>Grade</th>
              <th className="num">Gross</th>
              <th className="num">Deductions</th>
              <th className="num">Net pay</th>
              <th className="w-10"><span className="sr-only">Download</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} data-clickable onClick={() => setOpen(r)}>
                <td>
                  <span className="block font-semibold">{r.staff_name}</span>
                  <span className="tabular-nums text-[11.5px] text-muted">{r.staff_id}</span>
                </td>
                {showPeriod && <td className="whitespace-nowrap">{period(r.period_year, r.period_month, true)}</td>}
                <td className="whitespace-nowrap tabular-nums text-[12px] text-ink-2">{r.salary_scale} {String(r.grade_level).padStart(2, "0")}/{r.step}</td>
                <td className="num"><Money value={r.gross_earnings} /></td>
                <td className="num text-ink-2"><Money value={r.total_deductions} /></td>
                <td className="num font-bold"><Money value={r.net_pay} koboClass="text-muted" /></td>
                <td>
                  <button
                    onClick={(e) => { e.stopPropagation(); downloadPdf(r); }} disabled={busy === r.id}
                    className="rounded-lg p-2 text-muted hover:bg-moss-wash hover:text-moss" title="Download PDF payslip" aria-label={`Download payslip for ${r.staff_name}`}
                  >
                    <Icon name="download" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} count={q.data.count} onPage={setPage} />
      <RecordDrawer record={open} onClose={() => setOpen(null)} />
    </>
  );
}
