import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Rasoi Intelligence" }, { name: "description", content: "Sign in to your Rasoi Intelligence account." }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const { signIn } = useAuth();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await signIn(email, pw);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    // Read the role that was set during signIn to decide where to navigate
    const role = sessionStorage.getItem("userRole");
    if (role === "admin") {
      nav({ to: "/clients" });
    } else {
      const restaurantId = sessionStorage.getItem("restaurantId") || "c1";
      nav({ to: "/clients/$id", params: { id: restaurantId } as any });
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to pick up where you left off.">
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {error && (
          <div className="p-3 text-xs bg-rag-red/10 border border-rag-red/30 rounded-lg text-rag-red text-center">
            {error}
          </div>
        )}
        <Field label="Email">
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@restaurant.com"
            className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            disabled={submitting}
          />
        </Field>
        <Field label="Password" hint={<a className="text-xs text-muted-foreground hover:text-foreground" href="#">Forgot?</a>}>
          <div className="relative">
            <input
              type={show ? "text" : "password"} required value={pw} onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              disabled={submitting}
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-2 grid place-items-center text-muted-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <button 
          type="submit" 
          disabled={submitting}
          className="w-full inline-flex justify-center items-center gap-2 bg-gold-gradient text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium glow-gold disabled:opacity-60"
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
          ) : (
            <>Sign in <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { setEmail("admin@gmail.com"); setPw("admin@123"); }}
            disabled={submitting}
            className="inline-flex justify-center items-center gap-1 border border-border bg-card rounded-lg px-2.5 py-2 text-xs hover:bg-surface-2 disabled:opacity-40"
          >
            Fill Admin Account
          </button>
          <button
            type="button"
            onClick={() => { setEmail("demo@rasoi.in"); setPw("demo1234"); }}
            disabled={submitting}
            className="inline-flex justify-center items-center gap-1 border border-border bg-card rounded-lg px-2.5 py-2 text-xs hover:bg-surface-2 disabled:opacity-40"
          >
            Fill Restaurant Demo
          </button>
        </div>
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