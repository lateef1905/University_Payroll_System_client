import { Link } from "react-router";
import { Wordmark } from "../components/brand";

export default function NotFound() {
  return (
    <div className="ruled flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
      <Wordmark />
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Error 404 · No such entry</p>
      <h1 className="max-w-lg font-display text-[3.4rem] leading-[0.95]">This page isn&rsquo;t in the ledger.</h1>
      <Link to="/" className="text-sm underline decoration-rule-strong underline-offset-4 hover:decoration-ink">Back to the front page</Link>
    </div>
  );
}
