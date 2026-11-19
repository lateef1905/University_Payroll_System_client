import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { compact, date, EMPLOYMENT_LABEL, initials, period } from "../../lib/format";
import { useDepartments, useFaculties } from "../../lib/queries";
import {
  Button, cx, Drawer, Empty, ErrorNote, Icon, Input, Leader, Money, PageHeader, Pagination, Section, Select,
  Stamp, TableSkeleton, Tabs, Toggle, useDebounced, useToast,
} from "../../components/ui";

const SCALES_FOR = { ACADEMIC: ["CONUASS", "CONPCASS"], NON_ACADEMIC: ["CONTISS"] };
const EMPTY_PROFILE = {
  staff_id: "", designation: "", employment_type: "ACADEMIC", salary_scale: "CONUASS", grade_level: 1, step: 1,
  date_of_employment: "", department: "", is_active: true, bank_name: "", account_number: "",
  annual_rent_paid: "0.00", cooperative_monthly_dues: "0.00", loan_monthly_repayment: "0.00",
};

export default function Staff() {
  const { isSuper } = useAuth();
  const { data: faculties = [] } = useFaculties();
  const { data: departments = [] } = useDepartments();
  const [search, setSearch] = useState("");
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [type, setType] = useState("");
  const [active, setActive] = useState("true");
  const [ordering, setOrdering] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);
  const q = useDebounced(search.trim(), 300);

  const params = { search: q, faculty, department, employment_type: type, is_active: active, ordering };
  const key = JSON.stringify(params);
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) { setLastKey(key); setPage(1); }

  const list = useQuery({
    queryKey: ["staff", params, page],
    queryFn: () => api("staff/profiles/", { params: { ...params, page } }),
    placeholderData: keepPreviousData,
  });
  const deptOptions = faculty ? departments.filter((d) => String(d.faculty) === faculty) : departments;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="People"
        title="Staff directory"
        actions={isSuper && <Button variant="moss" icon={<Icon name="plus" />} onClick={() => setCreating(true)}>Add staff member</Button>}
      >
        {list.data ? <><span className="tabular-nums">{list.data.count.toLocaleString()}</span> {active === "true" ? "active " : ""}staff match these filters.</> : "Loading the directory…"}
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_0.8fr_0.7fr_0.8fr]">
        <div className="relative">
          <Icon name="search" className="pointer-events-none absolute size-4 left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Name, email or staff ID" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search staff" />
        </div>
        <Select value={faculty} onChange={(e) => { setFaculty(e.target.value); setDepartment(""); }} aria-label="Faculty">
          <option value="">All faculties & units</option>
          {faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </Select>
        <Select value={department} onChange={(e) => setDepartment(e.target.value)} aria-label="Department">
          <option value="">All departments</option>
          {deptOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        <Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Employment type">
          <option value="">All types</option>
          <option value="ACADEMIC">Academic</option>
          <option value="NON_ACADEMIC">Non-academic</option>
        </Select>
        <Select value={active} onChange={(e) => setActive(e.target.value)} aria-label="Status">
          <option value="true">Active</option>
          <option value="false">Inactive</option>
          <option value="">Everyone</option>
        </Select>
        <Select value={ordering} onChange={(e) => setOrdering(e.target.value)} aria-label="Sort">
          <option value="">Staff ID</option>
          <option value="-grade_level">Grade, high → low</option>
          <option value="date_of_employment">Longest serving</option>
          <option value="-date_of_employment">Newest</option>
        </Select>
      </div>

      <ErrorNote error={list.error} />
      {list.isLoading ? <TableSkeleton cols={6} /> : !list.data?.results.length ? (
        <Empty title="No one matches">Try a shorter search, or clear a filter.</Empty>
      ) : (
        <>
          <div className={cx("overflow-x-auto transition-opacity", list.isFetching && "opacity-60")}>
            <table className="ledger-table min-w-[920px]">
              <thead>
                <tr><th>Name</th><th>Staff ID</th><th>Designation</th><th>Department</th><th>Grade</th><th>Employed</th><th>Status</th></tr>
              </thead>
              <tbody>
                {list.data.results.map((s) => (
                  <tr key={s.id} data-clickable onClick={() => setOpenId(s.id)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-paper-2 tabular-nums text-[11px] text-ink-2">{initials(s.full_name)}</span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{s.full_name}</span>
                          <span className="block truncate text-[12px] text-muted">{s.email}</span>
                        </span>
                      </div>
                    </td>
                    <td className="tabular-nums text-[12.5px]">{s.staff_id}</td>
                    <td className="text-ink-2">{s.designation || "—"}</td>
                    <td className="max-w-[220px] truncate text-ink-2">{s.department_name}</td>
                    <td className="whitespace-nowrap tabular-nums text-[12px]">{s.salary_scale} {String(s.grade_level).padStart(2, "0")}/{s.step}</td>
                    <td className="whitespace-nowrap text-ink-2">{date(s.date_of_employment, { month: "short", year: "numeric" })}</td>
                    <td><Stamp status={s.is_active ? "ACTIVE" : "INACTIVE"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} count={list.data.count} onPage={setPage} />
        </>
      )}

      <StaffDrawer id={openId} onClose={() => setOpenId(null)} />
      {isSuper && <CreateStaffDrawer open={creating} onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); setOpenId(id); }} />}
    </div>
  );
}

/* ------------------------------------------------------------------ profile drawer */
function StaffDrawer({ id, onClose }) {
  const [tab, setTab] = useState("pay");
  const profile = useQuery({ queryKey: ["staff", "one", id], queryFn: () => api(`staff/profiles/${id}/`), enabled: !!id });
  const p = profile.data;
  const history = useQuery({
    queryKey: ["records", { staff_id: p?.staff_id }],
    queryFn: () => api("payroll/records/", { params: { staff_id: p.staff_id } }),
    enabled: !!p,
  });
  useEffect(() => { if (id) setTab("pay"); }, [id]);

  return (
    <Drawer open={!!id} onClose={onClose} width="max-w-2xl" eyebrow={p?.staff_id} title={p?.full_name || "Staff member"}>
      {profile.isLoading ? <TableSkeleton rows={6} cols={2} /> : profile.error ? <ErrorNote error={profile.error} /> : p && (
        <div className="space-y-7">
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
            <Stamp status={p.is_active ? "ACTIVE" : "INACTIVE"} />
            <span>{p.designation}</span><span className="text-faint">·</span><span>{p.department_name}</span>
          </div>
          <Tabs value={tab} onChange={setTab} tabs={[{ value: "pay", label: "Pay history" }, { value: "details", label: "Details" }, { value: "edit", label: "Edit" }]} />
          {tab === "pay" && <PayHistory q={history} />}
          {tab === "details" && <Details p={p} />}
          {tab === "edit" && <ProfileForm initial={p} onSaved={() => setTab("details")} />}
        </div>
      )}
    </Drawer>
  );
}

function PayHistory({ q }) {
  if (q.isLoading) return <TableSkeleton rows={5} cols={3} />;
  if (q.error) return <ErrorNote error={q.error} />;
  const rows = q.data.results;
  if (!rows.length) return <Empty title="Not paid yet">No payslips have been issued to this person.</Empty>;
  const max = Math.max(...rows.map((r) => Number(r.gross_earnings)));
  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {rows.map((r) => (
        <li key={r.id} className="grid grid-cols-[90px_minmax(0,1fr)_auto] items-center gap-4 py-2.5">
          <span className="text-[13px]">{period(r.period_year, r.period_month, true)}</span>
          <span className="flex h-2 gap-[2px]" title={`Net ${r.net_pay} · deductions ${r.total_deductions}`}>
            <span className="rounded-l-[2px] bg-moss" style={{ width: `${(r.net_pay / max) * 100}%` }} />
            <span className="rounded-r-[2px] bg-terra/70" style={{ width: `${(r.total_deductions / max) * 100}%` }} />
          </span>
          <Money value={r.net_pay} className="text-right text-[13px]" />
        </li>
      ))}
    </ul>
  );
}

function Details({ p }) {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
      <Section title="Employment">
        <Leader label="Type">{EMPLOYMENT_LABEL[p.employment_type]}</Leader>
        <Leader label="Scale"><span className="tabular-nums">{p.salary_scale} {p.grade_level}/{p.step}</span></Leader>
        <Leader label="Employed">{date(p.date_of_employment)}</Leader>
        <Leader label="Email"><span className="text-[13px]">{p.email}</span></Leader>
      </Section>
      <Section title="Payment & deductions">
        <Leader label="Bank">{p.bank_name || "—"}</Leader>
        <Leader label="Account"><span className="tabular-nums">{p.account_number || "—"}</span></Leader>
        <Leader label="Annual rent">{compact(p.annual_rent_paid)}</Leader>
        <Leader label="Cooperative / mo"><Money value={p.cooperative_monthly_dues} /></Leader>
        <Leader label="Loan / mo"><Money value={p.loan_monthly_repayment} /></Leader>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ profile form (edit + create) */
function useProfileFields(initial) {
  const [f, setF] = useState(() => ({ ...EMPTY_PROFILE, ...initial }));
  const set = (k) => (e) => {
    const v = e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
    setF((x) => {
      const next = { ...x, [k]: v };
      if (k === "employment_type" && !SCALES_FOR[v].includes(x.salary_scale)) next.salary_scale = SCALES_FOR[v][0];
      return next;
    });
  };
  return [f, set, setF];
}

function ProfileFields({ f, set, errors }) {
  const { data: faculties = [] } = useFaculties();
  const { data: departments = [] } = useDepartments();
  const [facultyId, setFacultyId] = useState(() => String(departments.find((d) => d.id === Number(f.department))?.faculty ?? ""));
  useEffect(() => {
    if (!facultyId && f.department && departments.length) setFacultyId(String(departments.find((d) => d.id === Number(f.department))?.faculty ?? ""));
  }, [departments, f.department, facultyId]);
  const depts = useMemo(() => departments.filter((d) => String(d.faculty) === facultyId), [departments, facultyId]);
  const maxGrade = f.salary_scale === "CONTISS" ? 15 : 7;

  return (
    <div className="space-y-8">
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="eyebrow mb-3">Position</legend>
        <Input label="Staff ID" value={f.staff_id} onChange={set("staff_id")} error={errors.staff_id} placeholder="UI/AC/1234" inputClassName="tabular-nums" />
        <Input label="Designation" value={f.designation} onChange={set("designation")} error={errors.designation} placeholder="Lecturer I" />
        <Select label="Faculty / unit" value={facultyId} onChange={(e) => { setFacultyId(e.target.value); set("department")(""); }}>
          <option value="">Choose…</option>
          {faculties.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </Select>
        <Select label="Department" value={f.department} onChange={set("department")} error={errors.department} disabled={!facultyId}>
          <option value="">Choose…</option>
          {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        <Input label="Date of employment" type="date" value={f.date_of_employment} onChange={set("date_of_employment")} error={errors.date_of_employment} />
        <div className="flex items-end pb-2"><Toggle checked={!!f.is_active} onChange={set("is_active")} label="On the payroll (active)" /></div>
      </fieldset>
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <legend className="eyebrow mb-3">Grading</legend>
        <Select label="Type" value={f.employment_type} onChange={set("employment_type")} className="sm:col-span-2">
          <option value="ACADEMIC">Academic</option><option value="NON_ACADEMIC">Non-academic</option>
        </Select>
        <Select label="Scale" value={f.salary_scale} onChange={set("salary_scale")} error={errors.salary_scale} className="sm:col-span-2">
          {SCALES_FOR[f.employment_type].map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Select label="Grade level" value={f.grade_level} onChange={set("grade_level")} error={errors.grade_level} className="sm:col-span-2">
          {Array.from({ length: maxGrade }, (_, i) => <option key={i + 1} value={i + 1}>GL {String(i + 1).padStart(2, "0")}</option>)}
        </Select>
        <Select label="Step" value={f.step} onChange={set("step")} error={errors.step} className="sm:col-span-2">
          {Array.from({ length: 15 }, (_, i) => <option key={i + 1} value={i + 1}>Step {i + 1}</option>)}
        </Select>
      </fieldset>
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="eyebrow mb-3">Payment & deductions</legend>
        <Input label="Bank" value={f.bank_name} onChange={set("bank_name")} error={errors.bank_name} />
        <Input label="NUBAN account number" inputMode="numeric" maxLength={10} value={f.account_number} onChange={set("account_number")} error={errors.account_number} />
        <Input label="Annual rent paid (₦)" type="number" min="0" step="0.01" value={f.annual_rent_paid} onChange={set("annual_rent_paid")} error={errors.annual_rent_paid} hint="Drives rent relief: 20%, capped at ₦500,000." />
        <Input label="Cooperative dues / month (₦)" type="number" min="0" step="0.01" value={f.cooperative_monthly_dues} onChange={set("cooperative_monthly_dues")} error={errors.cooperative_monthly_dues} />
        <Input label="Loan repayment / month (₦)" type="number" min="0" step="0.01" value={f.loan_monthly_repayment} onChange={set("loan_monthly_repayment")} error={errors.loan_monthly_repayment} />
      </fieldset>
    </div>
  );
}

const PROFILE_KEYS = Object.keys(EMPTY_PROFILE);
const pick = (f) => Object.fromEntries(PROFILE_KEYS.map((k) => [k, ["grade_level", "step", "department"].includes(k) ? Number(f[k]) || null : f[k]]));

function ProfileForm({ initial, onSaved }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [f, set] = useProfileFields(initial);
  const save = useMutation({
    mutationFn: () => api(`staff/profiles/${initial.id}/`, { method: "PATCH", body: pick(f) }),
    onSuccess: (data) => {
      qc.setQueryData(["staff", "one", initial.id], data);
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast("Profile saved. The change is in the audit trail.");
      onSaved();
    },
  });
  const errors = save.error?.fields ?? {};
  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-6">
      <ProfileFields f={f} set={set} errors={errors} />
      {save.error && !Object.keys(errors).length && <ErrorNote error={save.error} />}
      <div className="flex justify-end gap-2 border-t border-rule pt-5">
        <Button type="submit" loading={save.isPending}>Save changes</Button>
      </div>
      <p className="text-[12.5px] text-muted">Changes apply from the next pay run. Payslips already issued keep their original figures.</p>
    </form>
  );
}

function CreateStaffDrawer({ open, onClose, onCreated }) {
  const qc = useQueryClient();
  const [account, setAccount] = useState({ username: "", email: "", first_name: "", last_name: "", password: "" });
  const [f, set, setF] = useProfileFields({});
  const [userId, setUserId] = useState(null); // account created but profile not yet saved
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) { setAccount({ username: "", email: "", first_name: "", last_name: "", password: "" }); setF({ ...EMPTY_PROFILE }); setUserId(null); setErrors({}); }
  }, [open, setF]);
  const setA = (k) => (e) => setAccount((a) => ({ ...a, [k]: e.target.value }));

  async function submit() {
    setBusy(true);
    setErrors({});
    let uid = userId;
    try {
      if (!uid) {
        const user = await api("auth/users/", { method: "POST", body: { ...account, role: "STAFF" } });
        uid = user.id;
        setUserId(uid);
      }
      const profile = await api("staff/profiles/", { method: "POST", body: { ...pick(f), user: uid } });
      qc.invalidateQueries({ queryKey: ["staff"] });
      onCreated(profile.id);
    } catch (e) {
      setErrors({ ...e.fields, form: Object.keys(e.fields).length ? null : e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer open={open} onClose={onClose} width="max-w-2xl" eyebrow="New staff member" title="Add to payroll"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="moss" loading={busy} onClick={submit}>{userId ? "Save profile" : "Create account & profile"}</Button></>}>
      <div className="space-y-8">
        <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2" disabled={!!userId}>
          <legend className="eyebrow mb-3">Portal account {userId && <span className="ml-2 normal-case tracking-normal text-moss">✓ created</span>}</legend>
          <Input label="First name" value={account.first_name} onChange={setA("first_name")} error={errors.first_name} />
          <Input label="Last name" value={account.last_name} onChange={setA("last_name")} error={errors.last_name} />
          <Input label="Username" value={account.username} onChange={setA("username")} error={errors.username} inputClassName="tabular-nums" />
          <Input label="Email" type="email" value={account.email} onChange={setA("email")} error={errors.email} />
          <Input label="Temporary password" type="password" autoComplete="new-password" value={account.password} onChange={setA("password")} error={errors.password}
            hint="At least 10 characters. Ask them to change it after first sign-in." className="sm:col-span-2" />
        </fieldset>
        <ProfileFields f={f} set={set} errors={errors} />
        {errors.form && <ErrorNote error={errors.form} />}
      </div>
    </Drawer>
  );
}
