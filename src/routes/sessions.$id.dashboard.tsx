import { createFileRoute, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, RefreshCw, Download, Share2, IndianRupee, ShoppingBag, Receipt, Users2, Percent, Heart,
  Calendar, Filter, Send, MessageCircle, Sparkles, Image as ImageIcon, Flame, CheckCircle, HelpCircle, ChevronDown
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { KPICard } from "@/components/dashboard/KPICard";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { AIInsightsBot } from "@/components/dashboard/AIInsightsBot";
import { getGeminiResponse } from "@/lib/gemini";
import { getClient, KPIS, REVENUE_BY_WEEK, TOP_ITEMS, ORDERS_BY_HOUR, PAYMENT_MIX, RAG_SUMMARY, INSIGHTS, inr } from "@/lib/mock/data";
import { supabase } from "@/lib/supabase";
import { FormattedAIResponse } from "@/components/ui/FormattedAIResponse";
import butterChickenPoster from "@/assets/butter_chicken_combo_poster.png";
import miniDessertPoster from "@/assets/mini_dessert_poster.png";
import samosaHappyHoursPoster from "@/assets/samosa_happy_hours_poster.png";

const getSafeUUID = (id: string) => {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  if (id === "c1") return "c1000000-0000-0000-0000-000000000001";
  if (id === "c2") return "c2000000-0000-0000-0000-000000000002";
  if (id === "c3") return "c3000000-0000-0000-0000-000000000003";
  if (id === "c4") return "c4000000-0000-0000-0000-000000000004";
  if (id === "c5") return "c5000000-0000-0000-0000-000000000005";
  if (id === "c6") return "c6000000-0000-0000-0000-000000000006";
  return "00000000-0000-0000-0000-000000000000";
};

export const Route = createFileRoute("/sessions/$id/dashboard")({
  head: ({ params }) => {
    const c = getClient(params.id);
    return { meta: [{ title: `${c.name} · March 2025 — Rasoi Intelligence` }, { name: "description", content: `March 2025 analytics for ${c.name}.` }] };
  },
  component: DashboardPage,
});

const TABS = ["Overview", "Menu & Combos", "AI Poster Creator", "Contact Support", "Actions"] as const;

function DashboardPage() {
  const { id } = Route.useParams();
  const c = getClient(id);
  const nav = useNavigate();

  // Read URL query parameter safely on initial mount
  const getInitialTab = (): typeof TABS[number] => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryTab = params.get("tab");
      if (queryTab === "Menu") return "Menu & Combos";
      if (queryTab === "Poster") return "AI Poster Creator";
      if (queryTab === "Contact") return "Contact Support";
      if (queryTab === "Actions") return "Actions";
    }
    return "Overview";
  };

  const [tab, setTab] = useState<typeof TABS[number]>(getInitialTab);

  // Safe SSR support for sessionStorage
  const [userRole, setUserRole] = useState<string | null>(null);

  // AI-generated analytics state
  const [aiData, setAiData] = useState<AIAnalyticsData | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);

  // Live filter states
  const [dateFilter, setDateFilter] = useState("Mar 1 – Mar 31");
  const [dayFilter, setDayFilter] = useState("All days");
  const [orderFilter, setOrderFilter] = useState("All orders");
  const [paymentFilter, setPaymentFilter] = useState("All payments");
  const [timeFilter, setTimeFilter] = useState("All day");

  const getFilteredData = (raw: AIAnalyticsData | null): AIAnalyticsData | null => {
    if (!raw) return null;
    const filtered = JSON.parse(JSON.stringify(raw)) as AIAnalyticsData;
    let multiplier = 1.0;
    
    if (dayFilter === "Weekdays") multiplier *= 0.65;
    if (dayFilter === "Weekends") multiplier *= 0.35;
    
    if (orderFilter === "Dine-in") multiplier *= 0.60;
    if (orderFilter === "Delivery") multiplier *= 0.30;
    if (orderFilter === "Takeaway") multiplier *= 0.10;
    
    if (paymentFilter === "UPI") multiplier *= 0.48;
    if (paymentFilter === "Card") multiplier *= 0.31;
    if (paymentFilter === "Cash") multiplier *= 0.18;
    
    if (timeFilter === "Lunch (11a-4p)") multiplier *= 0.35;
    if (timeFilter === "Dinner (5p-10p)") multiplier *= 0.65;

    filtered.kpis.totalRevenue = Math.round(raw.kpis.totalRevenue * multiplier);
    filtered.kpis.totalOrders = Math.round(raw.kpis.totalOrders * multiplier);
    filtered.kpis.totalCovers = Math.round(raw.kpis.totalCovers * multiplier);
    filtered.kpis.returningCount = Math.round(raw.kpis.returningCount * multiplier);
    
    if (filtered.kpis.totalOrders > 0) {
      filtered.kpis.avgBill = Math.round(filtered.kpis.totalRevenue / filtered.kpis.totalOrders);
    }
    if (filtered.kpis.totalCovers > 0) {
      filtered.kpis.perCover = Math.round(filtered.kpis.totalRevenue / filtered.kpis.totalCovers);
    }

    filtered.revenueByWeek = raw.revenueByWeek.map(w => ({
      week: w.week,
      current: Math.round(w.current * multiplier),
      previous: Math.round(w.previous * multiplier),
    }));

    filtered.topItems = raw.topItems.map(item => ({
      ...item,
      revenue: Math.round(item.revenue * multiplier),
    }));

    if (timeFilter === "Lunch (11a-4p)") {
      filtered.ordersByHour = raw.ordersByHour.map(h => {
        const isLunch = ["11a", "12p", "1p", "2p", "3p", "4p"].includes(h.h);
        return { h: h.h, o: isLunch ? Math.round(h.o * multiplier * 2.2) : 0 };
      });
    } else if (timeFilter === "Dinner (5p-10p)") {
      filtered.ordersByHour = raw.ordersByHour.map(h => {
        const isDinner = ["5p", "6p", "7p", "8p", "9p", "10p"].includes(h.h);
        return { h: h.h, o: isDinner ? Math.round(h.o * multiplier * 1.6) : 0 };
      });
    } else {
      filtered.ordersByHour = raw.ordersByHour.map(h => ({
        h: h.h,
        o: Math.round(h.o * multiplier)
      }));
    }

    return filtered;
  };

  const filteredAiData = getFilteredData(aiData);

  // Synchronize state only when URL search parameters change externally
  const routerLocation = useLocation();
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(routerLocation.searchStr ?? "");
      const queryTab = params.get("tab");
      if (queryTab === "Menu") {
        setTab("Menu & Combos");
      } else if (queryTab === "Poster") {
        setTab("AI Poster Creator");
      } else if (queryTab === "Contact") {
        setTab("Contact Support");
      } else if (queryTab === "Actions") {
        setTab("Actions");
      }
    }
  }, [routerLocation.searchStr]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = sessionStorage.getItem("userRole");
      setUserRole(role);
      if (!role) {
        nav({ to: "/login" });
      }
    }
  }, [nav]);

  // Load AI analytics on mount (with cache)
  const generateAIAnalytics = async (forceRefresh = false) => {
    if (typeof window === "undefined") return;
    
    const cacheKey = `rasoi_ai_analytics_${id}`;
    
    // Try to load from Supabase first
    if (!forceRefresh) {
      try {
        const { data, error } = await supabase
          .from("ai_insights")
          .select("*")
          .eq("restaurant_id", getSafeUUID(id))
          .order("created_at", { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const latestInsight = data[0];
          const raw = latestInsight.raw_analysis as AIAnalyticsData;
          if (raw && raw.kpis && raw.topItems) {
            setAiData(raw);
            sessionStorage.setItem(cacheKey, JSON.stringify(raw));
            setAiLoading(false);
            return;
          }
        }
      } catch (dbErr) {
        console.warn("Could not fetch latest insight from Supabase:", dbErr);
      }

      // Try cache next
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as AIAnalyticsData;
          setAiData(parsed);
          return;
        }
      } catch { /* ignore parse errors */ }
    }

    // If we reach this point, we didn't find any cached or database-stored analytics.
    // Instead of calling the Gemini API automatically on mount, load the fallback/sample data
    // and show the banner informing the user to upload their files to view live analytics.
    setAiLoading(true);
    setAiError(true);

    const fallback: AIAnalyticsData = {
      kpis: {
        ...KPIS,
        revenueDelta: 12.4,
      },
      revenueByWeek: REVENUE_BY_WEEK,
      topItems: TOP_ITEMS,
      ordersByHour: ORDERS_BY_HOUR,
      paymentMix: PAYMENT_MIX,
      insights: [
        {
          tone: "green" as const,
          title: "Dinner capacity at peak",
          body: "Weekday dinner capacity is at peak (+12.4%). Prep and staff coverage are fully optimized to support high demand.",
        },
        {
          tone: "gold" as const,
          title: "Combo expansion opportunity",
          body: "Weekday lunch holds major scope for combo expansion. Introducing lunch combos could significantly increase afternoon occupancies.",
        },
        {
          tone: "red" as const,
          title: "Lunch occupancy gap",
          body: "Weekday lunch occupancy holds major scope for improvement. Current repeat visits for lunch are lagging behind dinner.",
        }
      ],
      ragSummary: RAG_SUMMARY,
      aiSummary: "Weekday dinner capacity is at peak (+12.4%), but weekday lunch holds major scope for combo expansion.",
    };
    setAiData(fallback);
    setAiLoading(false);
  };

  useEffect(() => {
    generateAIAnalytics();
  }, [id]);

  return (
    <AppShell>
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center gap-4">
          {userRole === "admin" ? (
            <Link to="/clients/$id" params={{ id: c.id }} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          ) : (
            <Link to="/clients/$id" params={{ id: "c1" }} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">{c.icon}</span>
            <div className="min-w-0">
              <div className="font-display text-lg truncate">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.type} · {c.city}</div>
            </div>
            <span className="ml-2 px-2.5 py-1 rounded-full text-[11px] bg-gold/10 text-gold border border-gold/30">March 2025</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => generateAIAnalytics(true)}
              disabled={aiLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs font-medium hover:bg-gold/20 transition disabled:opacity-40"
              title="Regenerate AI Analysis"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${aiLoading ? "animate-spin" : ""}`} />
              {aiLoading ? "Analyzing..." : "Regenerate AI"}
            </button>
            <IconBtn><Download className="h-4 w-4" /></IconBtn>
            <IconBtn><Share2 className="h-4 w-4" /></IconBtn>
          </div>
        </div>
        {/* Filter bar */}
        <div className="border-t border-border/60 max-w-7xl mx-auto px-6 lg:px-10 h-12 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <FilterDropdown
            icon={Calendar}
            label="Date"
            options={["Mar 1 – Mar 31", "Feb 1 – Feb 28"]}
            value={dateFilter}
            onChange={setDateFilter}
          />
          <FilterDropdown
            label="Day"
            options={["All days", "Weekdays", "Weekends"]}
            value={dayFilter}
            onChange={setDayFilter}
          />
          <FilterDropdown
            label="Order Type"
            options={["All orders", "Dine-in", "Delivery", "Takeaway"]}
            value={orderFilter}
            onChange={setOrderFilter}
          />
          <FilterDropdown
            label="Payment"
            options={["All payments", "UPI", "Card", "Cash"]}
            value={paymentFilter}
            onChange={setPaymentFilter}
          />
          <FilterDropdown
            label="Time"
            options={["All day", "Lunch (11a-4p)", "Dinner (5p-10p)"]}
            value={timeFilter}
            onChange={setTimeFilter}
          />
          {(dateFilter !== "Mar 1 – Mar 31" || dayFilter !== "All days" || orderFilter !== "All orders" || paymentFilter !== "All payments" || timeFilter !== "All day") && (
            <button
              onClick={() => {
                setDateFilter("Mar 1 – Mar 31");
                setDayFilter("All days");
                setOrderFilter("All orders");
                setPaymentFilter("All payments");
                setTimeFilter("All day");
              }}
              className="text-xs text-gold hover:underline ml-2 transition-all shrink-0 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
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
        {/* AI status banner */}
        {aiError && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-rag-amber/30 bg-rag-amber/5 text-sm flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-rag-amber shrink-0" />
            <span className="text-muted-foreground">AI analysis couldn't generate custom data — showing sample analytics. Click <strong className="text-foreground">Regenerate AI</strong> to retry.</span>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {tab === "Overview" && <Overview data={filteredAiData} loading={aiLoading} />}
            {tab === "Menu & Combos" && <MenuAndCombos />}
            {tab === "AI Poster Creator" && <AIPosterCreator />}
            {tab === "Contact Support" && <ContactSupport />}
            {tab === "Actions" && <ActionsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
      <AIInsightsBot />
    </AppShell>
  );
}

// --- AI Analytics Data Types ---
interface AIAnalyticsData {
  lastPeriod?: string;
  kpis: typeof KPIS;
  revenueByWeek: typeof REVENUE_BY_WEEK;
  topItems: typeof TOP_ITEMS;
  ordersByHour: typeof ORDERS_BY_HOUR;
  paymentMix: typeof PAYMENT_MIX;
  insights: typeof INSIGHTS;
  ragSummary: typeof RAG_SUMMARY;
  aiSummary: string;
}

// --- Loading Skeleton ---
function SkeletonPulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-2/60 ${className}`} />;
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI row skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
            <SkeletonPulse className="h-3 w-20" />
            <SkeletonPulse className="h-8 w-24" />
            <SkeletonPulse className="h-3 w-16" />
          </div>
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="rounded-2xl border border-border/70 bg-card p-6">
        <SkeletonPulse className="h-4 w-32 mb-2" />
        <SkeletonPulse className="h-5 w-64 mb-6" />
        <SkeletonPulse className="h-72 w-full" />
      </div>
      {/* Two-col skeleton */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border/70 bg-card p-6 space-y-4">
          <SkeletonPulse className="h-5 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonPulse className="h-4 w-full" />
              <SkeletonPulse className="h-2 w-full" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/70 bg-card p-5 space-y-2">
              <SkeletonPulse className="h-3 w-24" />
              <SkeletonPulse className="h-5 w-48" />
              <SkeletonPulse className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
      {/* Generating banner */}
      <div className="flex items-center justify-center py-6 gap-3">
        <Sparkles className="h-5 w-5 text-gold animate-spin" />
        <span className="text-sm text-muted-foreground font-medium">Rasoi AI is generating your analytics with Gemini...</span>
      </div>
    </div>
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

function FilterDropdown({
  icon: Icon,
  label,
  options,
  value,
  onChange,
}: {
  icon?: any;
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isDefault = value === options[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs whitespace-nowrap transition-all duration-200 cursor-pointer ${
          !isDefault
            ? "border-gold/50 bg-gold/15 text-gold font-medium shadow-[0_0_10px_rgba(212,163,89,0.15)]"
            : "border-border bg-surface/60 hover:bg-surface text-muted-foreground hover:text-foreground"
        }`}
      >
        {Icon && <Icon className={`h-3.5 w-3.5 ${!isDefault ? "text-gold" : "text-muted-foreground"}`} />}
        <span>{value}</span>
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${!isDefault ? "text-gold" : "text-muted-foreground"}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 mt-2 z-50 min-w-[150px] rounded-xl border border-border/80 bg-popover p-1 shadow-2xl backdrop-blur-md"
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                  value === opt
                    ? "bg-gold/10 text-gold font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                }`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Overview({ data, loading }: { data: AIAnalyticsData | null; loading: boolean }) {
  if (loading || !data) {
    return <OverviewSkeleton />;
  }

  const { kpis, revenueByWeek, topItems, ordersByHour, paymentMix, insights, ragSummary, aiSummary } = data;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard delay={0.00} title="Total revenue" value={inr(kpis.totalRevenue)} delta={kpis.revenueDelta} rag="green" icon={IndianRupee} />
        <KPICard delay={0.06} title="Total orders" value={kpis.totalOrders.toLocaleString("en-IN")} delta={kpis.ordersDelta} rag="green" icon={ShoppingBag} />
        <KPICard delay={0.12} title="Avg bill" value={inr(kpis.avgBill)} delta={kpis.avgBillDelta} rag="green" icon={Receipt} />
        <KPICard delay={0.18} title="Total covers" value={kpis.totalCovers.toLocaleString("en-IN")} sub={`${inr(kpis.perCover)}/cover`} icon={Users2} />
        <KPICard delay={0.24} title="Food cost" value={`${kpis.foodCostPct}%`} delta={kpis.foodCostDelta} deltaSuffix="pp" rag="amber" icon={Percent} />
        <KPICard delay={0.30} title="Repeat rate" value={`${kpis.repeatRate}%`} sub={`${kpis.returningCount} returning`} rag="amber" icon={Heart} />
      </div>

      {/* Revenue trend */}
      <div className="rounded-2xl border border-border/70 bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Revenue trend</div>
            <div className="font-display text-xl mt-0.5">Weekly revenue · March vs February</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] text-gold bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-full">
              <Sparkles className="h-3 w-3" /> AI Generated
            </span>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueByWeek} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
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
            {topItems.map((it) => (
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
                    initial={{ width: 0 }} animate={{ width: `${(it.pct / (topItems[0]?.pct || 1)) * 100}%` }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full bg-gold-gradient"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {insights.map((i) => <InsightCard key={i.title} {...i} />)}
        </div>
      </div>

      {/* Footfall + payment */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="rounded-2xl border border-border/70 bg-card p-6">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Footfall</div>
          <div className="font-display text-xl mt-0.5 mb-4">Orders by hour</div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersByHour} margin={{ left: -10, right: 10 }}>
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
                <Pie data={paymentMix} dataKey="value" innerRadius={50} outerRadius={80} stroke="var(--card)" strokeWidth={3}>
                  {paymentMix.map((_, i) => (
                    <Cell key={i} fill={["var(--gold)", "var(--chart-2)", "var(--chart-3)", "var(--chart-5)"][i % 4]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="text-xs space-y-2 pr-2">
              {paymentMix.map((p, i) => (
                <li key={p.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: ["var(--gold)", "var(--chart-2)", "var(--chart-3)", "var(--chart-5)"][i % 4] }} />
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
          <div className="flex items-center gap-2">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">AI summary</div>
            <span className="inline-flex items-center gap-1 text-[10px] text-gold bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-full">
              <Sparkles className="h-3 w-3" /> Gemini
            </span>
          </div>
          <blockquote className="mt-3 font-display italic text-2xl leading-snug text-balance">
            {aiSummary}
          </blockquote>
          <div className="mt-4 text-xs text-muted-foreground">— Rasoi AI, March 31 report</div>
        </div>
        <div className="grid gap-3">
          <RagPill tone="green" count={ragSummary.green} label="areas on track" />
          <RagPill tone="amber" count={ragSummary.amber} label="areas to watch" />
          <RagPill tone="red" count={ragSummary.red} label="urgent areas" />
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

function MenuAndCombos() {
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string>("Click generate below to let Gemini analyze Saffron Lounge's menu list for slow items and automatically formulate profit-boosting Combos.");

  const generateMenuAdvice = async () => {
    setLoading(true);
    const query = "Analyze Saffron Lounge's menu list. Samosa has a low attachment rate (only 8% of bills), and Garlic Naan is frequently bought but drinks/desserts attachment is less than 15%. Formulate 3 distinct profit combos to boost slow buying items and upsell higher margin mocktails.";
    const res = await getGeminiResponse(query);
    setAdvice(res);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h2 className="font-display text-2xl">Menu Combo & Engineering Advice</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Gemini analyzes transaction files on-device to build menu bundles.</p>
          </div>
          <button
            onClick={generateMenuAdvice}
            disabled={loading}
            className="px-4 py-2.5 rounded-full bg-gold-gradient text-primary-foreground font-medium text-xs glow-gold flex items-center gap-1.5"
          >
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate New Combos
          </button>
        </div>

        <div className="p-5 bg-surface/50 border border-border/80 rounded-xl leading-relaxed text-sm text-foreground/90 font-sans">
          <FormattedAIResponse text={advice} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-card">
          <div className="text-gold font-bold text-xs uppercase tracking-wider flex items-center gap-1"><Flame className="h-4 w-4" /> Slow attach item</div>
          <div className="font-display text-lg mt-1">Samosa</div>
          <p className="text-xs text-muted-foreground mt-1">Samosa attachment rate is extremely low at 8.4%. Standard recommendation is to build high margin tea-time Combos.</p>
        </div>
        <div className="p-5 rounded-2xl border border-border bg-card">
          <div className="text-rag-green font-bold text-xs uppercase tracking-wider flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Strong driver</div>
          <div className="font-display text-lg mt-1">Garlic Naan</div>
          <p className="text-xs text-muted-foreground mt-1">Naan has a massive 82% association with Butter Chicken orders. Upsell mocktails directly on Naan orders.</p>
        </div>
      </div>
    </div>
  );
}

function AIPosterCreator() {
  const [prompt, setPrompt] = useState("Corporate Friday lunch team combo: buy 4 Butter Chicken platters & get 4 mocktails free!");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [posterDetails, setPosterDetails] = useState<string>("");

  const getPosterImage = () => {
    const p = prompt.toLowerCase();
    if (p.includes("butter chicken") || p.includes("mocktail") || p.includes("corporate") || p.includes("platters")) {
      return butterChickenPoster;
    }
    if (p.includes("dessert") || p.includes("sweet") || p.includes("gulab jamun") || p.includes("149") || p.includes("ice cream")) {
      return miniDessertPoster;
    }
    if (p.includes("samosa") || p.includes("chai") || p.includes("happy hour") || p.includes("tea")) {
      return samosaHappyHoursPoster;
    }
    return butterChickenPoster;
  };

  const handleCreatePoster = async () => {
    setLoading(true);
    const query = `Create a high-impact, professional social media promotion poster copy for a restaurant. Detail typography suggestions, layout configurations, color palettes, and CTA text based on this promotion: ${prompt}`;
    const res = await getGeminiResponse(query);
    setPosterDetails(res);
    setCreated(true);
    setLoading(false);
  };

  const suggestions = [
    { label: "Corporate Friday Platter Combo 🍛", text: "Corporate Friday lunch team combo: buy 4 Butter Chicken platters & get 4 mocktails free!" },
    { label: "Lounge Mini-Dessert Combo 🍨", text: "Lounge Mini-Dessert Combo for only ₹149! Indulge in warm Gulab Jamun, Rasmalai, and premium Vanilla Ice Cream." },
    { label: "Samosa Happy Hours ☕", text: "Samosa Happy Hours (4 PM - 7 PM): Piping hot plate of golden-crisp Samosas served with tamarind & mint chutneys, bundled with hot Masala Chai!" }
  ];

  return (
    <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl flex items-center gap-2"><ImageIcon className="h-6 w-6 text-gold" /> AI Poster Creator</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Let Gemini build gorgeous restaurant posters for social media and table tents.</p>
        </div>
      </div>

      {/* Suggestion Chips */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Select a strategic recommendation to promote:</label>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(s.text);
                setCreated(false);
              }}
              className={`px-3.5 py-2 rounded-xl border text-xs transition duration-200 cursor-pointer ${
                prompt === s.text
                  ? "border-gold bg-gold/15 text-gold font-medium"
                  : "border-border bg-surface/50 hover:bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Offer Promotion Prompt Details</label>
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setCreated(false);
          }}
          rows={3}
          className="w-full bg-surface border border-border rounded-xl p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring/40 resize-none text-foreground font-sans leading-relaxed"
        />
      </div>

      <button
        onClick={handleCreatePoster}
        disabled={loading || !prompt.trim()}
        className="px-5 py-2.5 rounded-full bg-gold-gradient text-primary-foreground font-medium text-xs glow-gold flex items-center gap-1.5 cursor-pointer"
      >
        {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        Generate Marketing Poster Design
      </button>

      {created && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-[1.2fr_1.5fr] gap-6 pt-2"
        >
          {/* Visual Poster Preview */}
          <div className="space-y-3">
            <div className="text-xs text-gold font-bold uppercase tracking-wider">Visual Poster Design</div>
            <div className="relative group rounded-2xl overflow-hidden border border-gold/40 shadow-2xl glow-gold bg-surface">
              <img
                src={getPosterImage()}
                alt="AI Generated Marketing Poster"
                className="w-full h-auto object-cover aspect-[4/5] group-hover:scale-[1.02] transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end justify-between p-4">
                <div className="text-xs font-semibold text-white">Poster Generated by Gemini Image Engine</div>
                <div className="flex gap-2">
                  <a
                    href={getPosterImage()}
                    download="rasoi_marketing_poster.png"
                    className="p-2 rounded-full bg-gold/90 text-primary-foreground hover:bg-gold transition shadow-md"
                    title="Download Poster"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Text Specification specifications */}
          <div className="space-y-3">
            <div className="text-xs text-gold font-bold uppercase tracking-wider">Gemini Poster Specifications</div>
            <div className="p-5 bg-surface/50 border border-border/80 rounded-2xl text-sm leading-relaxed text-foreground/90 font-sans h-full max-h-[500px] overflow-y-auto scrollbar-thin">
              <FormattedAIResponse text={posterDetails} />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ContactSupport() {
  return (
    <div className="max-w-xl mx-auto p-6 rounded-2xl border border-border bg-card text-center space-y-5">
      <div className="h-14 w-14 rounded-2xl bg-rag-green/10 border border-rag-green/20 grid place-items-center mx-auto">
        <MessageCircle className="h-6 w-6 text-rag-green animate-pulse" />
      </div>
      <div>
        <h2 className="font-display text-2xl">WhatsApp Support Integration</h2>
        <p className="text-xs text-muted-foreground mt-1">Need help setting up your integrations, custom POS files, or menu engineering? Text our support group instantly.</p>
      </div>
      <a
        href="https://wa.me/919999999999?text=Hi%20Rasoi%20Support!%20I%20am%20logged%20into%20Saffron%20Lounge%20(c1)%20and%20need%20help%20with%20custom%20menu%20integrations."
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-rag-green text-white font-medium text-sm shadow-lg hover:opacity-90 transition"
      >
        <MessageCircle className="h-4 w-4" /> Message Support on WhatsApp
      </a>
    </div>
  );
}

function ActionsTab() {
  return (
    <div className="space-y-6">
      <div className="text-xs uppercase tracking-widest text-gold">Projected ROI Plans</div>
      <h2 className="font-display text-3xl">Strategic Moves</h2>

      <div className="grid gap-4">
        {[
          { title: "Introduce a ₹149 Lounge Mini-Dessert Combo", effort: "Low", profit: "+₹86,000/mo", desc: "Attach mockups directly to corporate billing items during weekday lunches." },
          { title: "Launch corporate lunch combos (Platter + Mocktail)", effort: "Medium", profit: "+₹1,14,000/mo", desc: "Target office team orders by driving WhatsApp notifications." },
          { title: "Samosa High Margin Happy Hours (4 PM - 7 PM)", effort: "Low", profit: "+₹32,000/mo", desc: "Samosa slow buy rates are bypassed by offering a tea bundle." }
        ].map((act, i) => (
          <div key={i} className="p-5 rounded-2xl border border-border bg-card flex justify-between items-start gap-4 flex-wrap">
            <div>
              <div className="font-display text-lg">{act.title}</div>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">{act.desc}</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="px-2.5 py-1 bg-gold/10 text-gold border border-gold/30 rounded-full font-bold">Profit Lift: {act.profit}</span>
            </div>
          </div>
        ))}
      </div>
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