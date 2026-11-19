import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { dateTime, relative } from "../../lib/format";
import { cx, Empty, ErrorNote, Input, PageHeader, Pagination, Select, TableSkeleton, Tabs, Tag, useDebounced } from "../../components/ui";

const ACTIONS = {
  LOGIN_SUCCESS: ["Signed in", "bg-moss"],
  LOGIN_FAILED: ["Failed sign-in", "bg-danger"],
  PASSWORD_CHANGED: ["Changed password", "bg-plum"],
  BATCH_TRIGGERED: ["Triggered a pay run", "bg-azure"],
  BATCH_MARKED_FAILED: ["Marked a run failed", "bg-terra"],
  PAYSLIP_DOWNLOADED: ["Downloaded a payslip", "bg-ochre"],
};

const MODELS = [
  ["staffprofile", "Staff profiles"],
  ["salaryscale", "Salary scales"],
  ["allowancerule", "Allowance rules"],
  ["taxband", "Tax bands"],
  ["department", "Departments"],
  ["faculty", "Faculties"],
  ["user", "User accounts"],
];

const CHANGE_TONE = { created: "text-moss border-moss", updated: "text-azure border-azure", deleted: "text-danger border-danger" };

function usePaged(key, path, params) {
  const [page, setPage] = useState(1);
  const sig = JSON.stringify(params);
  const [last, setLast] = useState(sig);
  if (sig !== last) { setLast(sig); setPage(1); }
  const q = useQuery({ queryKey: [key, params, page], queryFn: () => api(path, { params: { ...params, page } }), placeholderData: keepPreviousData });
  return [q, page, setPage];
}

export default function Audit() {
  const { isSuper } = useAuth();
  const [tab, setTab] = useState("changes");
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Oversight" title="Audit trail">
        Two read-only records: <strong className="font-semibold">change history</strong> (who changed which pay data, from what, to what)
        {isSuper && <> and the <strong className="font-semibold">activity log</strong> (sign-ins, pay runs, payslip access)</>}. Neither can be edited or deleted.
      </PageHeader>
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "changes", label: "Change history" }, ...(isSuper ? [{ value: "activity", label: "Activity log" }] : [])]} />
      {tab === "changes" ? <Changes isSuper={isSuper} /> : <Activity />}
    </div>
  );
}

function fmtValue(v) {
  if (v === null || v === undefined || v === "") return "∅";
  if (typeof v === "boolean") return v ? "yes" : "no";
  return String(v);
}

function Changes({ isSuper }) {
  const [model, setModel] = useState("staffprofile");
  const [objectId, setObjectId] = useState("");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const oid = useDebounced(objectId.trim(), 300);
  const [q, page, setPage] = usePaged("changes", "audit/changes/", { model, object_id: /^\d+$/.test(oid) ? oid : undefined, since, until });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Select label="Record type" value={model} onChange={(e) => setModel(e.target.value)}>
          {MODELS.filter(([m]) => isSuper || m !== "user").map(([m, l]) => <option key={m} value={m}>{l}</option>)}
        </Select>
        <Input label="Record ID" inputMode="numeric" placeholder="Any" value={objectId} onChange={(e) => setObjectId(e.target.value)} />
        <Input label="From" type="date" value={since} onChange={(e) => setSince(e.target.value)} />
        <Input label="To" type="date" value={until} onChange={(e) => setUntil(e.target.value)} />
      </div>
      <ErrorNote error={q.error} />
      {q.isLoading ? <TableSkeleton rows={6} cols={3} /> : !q.data?.results.length ? <Empty title="No changes recorded">Nothing matches these filters.</Empty> : (
        <>
          <ol className={cx("divide-y divide-rule border-y border-rule transition-opacity", q.isFetching && "opacity-60")}>
            {q.data.results.map((c) => (
              <li key={c.history_id} className="grid grid-cols-1 gap-x-8 gap-y-3 py-4 md:grid-cols-[230px_minmax(0,1fr)]">
                <div>
                  <p className="text-[13px] font-medium">{dateTime(c.changed_at)}</p>
                  <p className="text-[12.5px] text-muted">by <span className="tabular-nums">{c.changed_by?.username ?? "system"}</span></p>
                  <span className={cx("mt-2 inline-block border px-1.5 py-0.5 tabular-nums text-[10.5px] tracking-wide", CHANGE_TONE[c.change_type])}>{c.change_type}</span>
                </div>
                <div className="min-w-0">
                  <p className="mb-2 flex items-center gap-2 text-sm"><Tag>#{c.object_id}</Tag><span className="truncate">{c.object_repr}</span></p>
                  {c.change_type === "updated" ? (
                    <ul className="space-y-1">
                      {c.changes.map((d) => (
                        <li key={d.field} className="grid grid-cols-[minmax(0,180px)_minmax(0,1fr)] gap-3 text-[13px]">
                          <span className="tabular-nums text-[12px] text-muted">{d.field}</span>
                          <span className="flex flex-wrap items-baseline gap-2 tabular-nums text-[12.5px]">
                            <span className="text-faint line-through decoration-terra/60">{fmtValue(d.old)}</span>
                            <span className="text-faint">→</span>
                            <span className="bg-marker/50 px-1">{fmtValue(d.new)}</span>
                          </span>
                        </li>
                      ))}
                      {!c.changes.length && <li className="text-[13px] text-muted">Saved with no field changes.</li>}
                    </ul>
                  ) : (
                    <p className="text-[12.5px] text-muted">{c.changes.length} fields {c.change_type === "created" ? "set" : "removed"}: {c.changes.slice(0, 6).map((d) => d.field).join(", ")}{c.changes.length > 6 ? "…" : ""}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <Pagination page={page} count={q.data.count} onPage={setPage} />
        </>
      )}
    </div>
  );
}

function Activity() {
  const [action, setAction] = useState("");
  const [username, setUsername] = useState("");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const user = useDebounced(username.trim(), 300);
  const [q, page, setPage] = usePaged("events", "audit/events/", { action, username: user, since, until });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Select label="Action" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">Everything</option>
          {Object.entries(ACTIONS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
        </Select>
        <Input label="Username" placeholder="Exact username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Input label="From" type="date" value={since} onChange={(e) => setSince(e.target.value)} />
        <Input label="To" type="date" value={until} onChange={(e) => setUntil(e.target.value)} />
      </div>
      <ErrorNote error={q.error} />
      {q.isLoading ? <TableSkeleton cols={5} /> : !q.data?.results.length ? <Empty title="No activity">Nothing matches these filters.</Empty> : (
        <>
          <div className={cx("overflow-x-auto transition-opacity", q.isFetching && "opacity-60")}>
            <table className="ledger-table min-w-[860px]">
              <thead><tr><th>When</th><th>Who</th><th>What</th><th>Detail</th><th>From</th></tr></thead>
              <tbody>
                {q.data.results.map((e) => {
                  const [label, dot] = ACTIONS[e.action] ?? [e.action_display, "bg-muted"];
                  return (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap"><span className="block text-[13px]">{dateTime(e.timestamp)}</span><span className="text-[12px] text-muted">{relative(e.timestamp)}</span></td>
                      <td className="tabular-nums text-[12.5px]">{e.actor_username || "—"}</td>
                      <td><span className="inline-flex items-center gap-2 whitespace-nowrap"><span className={cx("size-2 rounded-full", dot)} />{label}</span></td>
                      <td className="max-w-[300px] truncate tabular-nums text-[12px] text-ink-2">
                        {e.detail?.period && <>period {e.detail.period} </>}
                        {e.detail?.staff_id && <>· {e.detail.staff_id} </>}
                        {e.detail?.faculty_ids && <>· {e.detail.faculty_ids.length} units</>}
                        {!e.detail?.period && e.target_type && <>{e.target_type} {e.target_id.slice(0, 8)}</>}
                      </td>
                      <td className="tabular-nums text-[12px] text-muted" title={e.user_agent}>{e.ip_address || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} count={q.data.count} onPage={setPage} />
        </>
      )}
    </div>
  );
}
