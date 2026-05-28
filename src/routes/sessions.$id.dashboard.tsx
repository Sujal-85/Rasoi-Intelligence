import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, RefreshCw, Download, Share2, IndianRupee, ShoppingBag, Receipt, Users2, Percent, Heart,
  Calendar, Filter,
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { KPICard } from "@/components/dashboard/KPICard";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { getClient, KPIS, REVENUE_BY_WEEK, TOP_ITEMS, ORDERS_BY_HOUR, PAYMENT_MIX, RAG_SUMMARY, INSIGHTS, inr } from "@/lib/mock/data";

export const Route = createFileRoute("/sessions/$id/dashboard")({
  head: ({ params }) => {
    const c = getClient(params.id);
    return { meta: [{ title: `${c.name} · March 2025 — Rasoi Intelligence` }, { name: "description", content: `March 2025 analytics for ${c.name}.` }] };
  },
  component: DashboardPage,
});

const TABS = ["Overview", "Month-on-Month", "Menu", "Daypart", "Footfall", "Customers", "Predictions", "Actions"] as const;

function DashboardPage() {
  const { id } = Route.useParams();
  const c = getClient(id);
  const [tab, setTab] = useState<typeof TABS[number]>("Overview");

  return (
    <AppShell>
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center gap-4">
          <Link to="/clients/$id" params={{ id: c.id }} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">{c.icon}</span>
            <div className="min-w-0">
              <div className="font-display text-lg truncate">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.type} · {c.city}</div>
            </div>
            <span className="ml-2 px-2.5 py-1 rounded-full text-[11px] bg-gold/10 text-gold border border-gold/30">March 2025</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <IconBtn><RefreshCw className="h-4 w-4" /></IconBtn>
            <IconBtn><Download className="h-4 w-4" /></IconBtn>
            <IconBtn><Share2 className="h-4 w-4" /></IconBtn>
          </div>
        </div>
        {/* Filter bar */}
        <div className="border-t border-border/60 max-w-7xl mx-auto px-6 lg:px-10 h-12 flex items-center gap-2 overflow-x-auto">
          <FilterPill icon={Calendar} label="Mar 1 – Mar 31" />
          <FilterPill label="All days" />
          <FilterPill label="All orders" />
          <FilterPill label="All payments" />
          <FilterPill label="All day" />
          <FilterPill icon={Filter} label="More filters" />
        </div>
        {/* Tabs */}
        <div className="border-t border-border/60 max-w-7xl mx-auto px-6 lg:px-10 h-12 flex items-center gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t} onClick={() => setTab(t)}
              className={`relative px-3 h-12 text-sm whitespace-nowrap transition ${tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t}
              {tab === t && (
                <motion.span layoutId="tab-underline" className="absolute left-3 right-3 bottom-0 h-0.5 bg-gold-gradient" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {tab === "Overview" ? <Overview /> : <Placeholder name={tab} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return <button className="h-9 w-9 rounded-full border border-border bg-surface/60 hover:bg-surface grid place-items-center text-muted-foreground hover:text-foreground transition">{children}</button>;
}

function FilterPill({ icon: Icon, label }: { icon?: typeof Calendar; label: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface/60 hover:bg-surface text-xs whitespace-nowrap">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      {label}
    </button>
  );
}

function Overview() {
  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard delay={0.00} title="Total revenue" value={inr(KPIS.totalRevenue)} delta={KPIS.revenueDelta} rag="green" icon={IndianRupee} />
        <KPICard delay={0.06} title="Total orders" value={KPIS.totalOrders.toLocaleString("en-IN")} delta={KPIS.ordersDelta} rag="green" icon={ShoppingBag} />
        <KPICard delay={0.12} title="Avg bill" value={inr(KPIS.avgBill)} delta={KPIS.avgBillDelta} rag="green" icon={Receipt} />
        <KPICard delay={0.18} title="Total covers" value={KPIS.totalCovers.toLocaleString("en-IN")} sub={`${inr(KPIS.perCover)}/cover`} icon={Users2} />
        <KPICard delay={0.24} title="Food cost" value={`${KPIS.foodCostPct}%`} delta={KPIS.foodCostDelta} deltaSuffix="pp" rag="amber" icon={Percent} />
        <KPICard delay={0.30} title="Repeat rate" value={`${KPIS.repeatRate}%`} sub={`${KPIS.returningCount} returning`} rag="amber" icon={Heart} />
      </div>

      {/* Revenue trend */}
      <div className="rounded-2xl border border-border/70 bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Revenue trend</div>
            <div className="font-display text-xl mt-0.5">Weekly revenue · March vs February</div>
          </div>
          <button className="text-xs text-muted-foreground hover:text-foreground border border-border bg-surface/50 px-3 py-1.5 rounded-full">
            Compare with last month
          </button>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={REVENUE_BY_WEEK} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gold-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => inr(v as number)} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => inr(v)}
              />
              <Area type="monotone" dataKey="previous" stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeWidth={1.5} fill="transparent" />
              <Area type="monotone" dataKey="current" stroke="var(--gold)" strokeWidth={2.5} fill="url(#gold-grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-col: top items + insights */}
      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
        <div className="rounded-2xl border border-border/70 bg-card p-6">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Top items</div>
          <div className="font-display text-xl mt-0.5 mb-4">By revenue</div>
          <div className="space-y-3">
            {TOP_ITEMS.map((it) => (
              <div key={it.name} className="group">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${it.veg ? "bg-rag-green" : "bg-rag-red"}`} />
                    <span className="font-medium">{it.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono">{inr(it.revenue)}</span>
                    <span className="text-muted-foreground w-10 text-right">{it.pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${(it.pct / TOP_ITEMS[0].pct) * 100}%` }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full bg-gold-gradient"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {INSIGHTS.map((i) => <InsightCard key={i.title} {...i} />)}
        </div>
      </div>

      {/* Footfall + payment */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="rounded-2xl border border-border/70 bg-card p-6">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Footfall</div>
          <div className="font-display text-xl mt-0.5 mb-4">Orders by hour</div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ORDERS_BY_HOUR} margin={{ left: -10, right: 10 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="h" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--surface-2)" }}
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="o" fill="var(--gold)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Payment mix</div>
          <div className="font-display text-xl mt-0.5 mb-4">How they paid</div>
          <div className="h-60 grid grid-cols-[1fr_auto] items-center gap-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PAYMENT_MIX} dataKey="value" innerRadius={50} outerRadius={80} stroke="var(--card)" strokeWidth={3}>
                  {PAYMENT_MIX.map((_, i) => (
                    <Cell key={i} fill={["var(--gold)", "var(--chart-2)", "var(--chart-3)", "var(--chart-5)"][i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="text-xs space-y-2 pr-2">
              {PAYMENT_MIX.map((p, i) => (
                <li key={p.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: ["var(--gold)", "var(--chart-2)", "var(--chart-3)", "var(--chart-5)"][i] }} />
                  <span className="text-muted-foreground">{p.name}</span>
                  <span className="font-mono ml-2">{p.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* RAG + narrative */}
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        <div className="rounded-2xl border border-border/70 bg-card p-7">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">AI summary</div>
          <blockquote className="mt-3 font-display italic text-2xl leading-snug text-balance">
            "March was a strong month at the top — revenue lifted 12.4% on the back of dinner. But your lunch service is quietly slipping, and one in three guests still leaves without a dessert. Both are fixable next week."
          </blockquote>
          <div className="mt-4 text-xs text-muted-foreground">— Rasoi AI, March 31 report</div>
        </div>
        <div className="grid gap-3">
          <RagPill tone="green" count={RAG_SUMMARY.green} label="areas on track" />
          <RagPill tone="amber" count={RAG_SUMMARY.amber} label="areas to watch" />
          <RagPill tone="red" count={RAG_SUMMARY.red} label="urgent areas" />
        </div>
      </div>
    </div>
  );
}

function RagPill({ tone, count, label }: { tone: "green" | "amber" | "red"; count: number; label: string }) {
  const cls = tone === "green" ? "border-rag-green/30 bg-rag-green/5 text-rag-green"
    : tone === "amber" ? "border-rag-amber/30 bg-rag-amber/5 text-rag-amber"
    : "border-rag-red/30 bg-rag-red/5 text-rag-red";
  return (
    <div className={`rounded-2xl border p-5 flex items-center gap-4 ${cls}`}>
      <div className="font-display text-4xl">{count}</div>
      <div className="text-sm text-foreground">{label}</div>
    </div>
  );
}

function Placeholder({ name }: { name: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/30 p-16 text-center">
      <div className="font-display text-2xl">{name}</div>
      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
        This tab is wired up — full charts and insights ship in the next iteration. Open Overview to see the live demo data.
      </p>
    </div>
  );
}