import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { ROLE_LABEL, useAuth } from "../../lib/auth";
import { date, initials } from "../../lib/format";
import { Button, cx, Drawer, ErrorNote, Icon, Input, Modal, PageHeader, Pagination, Select, Stamp, TableSkeleton, Toggle, useToast } from "../../components/ui";

const ROLE_TONE = { SUPER_ADMIN: "bg-ink text-paper", BURSARY: "bg-moss-wash text-moss-deep", STAFF: "bg-paper-2 text-ink-2" };

export default function Users() {
  const { user: me } = useAuth();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // user object or {} for new
  const q = useQuery({ queryKey: ["users", page], queryFn: () => api("auth/users/", { params: { page } }), placeholderData: keepPreviousData });

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Oversight" title="User accounts"
        actions={<Button variant="moss" icon={<Icon name="plus" />} onClick={() => setEditing({})}>New account</Button>}>
        Who can sign in, and what they can do. Accounts are never deleted (payroll history refers to them). Deactivate them instead.
      </PageHeader>
      <ErrorNote error={q.error} />
      {q.isLoading ? <TableSkeleton cols={5} /> : (
        <>
          <div className="overflow-x-auto">
            <table className="ledger-table min-w-[760px]">
              <thead><tr><th>Person</th><th>Username</th><th>Role</th><th>Joined</th><th>Status</th></tr></thead>
              <tbody>
                {q.data.results.map((u) => {
                  const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username;
                  return (
                    <tr key={u.id} data-clickable onClick={() => setEditing(u)}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="flex size-8 items-center justify-center rounded-full bg-paper-2 tabular-nums text-[11px]">{initials(name)}</span>
                          <span><span className="block font-medium">{name}{u.id === me.id && <span className="ml-2 tabular-nums text-[10.5px] text-muted">(you)</span>}</span><span className="text-[12px] text-muted">{u.email}</span></span>
                        </div>
                      </td>
                      <td className="tabular-nums text-[12.5px]">{u.username}</td>
                      <td><span className={cx("rounded-full px-2.5 py-1 text-[12px] font-semibold", ROLE_TONE[u.role])}>{ROLE_LABEL[u.role]}</span></td>
                      <td className="text-ink-2">{date(u.date_joined)}</td>
                      <td><Stamp status={u.is_active ? "ACTIVE" : "INACTIVE"} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} count={q.data.count} onPage={setPage} />
        </>
      )}
      <UserDrawer user={editing} onClose={() => setEditing(null)} isSelf={editing?.id === me.id} />
    </div>
  );
}

function UserDrawer({ user, onClose, isSelf }) {
  const qc = useQueryClient();
  const toast = useToast();
  const isNew = user && !user.id;
  const [f, setF] = useState({});
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (user) setF({ username: "", email: "", first_name: "", last_name: "", role: "STAFF", password: "", is_active: true, ...user });
  }, [user]);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));

  const save = useMutation({
    mutationFn: () => isNew
      ? api("auth/users/", { method: "POST", body: { username: f.username, email: f.email, first_name: f.first_name, last_name: f.last_name, role: f.role, password: f.password } })
      : api(`auth/users/${user.id}/`, { method: "PATCH", body: { email: f.email, first_name: f.first_name, last_name: f.last_name, role: f.role, is_active: f.is_active } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast(isNew ? "Account created." : "Account updated."); onClose(); },
  });
  const deactivate = useMutation({
    mutationFn: () => api(`auth/users/${user.id}/`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast("Account deactivated."); setConfirm(false); onClose(); },
    onError: (e) => { setConfirm(false); toast(e.message, "error"); },
  });
  const errors = save.error?.fields ?? {};

  return (
    <Drawer open={!!user} onClose={onClose} eyebrow={isNew ? "New account" : user?.username} title={isNew ? "Create an account" : "Edit account"}
      footer={<>
        {!isNew && user?.is_active && !isSelf && <Button variant="ghost" className="mr-auto text-danger" onClick={() => setConfirm(true)}>Deactivate</Button>}
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button loading={save.isPending} onClick={() => save.mutate()}>{isNew ? "Create account" : "Save"}</Button>
      </>}>
      {user && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First name" value={f.first_name ?? ""} onChange={set("first_name")} error={errors.first_name} />
            <Input label="Last name" value={f.last_name ?? ""} onChange={set("last_name")} error={errors.last_name} />
          </div>
          <Input label="Username" value={f.username ?? ""} onChange={set("username")} error={errors.username} disabled={!isNew} inputClassName="tabular-nums" />
          <Input label="Email" type="email" value={f.email ?? ""} onChange={set("email")} error={errors.email} />
          <Select label="Role" value={f.role} onChange={set("role")} error={errors.role} disabled={isSelf}
            hint={isSelf ? "You can’t change your own role." : "Bursary officers run payroll and edit pay rules. Super administrators also manage accounts."}>
            {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          {isNew ? (
            <Input label="Temporary password" type="password" autoComplete="new-password" value={f.password} onChange={set("password")} error={errors.password}
              hint="At least 10 characters, not common or all numbers. Ask them to change it at first sign-in." />
          ) : !isSelf && (
            <Toggle checked={!!f.is_active} onChange={set("is_active")} label="Can sign in (active)" />
          )}
          {save.error && !Object.keys(errors).length && <ErrorNote error={save.error} />}
          {isNew && <p className="text-[12.5px] text-muted">To put someone on the payroll, add them from the Staff directory instead: that creates the account and the staff profile together.</p>}
        </div>
      )}
      <Modal open={confirm} onClose={() => setConfirm(false)} title={`Deactivate ${user?.username}?`}
        footer={<><Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" loading={deactivate.isPending} onClick={() => deactivate.mutate()}>Deactivate</Button></>}>
        They won&rsquo;t be able to sign in, and won&rsquo;t be included in future pay runs. Their history stays intact, and you can reactivate them later.
      </Modal>
    </Drawer>
  );
}
