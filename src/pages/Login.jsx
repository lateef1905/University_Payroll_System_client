import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../lib/auth";
import { Wordmark } from "../components/brand";
import { Button, ErrorNote, Icon, Input } from "../components/ui";

// Shown only in development builds, to make the seeded data easy to explore.
const DEMO = [
  ["bursar.demo", "Bursary Officer", "Runs payroll, edits pay rules"],
  ["admin.demo", "Super Administrator", "Everything, plus users and the activity log"],
  ["staff.demo", "Staff · Senior Lecturer", "Sees only their own payslips"],
];

export default function Login() {
  const { login, status, isManager } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (status === "authed") return <Navigate to={isManager ? "/app/overview" : "/app/my-pay"} replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const me = await login(username.trim(), password);
      const fallback = me.role === "STAFF" ? "/app/my-pay" : "/app/overview";
      navigate(location.state?.from || fallback, { replace: true });
    } catch (err) {
      setError(
        err.status === 401 ? new Error("That username and password don’t match an active account.")
        : err.status === 429 ? new Error("Too many attempts. Wait a minute, then try again.")
        : err,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-[1fr_minmax(0,560px)]">
      {/* left: the ledger plate */}
      <div className="relative hidden overflow-hidden bg-ink text-paper lg:flex lg:flex-col lg:justify-between lg:p-12"
        style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 39px, rgba(243,239,230,0.06) 39px 40px)" }}>
        <Link to="/"><Wordmark inverted /></Link>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/45">Office of the Bursar</p>
          <p className="mt-6 max-w-xl font-display text-[4.2rem] leading-[0.92]">
            Pay day starts with <em className="text-marker">one</em> correct sum.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-6 border-t border-paper/15 pt-6 font-mono text-[11px] uppercase tracking-[0.12em] text-paper/50">
          <span>JWT sessions · 15 min</span>
          <span>Logins are logged</span>
          <span>Payslips: own only</span>
        </div>
      </div>

      {/* right: the form */}
      <div className="flex flex-col bg-paper px-5 py-8 sm:px-12">
        <div className="flex items-center justify-between lg:justify-end">
          <Link to="/" className="lg:hidden"><Wordmark /></Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><Icon name="back" className="size-3.5" /> Home</Link>
        </div>

        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-12">
          <p className="eyebrow mb-3">Staff portal</p>
          <h1 className="font-display text-[3rem] leading-none">Sign in</h1>
          <p className="mt-3 text-[15px] text-ink-2">Use your University payroll account.</p>

          <form onSubmit={submit} className="mt-10 space-y-5" noValidate>
            <Input label="Username" autoComplete="username" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} required />
            <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <ErrorNote error={error} />
            <Button type="submit" variant="ink" size="lg" className="w-full" loading={busy} disabled={!username || !password}>
              Sign in <Icon name="arrow" />
            </Button>
          </form>

          {import.meta.env.DEV && (
            <div className="mt-12">
              <p className="eyebrow mb-3 flex items-center gap-2"><span className="h-px flex-1 bg-rule" />Demo accounts<span className="h-px flex-1 bg-rule" /></p>
              <ul className="divide-y divide-rule border-y border-rule">
                {DEMO.map(([u, role, note]) => (
                  <li key={u}>
                    <button type="button" onClick={() => setUsername(u)} className="group flex w-full items-center justify-between gap-3 py-2.5 text-left">
                      <span>
                        <span className="block font-mono text-[13px] group-hover:text-moss">{u}</span>
                        <span className="block text-[12px] text-muted">{role} · {note}</span>
                      </span>
                      <Icon name="arrow" className="size-3.5 text-faint group-hover:text-moss" />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[12px] text-muted">Password: the one passed to <code className="font-mono">seed_demo_data --password</code>.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
