import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../lib/auth";
import { PROJECT, SitePage, SUPPORT } from "../components/site";
import { Icon } from "../components/ui";

const TOPICS = [
  "My payslip looks wrong",
  "I can't sign in",
  "Bank account or personal details",
  "Pension or tax question",
  "Something else",
];

const FAQ = [
  ["I forgot my password.", "Passwords are reset by the Bursary or a super administrator. Send a request below with your staff ID, and you'll get a temporary password to change after you sign in."],
  ["An amount on my payslip is wrong.", "Payslips are frozen once issued, so a mistake is corrected in the next pay run, not by editing the old slip. Tell us the month and the line that looks wrong."],
  ["The download says I've reached the limit.", "Payslip PDFs are limited to 60 an hour per person. Wait a little and try again. Your payslips are never lost."],
  ["My bank account changed.", "Bank details can only be changed by the Bursary, to protect you from fraud. Bring or send proof of the new account."],
  ["Why is my PAYE different this year?", "PAYE follows the Nigeria Tax Act 2025 bands, after pension and rent relief. Your payslip shows the annual taxable income used."],
];

export default function Support() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user ? [user.first_name, user.last_name].filter(Boolean).join(" ") : "", staffId: "", topic: TOPICS[0], message: "" });
  const [open, setOpen] = useState(0);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Opens the person's own mail app with the message filled in; nothing is sent from here.
  const mailto = () => {
    const subject = `[Payroll support] ${form.topic}${form.staffId ? ` · ${form.staffId}` : ""}`;
    const body = `Name: ${form.name}\nStaff ID: ${form.staffId}\nTopic: ${form.topic}\n\n${form.message}`;
    return `mailto:${SUPPORT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  const valid = form.name.trim() && form.message.trim().length >= 10;

  return (
    <SitePage>
      <section className="mx-auto max-w-[1240px] px-4 pb-12 pt-14 sm:px-8 lg:pt-20">
        <p className="eyebrow mb-6">Contact support</p>
        <h1 className="max-w-3xl font-display text-[3rem] leading-[0.92] tracking-[-0.02em] sm:text-[4.6rem]">
          Something not adding up? <em>Tell us.</em>
        </h1>
        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-2">
          The Payroll Unit answers questions about payslips, sign-in and staff records. Most answers are below.
          If yours isn&rsquo;t, send us a message.
        </p>
      </section>

      <section className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-4 pb-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* form */}
        <form
          className="border border-ink bg-card p-6 sm:p-8"
          onSubmit={(e) => { e.preventDefault(); if (valid) window.location.href = mailto(); }}
        >
          <h2 className="font-display text-[2rem] leading-none">Send a message</h2>
          <p className="mt-2 text-[13px] text-muted">This opens your email app with the message ready to send to the Payroll Unit.</p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2">
              Full name
              <input className="input" value={form.name} onChange={set("name")} required autoComplete="name" />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2">
              <span>Staff ID <span className="font-normal text-faint">(optional)</span></span>
              <input className="input" value={form.staffId} onChange={set("staffId")} placeholder="e.g. UI/AC/0000" />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2 sm:col-span-2">
              What is it about?
              <select className="input" value={form.topic} onChange={set("topic")}>
                {TOPICS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-2 sm:col-span-2">
              Message
              <textarea className="input min-h-[140px] resize-y" value={form.message} onChange={set("message")} required
                placeholder="Which month, what you expected, and what you saw." />
            </label>
          </div>
          <p className="mt-3 text-[12px] text-muted">Never include your password. The Payroll Unit will never ask for it.</p>
          <button type="submit" disabled={!valid}
            className="mt-6 inline-flex h-12 items-center gap-2.5 bg-moss px-6 text-[15px] font-medium text-white hover:bg-moss-deep disabled:opacity-50">
            Write the email <Icon name="arrow" />
          </button>
        </form>

        {/* contact + FAQ */}
        <div className="space-y-10">
          <dl className="border-t border-ink">
            {[
              ["Email", <a key="e" href={`mailto:${SUPPORT.email}`} className="underline decoration-rule-strong underline-offset-4 hover:decoration-ink">{SUPPORT.email}</a>],
              ["Visit", SUPPORT.office + ", " + PROJECT.university],
              ["Hours", SUPPORT.hours],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[90px_1fr] gap-3 border-b border-rule py-4 text-[15px]">
                <dt className="pt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{k}</dt>
                <dd className="text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>

          <div>
            <p className="eyebrow mb-4">Common questions</p>
            <ul className="border-t border-ink">
              {FAQ.map(([q, a], i) => (
                <li key={q} className="border-b border-rule">
                  <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left text-[15px] font-semibold hover:text-moss">
                    {q}
                    <Icon name="plus" className={`size-4 shrink-0 transition-transform ${open === i ? "rotate-45" : ""}`} />
                  </button>
                  {open === i && <p className="pb-4 pr-8 text-[14px] leading-relaxed text-ink-2">{a}</p>}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[13px] text-muted">
            Already signed in? Your payslips are under <Link to="/app/my-pay" className="text-ink underline underline-offset-4">My pay</Link>.
          </p>
        </div>
      </section>
    </SitePage>
  );
}
