import { Link, useLocation } from "@tanstack/react-router";
import { LayoutGrid, Users, FileBarChart, Settings, LogOut } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden lg:flex w-64 flex-col border-r border-border/60 bg-sidebar shrink-0">
        <Link to="/" className="flex items-center gap-2 px-6 h-16 border-b border-border/60">
          <div className="h-8 w-8 rounded-lg bg-gold-gradient grid place-items-center text-primary-foreground text-sm font-bold">र</div>
          <span className="font-display text-lg">Rasoi</span>
        </Link>
        <nav className="flex-1 px-3 py-6 space-y-1">
          {nav.map((n) => {
            const active = loc.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to} to={n.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  active ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/60">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface">
            <div className="h-8 w-8 rounded-full bg-gold-gradient grid place-items-center text-primary-foreground text-xs font-medium">AK</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">Anika Kapoor</div>
              <div className="text-xs text-muted-foreground truncate">LokLearning</div>
            </div>
            <Link to="/" aria-label="Sign out" className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden flex items-center justify-between border-b border-border/60 px-4 h-14 bg-background/80 backdrop-blur">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gold-gradient grid place-items-center text-primary-foreground text-sm font-bold">र</div>
            <span className="font-display">Rasoi</span>
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className="p-2 text-muted-foreground hover:text-foreground" aria-label={n.label}>
                <n.icon className="h-4 w-4" />
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}