import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CLIENTS, inr } from "@/lib/mock/data";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Rasoi Intelligence" }, { name: "description", content: "All analyses across your clients." }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const nav = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = sessionStorage.getItem("userRole");
      setUserRole(role);
      if (!role) {
        nav({ to: "/login" });
      } else if (role !== "admin") {
        nav({ to: "/sessions/$id/dashboard", params: { id: "c1" } as any });
      }
    }
  }, [nav]);

  if (!userRole || userRole !== "admin") {
    return null;
  }

  const rows = CLIENTS.flatMap((c) => [
    { c, m: "March 2025", rev: c.lastRevenue, rag: c.rag, gen: "2 days ago" },
    { c, m: "February 2025", rev: Math.round(c.lastRevenue * 0.88), rag: "amber" as const, gen: "1 mo ago" },
  ]);
  const ragCls = { green: "bg-rag-green/15 text-rag-green", amber: "bg-rag-amber/15 text-rag-amber", red: "bg-rag-red/15 text-rag-red" };
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">All reports</div>
        <h1 className="font-display text-4xl mt-2">Reports library</h1>
        <p className="text-sm text-muted-foreground mt-1">Every analysis you've ever run, across every client.</p>

        <div className="mt-8 rounded-2xl border border-border/70 bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface/60 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Client</th>
                <th className="text-left px-5 py-3 font-medium">Month</th>
                <th className="text-left px-5 py-3 font-medium">Revenue</th>
                <th className="text-left px-5 py-3 font-medium">RAG</th>
                <th className="text-left px-5 py-3 font-medium">Generated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-border/60 hover:bg-surface/40">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{r.c.icon}</span>
                      <div>
                        <div className="font-medium">{r.c.name}</div>
                        <div className="text-xs text-muted-foreground">{r.c.city}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">{r.m}</td>
                  <td className="px-5 py-4 font-mono">{inr(r.rev)}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] px-2 py-1 rounded-full ${ragCls[r.rag]}`}>{r.rag.toUpperCase()}</span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{r.gen}</td>
                  <td className="px-5 py-4 text-right pr-5">
                    <Link to="/sessions/$id/dashboard" params={{ id: r.c.id }} className="text-gold hover:underline">Open →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}