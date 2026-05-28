import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Plus, ArrowRight, MoreVertical } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CLIENTS, inr } from "@/lib/mock/data";

export const Route = createFileRoute("/clients")({
  head: () => ({ meta: [{ title: "Clients — Rasoi Intelligence" }, { name: "description", content: "All your restaurant clients in one place." }] }),
  component: ClientsPage,
});

const ragColor = { green: "text-rag-green bg-rag-green/10 border-rag-green/30", amber: "text-rag-amber bg-rag-amber/10 border-rag-amber/30", red: "text-rag-red bg-rag-red/10 border-rag-red/30" };

function ClientsPage() {
  const totalRevenue = CLIENTS.reduce((s, c) => s + c.lastRevenue, 0);
  const totalSessions = CLIENTS.reduce((s, c) => s + c.sessions, 0);
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold">Portfolio</div>
            <h1 className="font-display text-4xl mt-2">My clients</h1>
            <p className="text-sm text-muted-foreground mt-1">{CLIENTS.length} restaurants · {totalSessions} analyses run</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gold-gradient text-primary-foreground text-sm font-medium glow-gold">
            <Plus className="h-4 w-4" /> Add new client
          </button>
        </div>

        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          <StatCard label="Total clients" value={CLIENTS.length.toString()} />
          <StatCard label="Analyses run" value={totalSessions.toString()} />
          <StatCard label="Revenue analysed" value={inr(totalRevenue)} />
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CLIENTS.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
            >
              <Link
                to="/clients/$id" params={{ id: c.id }}
                className="group block rounded-2xl border border-border/70 bg-card hover:border-gold/40 transition overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="h-14 w-14 rounded-2xl bg-surface-2 border border-border grid place-items-center text-3xl">
                      {c.icon}
                    </div>
                    <button className="text-muted-foreground hover:text-foreground p-1" onClick={(e) => e.preventDefault()}>
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-5">
                    <div className="font-display text-xl">{c.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-full border border-border bg-surface mr-2 text-foreground/80">{c.type}</span>
                      {c.location}, {c.city}
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Last analysed</div>
                      <div className="font-medium">{c.lastPeriod}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Revenue</div>
                      <div className="font-mono">{inr(c.lastRevenue)}</div>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full border ${ragColor[c.rag]}`}>
                      Repeat {c.repeatRate}%
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm text-gold opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition">
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="mt-5">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
                      <span>Months of data</span>
                      <span>{c.monthsOfData}/12</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full bg-gold-gradient" style={{ width: `${(c.monthsOfData / 12) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-surface/40 p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-3xl mt-2">{value}</div>
    </div>
  );
}