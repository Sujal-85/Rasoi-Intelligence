import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Rasoi Intelligence" }, { name: "description", content: "Sign in to your Rasoi Intelligence account." }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to pick up where you left off.">
      <form
        onSubmit={(e) => { e.preventDefault(); nav({ to: "/clients" }); }}
        className="space-y-4"
      >
        <Field label="Email">
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@restaurant.com"
            className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </Field>
        <Field label="Password" hint={<a className="text-xs text-muted-foreground hover:text-foreground" href="#">Forgot?</a>}>
          <div className="relative">
            <input
              type={show ? "text" : "password"} required value={pw} onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-2 grid place-items-center text-muted-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <button type="submit" className="w-full inline-flex justify-center items-center gap-2 bg-gold-gradient text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium glow-gold">
          Sign in <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => { setEmail("demo@rasoi.in"); setPw("demo1234"); }}
          className="w-full inline-flex justify-center items-center gap-2 border border-border bg-card rounded-lg px-4 py-2.5 text-sm hover:bg-surface-2"
        >
          Use demo account
        </button>
        <p className="text-xs text-muted-foreground text-center pt-2">
          Don't have an account? <Link to="/register" className="text-gold hover:underline">Create one</Link>
        </p>
      </form>
    </AuthShell>
  );
}

function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        {hint}
      </div>
      {children}
    </label>
  );
}