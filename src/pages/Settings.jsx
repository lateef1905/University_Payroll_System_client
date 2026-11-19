import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ROLE_LABEL, useAuth } from "../lib/auth";
import { date } from "../lib/format";
import { Button, Input, Leader, PageHeader, Section, useToast } from "../components/ui";

export default function Settings() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const [errors, setErrors] = useState({});

  const change = useMutation({
    mutationFn: () => api("auth/change-password/", { method: "POST", body: { old_password: form.old_password, new_password: form.new_password } }),
    onSuccess: () => {
      setForm({ old_password: "", new_password: "", confirm: "" });
      setErrors({});
      toast("Password changed.");
    },
    onError: (e) => setErrors({ ...e.fields, form: Object.keys(e.fields).length ? null : e.message }),
  });

  function submit(e) {
    e.preventDefault();
    if (form.new_password !== form.confirm) return setErrors({ confirm: "The two new passwords don’t match." });
    change.mutate();
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Account" title="Your account" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section n={1} title="Profile">
          <Leader label="Name">{[user.first_name, user.last_name].filter(Boolean).join(" ") || "—"}</Leader>
          <Leader label="Username"><span className="tabular-nums">{user.username}</span></Leader>
          <Leader label="Email">{user.email}</Leader>
          <Leader label="Role">{ROLE_LABEL[user.role]}</Leader>
          <Leader label="Account created">{date(user.date_joined)}</Leader>
          <p className="mt-4 text-[13px] text-muted">Name, email and role are maintained by a Super Administrator.</p>
        </Section>
        <Section n={2} title="Change password">
          <form onSubmit={submit} className="max-w-sm space-y-4">
            <Input label="Current password" type="password" autoComplete="current-password" value={form.old_password} onChange={set("old_password")} error={errors.old_password} required />
            <Input label="New password" type="password" autoComplete="new-password" value={form.new_password} onChange={set("new_password")} error={errors.new_password}
              hint="At least 10 characters; not a common or all-numeric password." required />
            <Input label="Repeat new password" type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} error={errors.confirm} required />
            {errors.form && <p className="text-sm text-danger">{errors.form}</p>}
            <Button type="submit" loading={change.isPending} disabled={!form.old_password || !form.new_password}>Update password</Button>
          </form>
        </Section>
      </div>
    </div>
  );
}
