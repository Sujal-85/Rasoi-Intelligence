import { Link } from "@tanstack/react-router";
import { ShieldCheck, Sparkles, BarChart3 } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[42%_1fr] bg-background">
      <aside className="relative hidden lg:flex flex-col justify-between p-10 bg-sidebar border-r border-border/60 overflow-hidden">
        <div className="absolute inset-0 ambient-glow" />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-gold-gradient grid place-items-center text-primary-foreground text-sm font-bold">र</div>
          <span className="font-display text-xl">Rasoi Intelligence</span>
        </Link>
        <div className="relative">
          <h2 className="font-display text-4xl text-balance leading-tight">
            The <em className="text-gold-gradient">P&L whisperer</em> your kitchen never had.
          </h2>
          <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
            {[
              { icon: ShieldCheck, t: "PII pseudonymised before AI sees it" },
              { icon: Sparkles, t: "Plain-English insights, not jargon dashboards" },
              { icon: BarChart3, t: "40+ deterministic metrics in 20 seconds" },
            ].map((b) => (
              <li key={b.t} className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-lg bg-gold/10 border border-gold/20 grid place-items-center">
                  <b.icon className="h-4 w-4 text-gold" />
                </span>
                <span>{b.t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-xs text-muted-foreground">© 2025 LokLearning</div>
      </aside>
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl">{title}</h1>
          <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}