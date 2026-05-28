import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Rasoi Intelligence" }, { name: "description", content: "Start your Rasoi Intelligence free trial." }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const score = Math.min(4, [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length);
  return (
    <AuthShell title="Create your account" subtitle="14-day free trial. No card required.">
      <form onSubmit={(e) => { e.preventDefault(); nav({ to: "/clients" }); }} className="space-y-4">
        <Row>
          <Field label="Full name"><Input placeholder="Anika Kapoor" /></Field>
          <Field label="Company"><Input placeholder="LokLearning" /></Field>
        </Row>
        <Field label="Email"><Input type="email" placeholder="you@restaurant.com" required /></Field>
        <Field label="Password">
          <Input type="password" placeholder="At least 8 characters" required value={pw} onChange={(e) => setPw(e.target.value)} />
          <div className="flex gap-1 mt-2">
            {[0,1,2,3].map(i => (
              <div key={i} className={`h-1 flex-1 rounded ${i < score ? (score > 2 ? "bg-rag-green" : "bg-rag-amber") : "bg-border"}`} />
            ))}
          </div>
        </Field>
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input type="checkbox" required className="mt-0.5 accent-[var(--gold)]" />
          I agree to the Terms of Service and Privacy Policy.
        </label>
        <button type="submit" className="w-full inline-flex justify-center items-center gap-2 bg-gold-gradient text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium glow-gold">
          Create account <ArrowRight className="h-4 w-4" />
        </button>
        <p className="text-xs text-muted-foreground text-center pt-2">
          Already a user? <Link to="/login" className="text-gold hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}

function Row({ children }: { children: React.ReactNode }) { return <div className="grid grid-cols-2 gap-3">{children}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />;
}