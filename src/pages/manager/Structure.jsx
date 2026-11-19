import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useDepartments, useFaculties } from "../../lib/queries";
import { Button, cx, Empty, ErrorNote, Icon, Input, Modal, PageHeader, Section, Skeleton, useToast } from "../../components/ui";

/** Small create/rename dialog shared by faculties and departments. */
function NameCodeDialog({ open, title, initial, onClose, onSubmit, pending, error }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  useEffect(() => { if (open) { setName(initial?.name ?? ""); setCode(initial?.code ?? ""); } }, [open, initial]);
  const fields = error?.fields ?? {};
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={pending} disabled={!name || !code} onClick={() => onSubmit({ name: name.trim(), code: code.trim().toUpperCase() })}>Save</Button></>}>
      <div className="space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} error={fields.name} autoFocus />
        <Input label="Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} error={fields.code} hint="2–10 uppercase letters or digits." className="tabular-nums" maxLength={10} />
        {error && !Object.keys(fields).length && <ErrorNote error={error} />}
      </div>
    </Modal>
  );
}

export default function Structure() {
  const qc = useQueryClient();
  const toast = useToast();
  const faculties = useFaculties();
  const departments = useDepartments();
  const [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState(null); // { kind: 'faculty'|'department', item? }

  const facultyList = faculties.data ?? [];
  const current = facultyList.find((f) => f.id === selected) ?? facultyList[0];
  const depts = (departments.data ?? []).filter((d) => d.faculty === current?.id);
  const countFor = (id) => (departments.data ?? []).filter((d) => d.faculty === id).length;

  const save = useMutation({
    mutationFn: ({ kind, item, body }) => {
      const base = kind === "faculty" ? "staff/faculties/" : "staff/departments/";
      const payload = kind === "department" ? { ...body, faculty: current.id } : body;
      return item ? api(`${base}${item.id}/`, { method: "PATCH", body: payload }) : api(base, { method: "POST", body: payload });
    },
    onSuccess: (data, { kind }) => {
      qc.invalidateQueries({ queryKey: [kind === "faculty" ? "faculties" : "departments"] });
      if (kind === "faculty") setSelected(data.id);
      setDialog(null);
      toast(`${kind === "faculty" ? "Faculty" : "Department"} saved.`);
    },
  });

  const remove = useMutation({
    mutationFn: (d) => api(`staff/departments/${d.id}/`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["departments"] }); toast("Department removed."); },
    onError: (e) => toast(e.status === 409 ? "Staff are still assigned to that department, so it can’t be removed." : e.message, "error"),
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="People" title="Faculties & units"
        actions={<Button variant="line" icon={<Icon name="plus" />} onClick={() => { save.reset(); setDialog({ kind: "faculty" }); }}>Add faculty / unit</Button>}>
        The organisational tree payroll runs are scoped by. Every staff member belongs to one department.
      </PageHeader>
      <ErrorNote error={faculties.error || departments.error} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Section title="Faculties & units" aside={<span className="tabular-nums">{facultyList.length}</span>}>
          {faculties.isLoading ? <Skeleton className="h-96 w-full" /> : (
            <ul className="-mx-2 space-y-0.5">
              {facultyList.map((f) => (
                <li key={f.id}>
                  <button onClick={() => setSelected(f.id)}
                    className={cx("flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm transition-colors",
                      current?.id === f.id ? "bg-moss-wash text-moss-deep font-semibold" : "hover:bg-paper")}>
                    <span className={cx("w-10 tabular-nums text-[11px]", current?.id === f.id ? "text-moss/70" : "text-muted")}>{f.code}</span>
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className={cx("tabular-nums text-[11px]", current?.id === f.id ? "text-moss/70" : "text-faint")}>{countFor(f.id)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {current && (
          <Section title={<span className="flex items-baseline gap-3"><span className="font-semibold tracking-tight text-3xl font-normal">{current.name}</span><span className="tabular-nums text-xs text-muted">{current.code}</span></span>}
            aside={<span className="flex gap-1">
              <Button size="sm" variant="ghost" icon={<Icon name="edit" className="size-3.5" />} onClick={() => { save.reset(); setDialog({ kind: "faculty", item: current }); }}>Rename</Button>
              <Button size="sm" variant="ink" icon={<Icon name="plus" className="size-3.5" />} onClick={() => { save.reset(); setDialog({ kind: "department" }); }}>Department</Button>
            </span>}>
            {!depts.length ? <Empty title="No departments yet">Add the first department to start assigning staff to {current.name}.</Empty> : (
              <table className="ledger-table">
                <thead><tr><th className="w-24">Code</th><th>Department</th><th className="w-24"><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {depts.map((d) => (
                    <tr key={d.id} className="group">
                      <td className="tabular-nums text-[12px] text-ink-2">{d.code}</td>
                      <td>{d.name}</td>
                      <td className="text-right">
                        <span className="inline-flex gap-1 opacity-60 group-hover:opacity-100">
                          <button className="p-1.5 hover:text-ink" title="Rename" onClick={() => { save.reset(); setDialog({ kind: "department", item: d }); }}><Icon name="edit" /></button>
                          <button className="p-1.5 hover:text-danger" title="Remove" onClick={() => remove.mutate(d)}><Icon name="trash" /></button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>
        )}
      </div>

      <NameCodeDialog
        open={!!dialog} onClose={() => setDialog(null)} initial={dialog?.item}
        title={`${dialog?.item ? "Edit" : "New"} ${dialog?.kind === "faculty" ? "faculty / unit" : `department in ${current?.name}`}`}
        pending={save.isPending} error={save.error}
        onSubmit={(body) => save.mutate({ kind: dialog.kind, item: dialog.item, body })}
      />
    </div>
  );
}
