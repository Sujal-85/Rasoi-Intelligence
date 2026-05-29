import { createFileRoute, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, ArrowRight, RefreshCw, Download, Upload, Share2, IndianRupee, ShoppingBag, Receipt, Users2, Percent, Heart,
  Calendar, Filter, Send, MessageCircle, Sparkles, Image as ImageIcon, Flame, CheckCircle, HelpCircle, ChevronDown,
  Search, Plus, Minus, Trash2, QrCode, Check, AlertTriangle, Coffee, Info, PhoneCall, ShoppingCart,
  FileBarChart, ClipboardList, AlertCircle
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
import { getClient, CLIENTS, KPIS, REVENUE_BY_WEEK, TOP_ITEMS, ORDERS_BY_HOUR, PAYMENT_MIX, RAG_SUMMARY, INSIGHTS, inr } from "@/lib/mock/data";
import { supabase } from "@/lib/supabase";
import { FormattedAIResponse } from "@/components/ui/FormattedAIResponse";
import butterChickenPoster from "@/assets/butter_chicken_combo_poster.png";
import miniDessertPoster from "@/assets/mini_dessert_poster.png";
import samosaHappyHoursPoster from "@/assets/samosa_happy_hours_poster.png";

// --- Types & Interfaces ---
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

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// --- Constants & Mock Data ---
const TABS = ["Pulse", "Register", "Stock", "Voice", "Menu & Combos", "AI Poster Creator", "Contact Support"] as const;

const MENU_ITEMS = [
  { id: "1", name: "Chicken Biryani", price: 320, category: "Biryani", veg: false },
  { id: "2", name: "Veg Biryani", price: 260, category: "Biryani", veg: true },
  { id: "3", name: "Mutton Biryani", price: 420, category: "Biryani", veg: false },
  { id: "4", name: "Butter Chicken", price: 380, category: "Curry", veg: false },
  { id: "5", name: "Paneer Butter Masala", price: 310, category: "Curry", veg: true },
  { id: "6", name: "Dal Makhani", price: 240, category: "Curry", veg: true },
  { id: "7", name: "Garlic Naan", price: 80, category: "Breads", veg: true },
  { id: "8", name: "Butter Naan", price: 60, category: "Breads", veg: true },
  { id: "9", name: "Tandoori Roti", price: 30, category: "Breads", veg: true },
  { id: "10", name: "Masala Chai", price: 50, category: "Drinks", veg: true },
  { id: "11", name: "Mango Lassi", price: 90, category: "Drinks", veg: true },
  { id: "12", name: "Gulab Jamun", price: 120, category: "Drinks", veg: true },
  { id: "13", name: "Soda", price: 60, category: "Drinks", veg: true },
];

const SUGGESTIONS = [
  { label: "Corporate Friday Platter Combo 🍛", text: "Corporate Friday lunch team combo: buy 4 Butter Chicken platters & get 4 mocktails free!" },
  { label: "Lounge Mini-Dessert Combo 🍨", text: "Lounge Mini-Dessert Combo for only ₹149! Indulge in warm Gulab Jamun, Rasmalai, and premium Vanilla Ice Cream." },
  { label: "Samosa Happy Hours ☕", text: "Samosa Happy Hours (4 PM - 7 PM): Piping hot plate of golden-crisp Samosas served with tamarind & mint chutneys, bundled with hot Masala Chai!" }
];

// --- Helper Functions ---
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

// --- Routing ---
export const Route = createFileRoute("/sessions/$id/dashboard")({
  head: ({ params }) => {
    const c = getClient(params.id);
    return { meta: [{ title: `${c.name} · March 2025 — Rasoi Intelligence` }, { name: "description", content: `March 2025 analytics for ${c.name}.` }] };
  },
  component: DashboardPage,
});

// --- Empty Workspace State Component ---
function EmptyWorkspaceState({ clientId, restaurantName }: { clientId: string; restaurantName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-dashed border-border/80 bg-card/50 backdrop-blur-md shadow-lg max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="h-16 w-16 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center animate-pulse">
        <Upload className="h-8 w-8 text-gold" />
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Setup {restaurantName} Workspace</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          This workspace is empty. To activate your operational insights, dashboards, and marketing toolkits, please upload your sales logs (CSV or Excel) at the file desk.
        </p>
      </div>
      <Link
        to="/clients/$id"
        params={{ id: clientId }}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold-gradient text-primary-foreground text-sm font-semibold shadow-lg hover:shadow-xl hover:opacity-95 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 glow-gold cursor-pointer"
      >
        Go to Upload Desk
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// --- Main Page Component ---
function DashboardPage() {
  const { id } = Route.useParams();
  const [client, setClient] = useState<any>(() => getClient(id));
  const nav = useNavigate();

  useEffect(() => {
    async function loadClient() {
      try {
        const { data, error } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", getSafeUUID(id))
          .single();
        if (!error && data) {
          const mockMatch = CLIENTS.find((x: any) => x.id === data.id || x.name.toLowerCase() === data.name.toLowerCase());
          setClient({
            id: data.id,
            name: data.name,
            type: data.type || "Fine Dining",
            location: data.location || "Mumbai",
            city: data.city || "Mumbai",
            icon: data.icon || "🍽️",
            capacity: data.capacity || 50,
            lastPeriod: mockMatch?.lastPeriod || "Never",
            lastRevenue: mockMatch?.lastRevenue || 0,
            repeatRate: mockMatch?.repeatRate || 0,
            rag: mockMatch?.rag || "green",
            monthsOfData: mockMatch?.monthsOfData || 0,
            sessions: mockMatch?.sessions || 0,
          });
          return;
        }
      } catch (err) {
        console.warn("Failed to fetch restaurant details from Supabase:", err);
      }

      // Check localStorage
      try {
        const localRestStr = localStorage.getItem("rasoi_local_restaurants");
        if (localRestStr) {
          const localList = JSON.parse(localRestStr);
          const found = localList.find((x: any) => x.id === id);
          if (found) {
            setClient({
              id: found.id,
              name: found.name,
              type: found.type || "Fine Dining",
              location: found.location || "Mumbai",
              city: found.city || "Mumbai",
              icon: found.icon || "🍽️",
              capacity: found.capacity || 50,
              lastPeriod: "Never",
              lastRevenue: 0,
              repeatRate: 0,
              rag: "green",
              monthsOfData: 0,
              sessions: 0,
            });
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch local restaurant:", err);
      }

      setClient(getClient(id));
    }
    loadClient();
  }, [id]);

  // Read URL query parameter safely on initial mount
  const getInitialTab = (): typeof TABS[number] => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryTab = params.get("tab");
      if (queryTab === "Menu") return "Menu & Combos";
      if (queryTab === "Poster") return "AI Poster Creator";
      if (queryTab === "Contact") return "Contact Support";
      if (queryTab === "Register") return "Register";
      if (queryTab === "Stock") return "Stock";
      if (queryTab === "Voice") return "Voice";
    }
    return "Pulse";
  };

  const [tab, setTab] = useState<typeof TABS[number]>(getInitialTab);
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
      } else if (queryTab === "Register") {
        setTab("Register");
      } else if (queryTab === "Stock") {
        setTab("Stock");
      } else if (queryTab === "Voice") {
        setTab("Voice");
      } else {
        setTab("Pulse");
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

  const generateAIAnalytics = async (forceRefresh = false) => {
    if (typeof window === "undefined") return;
    
    const cacheKey = `rasoi_ai_analytics_${id}`;
    const isMockClient = ["c1", "c2", "c3", "c4", "c5", "c6"].includes(id);
    
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

    if (!isMockClient) {
      setAiData(null);
      setAiLoading(false);
      setAiError(false);
      return;
    }

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
          tone: "green",
          title: "Dinner capacity at peak",
          body: "Weekday dinner capacity is at peak (+12.4%). Prep and staff coverage are fully optimized to support high demand.",
        },
        {
          tone: "gold",
          title: "Combo expansion opportunity",
          body: "Weekday lunch holds major scope for combo expansion. Introducing lunch combos could significantly increase afternoon occupancies.",
        },
        {
          tone: "red",
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

  const isWorkspaceEmpty = !aiLoading && aiData === null;
  const filteredAiData = getFilteredData(aiData);

  return (
    <AppShell>
      {/* Editorial Saffron header wrapper */}
      <div className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/clients" className="text-muted-foreground hover:text-foreground transition p-1">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xl">{client.icon}</span>
              <div>
                <h1 className="font-display font-bold text-base md:text-lg text-foreground tracking-tight">{client.name}</h1>
                <div className="text-[10px] text-muted-foreground font-medium md:block hidden">{client.type} · {client.city}</div>
              </div>
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-gold/10 text-gold border border-gold/30 font-semibold">Live Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => generateAIAnalytics(true)}
              disabled={aiLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-gold/40 bg-gold/5 text-gold text-xs font-semibold hover:bg-gold/10 transition disabled:opacity-40 cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${aiLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{aiLoading ? "Syncing..." : "Update AI Cache"}</span>
              <span className="sm:hidden">{aiLoading ? "..." : "Sync"}</span>
            </button>
            <IconBtn><Download className="h-4 w-4" /></IconBtn>
            <IconBtn><Share2 className="h-4 w-4" /></IconBtn>
          </div>
        </div>

        {/* Tab row (Desktop navigation) */}
        <div className="border-t border-border max-w-7xl mx-auto px-4 md:px-8 h-11 hidden md:flex items-center gap-1 overflow-x-auto scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                // Also update search params for URL parity
                const tabParam = t === "Menu & Combos" ? "Menu"
                  : t === "AI Poster Creator" ? "Poster"
                  : t === "Contact Support" ? "Contact"
                  : t;
                window.history.pushState({}, "", `?tab=${tabParam}`);
              }}
              className={`relative px-3.5 h-11 text-xs font-semibold tracking-wide transition cursor-pointer ${
                tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
              {tab === t && (
                <motion.span layoutId="tab-underline" className="absolute left-3 right-3 bottom-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 pb-24 md:pb-8">
        {/* Supabase Analytics Banner */}
        {aiError && !aiLoading && (
          <div className="mb-6 p-4 rounded-xl border border-gold/30 bg-gold-soft/10 text-xs flex items-start gap-2.5 shadow-sm">
            <Info className="h-4 w-4 text-gold shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-foreground">Showing Sample Workspace Data</div>
              <p className="text-muted-foreground mt-0.5">We could not pull the latest cache from Supabase. We are serving localized demo statistics. Go to <Link to="/clients/$id" params={{ id }} className="underline font-bold text-primary">Upload Data</Link> to refresh Supabase files.</p>
            </div>
          </div>
        )}

        {/* Filters bar (only shown in Pulse view to control chart metrics) */}
        {tab === "Pulse" && (
          <div className="mb-6 p-3 bg-card border border-border rounded-xl flex flex-wrap items-center gap-2 shadow-sm">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filters
            </div>
            <FilterDropdown
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
                className="text-[11px] font-semibold text-primary hover:underline ml-2 transition cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* Views Router */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {isWorkspaceEmpty && ["Pulse", "Voice", "Menu & Combos", "AI Poster Creator"].includes(tab) ? (
              <EmptyWorkspaceState clientId={id} restaurantName={client.name} />
            ) : (
              <>
                {tab === "Pulse" && <PulseView data={filteredAiData} loading={aiLoading} restaurantName={client.name} />}
                {tab === "Register" && <RegisterView restaurantName={client.name} />}
                {tab === "Stock" && <StockView restaurantName={client.name} isWorkspaceEmpty={isWorkspaceEmpty} />}
                {tab === "Voice" && <VoiceView />}
                {tab === "Menu & Combos" && <MenuAndCombosView restaurantName={client.name} />}
                {tab === "AI Poster Creator" && <AIPosterCreatorView />}
                {tab === "Contact Support" && <ContactSupportView />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile Sticky Bottom Nav Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex items-center justify-around h-16 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] px-2">
        {[
          { id: "Pulse", label: "Pulse", icon: FileBarChart },
          { id: "Register", label: "POS", icon: Receipt },
          { id: "Stock", label: "Stock", icon: ClipboardList },
          { id: "Voice", label: "Voice", icon: MessageCircle }
        ].map((m) => {
          const ActiveIcon = m.icon;
          const active = tab === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                setTab(m.id as any);
                window.history.pushState({}, "", `?tab=${m.id}`);
              }}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center cursor-pointer"
            >
              <ActiveIcon className={`h-5 w-5 transition ${active ? "text-primary scale-110" : "text-muted-foreground"}`} />
              <span className={`text-[10px] mt-1 transition ${active ? "text-primary font-bold" : "text-muted-foreground font-medium"}`}>{m.label}</span>
            </button>
          );
        })}
      </div>

      <AIInsightsBot />
    </AppShell>
  );
}

// --- View Component A: Today's Pulse (Dashboard) ---
function PulseView({ data, loading, restaurantName }: { data: AIAnalyticsData | null; loading: boolean; restaurantName: string }) {
  if (loading || !data) {
    return <OverviewSkeleton />;
  }

  const { kpis, revenueByWeek, topItems, ordersByHour, paymentMix, insights, ragSummary, aiSummary } = data;

  return (
    <div className="space-y-6">
      {/* 3 Core KPI cards as defined in wireframe */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition duration-200">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Today's Sales</div>
          <div className="font-display font-bold text-3xl mt-2 flex items-baseline gap-2">
            {inr(kpis.totalRevenue)}
            <span className="text-xs font-semibold text-rag-green flex items-center">▲ {kpis.revenueDelta}% vs yesterday</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Direct cash & digital transactions recorded in POS</p>
        </div>

        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition duration-200">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Orders</div>
          <div className="font-display font-bold text-3xl mt-2 flex items-baseline gap-2">
            {kpis.totalOrders} bills
            <span className="text-xs font-semibold text-rag-green">▲ 4 bills vs yesterday</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Average ticket fulfillment duration: 14 mins</p>
        </div>

        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition duration-200">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Average Bill Value</div>
          <div className="font-display font-bold text-3xl mt-2 flex items-baseline gap-2">
            {inr(kpis.avgBill)}
            <span className="text-xs font-semibold text-muted-foreground">Flat</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Dine-in attachments driving higher yields</p>
        </div>
      </div>

      {/* Live Business Actions Alerts */}
      <div className="p-6 bg-card border border-border rounded-2xl shadow-sm">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-primary" /> Live Business Opportunities
        </h2>
        <ul className="space-y-3.5">
          <li className="flex items-start gap-3 text-sm">
            <span className="p-1 rounded bg-amber-50 text-amber-600 mt-0.5 border border-amber-200 text-xs">⚠️ Stock alert</span>
            <div className="text-foreground font-medium">
              🍅 Tomato stock is running lower than usual. You have enough for only 1 day.
              <span className="block text-[11px] text-muted-foreground mt-0.5">Pre-empt weekend shortage: Order 10kg now to secure dinner curries.</span>
            </div>
          </li>
          <li className="flex items-start gap-3 text-sm">
            <span className="p-1 rounded bg-primary/10 text-primary mt-0.5 border border-primary/20 text-xs">💸 Operations</span>
            <div className="text-foreground font-medium">
              Weekend sales are consistently 35% higher. Increase kitchen staffing this Friday.
              <span className="block text-[11px] text-muted-foreground mt-0.5">Ensures wait times stay below 15 mins during rush peaks.</span>
            </div>
          </li>
          <li className="flex items-start gap-3 text-sm">
            <span className="p-1 rounded bg-green-50 text-green-700 mt-0.5 border border-green-200 text-xs">🍲 Menu check</span>
            <div className="text-foreground font-medium">
              Biryani category contributes 35% of total sales. Highlight it on your main menu card.
              <span className="block text-[11px] text-muted-foreground mt-0.5">Attach a high-margin cold beverage combo to Biryani to raise Average Bill Value.</span>
            </div>
          </li>
        </ul>
      </div>

      {/* Charts & Trends Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue Trend */}
        <div className="lg:col-span-2 p-6 bg-card border border-border rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Revenue Comparison</div>
              <h3 className="font-display font-semibold text-lg mt-0.5">Weekly Sales Trend</h3>
            </div>
            <div className="text-[10px] font-semibold text-muted-foreground bg-surface px-2.5 py-1 rounded-full border border-border">
              Current vs Previous Month
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByWeek} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gold-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => inr(v as number)} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => [inr(v), "Revenue"]}
                />
                <Area type="monotone" dataKey="previous" stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeWidth={1.5} fill="transparent" name="Prev Period" />
                <Area type="monotone" dataKey="current" stroke="var(--gold)" strokeWidth={2.5} fill="url(#gold-grad)" name="Current Period" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment mix percentage summary */}
        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Payment Methods</div>
            <h3 className="font-display font-semibold text-lg mt-0.5 mb-4">How Guests Paid</h3>
            <div className="h-44 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentMix} dataKey="value" innerRadius={42} outerRadius={68} stroke="var(--card)" strokeWidth={3}>
                    {paymentMix.map((_, i) => (
                      <Cell key={i} fill={["var(--gold)", "#E0CDAA", "#BAA682", "#9E8B67"][i % 4]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <ul className="text-xs space-y-2 mt-2 pt-2 border-t border-border">
            {paymentMix.map((p, i) => (
              <li key={p.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: ["var(--gold)", "#E0CDAA", "#BAA682", "#9E8B67"][i % 4] }} />
                  <span className="text-muted-foreground">{p.name}</span>
                </span>
                <span className="font-semibold text-foreground">{p.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Menu Highlights (Top vs Low performing) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Top Selling Items</div>
          <h3 className="font-display font-semibold text-lg mt-0.5 mb-4">Menu Drivers</h3>
          <div className="space-y-4">
            {topItems.slice(0, 3).map((it) => (
              <div key={it.name}>
                <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${it.veg ? "bg-rag-green" : "bg-rag-red"}`} />
                    {it.name}
                  </span>
                  <span>{inr(it.revenue)} ({it.pct.toFixed(0)}% contribution)</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                  <div className="h-full bg-gold-gradient" style={{ width: `${(it.pct / topItems[0].pct) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Low Performing Items</div>
            <h3 className="font-display font-semibold text-lg mt-0.5 mb-2">Attention Needed</h3>
            <p className="text-xs text-muted-foreground mb-4">Items with lagging repeat counts or slow daily volume:</p>
            <ul className="space-y-3">
              <li className="flex justify-between items-center text-xs">
                <span className="font-semibold text-foreground">1. Samosa Platter</span>
                <span className="text-rag-red font-bold px-2 py-0.5 bg-red-50 rounded border border-red-100">Only 8 sales this week</span>
              </li>
              <li className="flex justify-between items-center text-xs">
                <span className="font-semibold text-foreground">2. Lemon Soda</span>
                <span className="text-rag-amber font-bold px-2 py-0.5 bg-amber-50 rounded border border-amber-100">Only 3 sales this week</span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex justify-end">
            <span className="text-[11px] text-muted-foreground">Action recommendation: Bundle them inside Happy Hour menu combos</span>
          </div>
        </div>
      </div>

      {/* Guest voice reviews panel */}
      <div className="p-6 bg-card border border-border rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent Feedback Summary</div>
          <h3 className="font-display font-semibold text-lg text-foreground">"Guests love the Butter Chicken, but lunch wait times are high."</h3>
          <p className="text-xs text-muted-foreground">Derived from 48 verified customer comment sheets this month.</p>
        </div>
        <div className="p-4 bg-surface rounded-xl border border-border flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gold/10 grid place-items-center text-gold font-bold text-sm">94%</div>
          <div className="text-xs">
            <div className="font-semibold text-foreground">Guest Satisfaction</div>
            <div className="text-muted-foreground">Healthy rating (Green Zone)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- View Component B: Register (POS Billing Creator) ---
function RegisterView({ restaurantName }: { restaurantName: string }) {
  const { id } = Route.useParams();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0); // in percent
  const [qrOpen, setQrOpen] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);

  const categories = ["All", "Biryani", "Curry", "Breads", "Drinks"];
  
  const filteredMenu = MENU_ITEMS.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "All" || item.category === category;
    return matchesSearch && matchesCat;
  });

  const addToCart = (item: typeof MENU_ITEMS[0]) => {
    setCart((prev) => {
      const exist = prev.find((x) => x.id === item.id);
      if (exist) {
        return prev.map((x) => (x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x));
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, amount: number) => {
    setCart((prev) =>
      prev
        .map((x) => (x.id === id ? { ...x, quantity: Math.max(0, x.quantity + amount) } : x))
        .filter((x) => x.quantity > 0)
    );
  };

  const getSubtotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const getDiscountValue = () => (getSubtotal() * discount) / 100;
  const getTotal = () => getSubtotal() - getDiscountValue();

  const handleCharge = () => {
    if (cart.length === 0) return;
    setQrOpen(true);
  };

  const handlePaymentSuccess = () => {
    setQrOpen(false);
    setCheckedOut(true);
    setTimeout(() => {
      setCart([]);
      setDiscount(0);
      setCheckedOut(false);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
      {/* Menu list panel */}
      <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h2 className="font-display font-semibold text-xl">Quick Bill Creator (POS)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Quick menu selector for bill desk staff</p>
          </div>
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 border-b border-border scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground hover:bg-surface-2"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="p-4 bg-surface hover:bg-surface-2 border border-border hover:border-gold/30 rounded-xl text-left transition flex flex-col justify-between h-28 group relative cursor-pointer"
            >
              <div className="flex items-start justify-between w-full">
                <span className={`h-1.5 w-1.5 rounded-full ${item.veg ? "bg-rag-green" : "bg-rag-red"} shrink-0 mt-1`} />
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{item.category}</span>
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground truncate w-full group-hover:text-primary transition">{item.name}</div>
                <div className="text-xs font-bold text-foreground mt-1">₹{item.price}</div>
              </div>
              <div className="absolute right-3 bottom-3 h-6 w-6 rounded-full bg-card group-hover:bg-primary border border-border group-hover:border-primary flex items-center justify-center text-muted-foreground group-hover:text-primary-foreground transition shadow-sm">
                <Plus className="h-3 w-3" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart panel */}
      <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" /> Active Bill Cart
          </h2>
          <p className="text-[11px] text-muted-foreground">Applying to current table session</p>
        </div>

        {/* Cart items list */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[300px] min-h-[220px]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-2">
              <Receipt className="h-10 w-10 text-muted-foreground/30" />
              <div className="text-xs">No items added to current bill yet.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">{item.name}</div>
                    <div className="text-[10px] text-muted-foreground">₹{item.price} each</div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="h-6 w-6 rounded border border-border bg-surface flex items-center justify-center text-foreground hover:bg-surface-2 transition cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs font-bold font-mono w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="h-6 w-6 rounded border border-border bg-surface flex items-center justify-center text-foreground hover:bg-surface-2 transition cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <div className="text-xs font-bold text-foreground w-12 text-right">₹{item.price * item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pricing calculations & discounts */}
        <div className="p-6 bg-surface border-t border-border space-y-4">
          <div className="space-y-2.5">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select Discount Code</div>
            <div className="flex gap-2">
              {[
                { label: "None 0%", value: 0 },
                { label: "Corp 10%", value: 10 },
                { label: "Weekend 15%", value: 15 },
              ].map((disc) => (
                <button
                  key={disc.value}
                  onClick={() => setDiscount(disc.value)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                    discount === disc.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-surface-2"
                  }`}
                >
                  {disc.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 text-xs pt-2 border-t border-border/80">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-mono">₹{getSubtotal()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-primary font-medium">
                <span>Discount ({discount}%):</span>
                <span className="font-mono">-₹{getDiscountValue()}</span>
              </div>
            )}
            <div className="flex justify-between text-foreground font-bold text-sm pt-1.5 border-t border-dashed border-border">
              <span>Final Total to Collect:</span>
              <span className="font-mono">₹{getTotal()}</span>
            </div>
          </div>

          <button
            onClick={handleCharge}
            disabled={cart.length === 0}
            className="w-full py-3 rounded-full bg-gold-gradient text-primary-foreground font-bold text-xs shadow-md glow-gold hover:opacity-95 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer h-12"
          >
            {checkedOut ? (
              <>
                <Check className="h-4 w-4" /> Paid successfully!
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4" /> Charge & Present UPI QR
              </>
            )}
          </button>
        </div>

        {/* UPI QR Payment Modal / Drawer */}
        <AnimatePresence>
          {qrOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-5"
              >
                <div>
                  <h3 className="font-display font-semibold text-lg">UPI Payment Gateway</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{restaurantName} POS Checkout</p>
                </div>

                <div className="p-4 bg-white border border-border rounded-xl inline-block mx-auto">
                  {/* Decorative QR code */}
                  <div className="h-44 w-44 bg-surface rounded flex flex-col items-center justify-center border border-dashed border-border/80">
                    <QrCode className="h-28 w-28 text-foreground" />
                    <span className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-wide">Scan with PhonePe / GPay</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="text-muted-foreground">Amount to Collect:</div>
                  <div className="text-lg font-bold font-mono text-foreground">₹{getTotal()}</div>
                  <div className="text-[10px] text-muted-foreground">Merchant VPA: <span className="font-mono font-bold text-foreground">rasoi.{id}@upi</span></div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setQrOpen(false)}
                    className="flex-1 py-2.5 rounded-full border border-border text-xs font-semibold text-muted-foreground hover:bg-surface transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePaymentSuccess}
                    className="flex-1 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-95 transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Confirm Paid
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- View Component C: Stock Room ---
function StockView({ restaurantName, isWorkspaceEmpty = false }: { restaurantName: string; isWorkspaceEmpty?: boolean }) {
  const [checklist, setChecklist] = useState([
    { id: "tom", name: "Tomato (Fresh Plum)", quantity: "10kg", urgency: "Urgent", supplier: "Nizam Veg Dist", status: "low", warning: "Tomato stock will expire in 24 hours" },
    { id: "ric", name: "Basmati Rice (Dehradun)", quantity: "25kg", urgency: "Medium", supplier: "Aggarwal Wholesale Grains", status: "low", warning: "" },
    { id: "oil", name: "Refined Sunflower Oil", quantity: "15L", urgency: "Medium", supplier: "Aggarwal Wholesale Grains", status: "ok", warning: "" },
  ]);

  const [ordered, setOrdered] = useState<Record<string, boolean>>({});

  const handleWhatsappOrder = (item: typeof checklist[0]) => {
    const text = `Hi! This is the manager at ${restaurantName}. Please deliver ${item.quantity} of ${item.name} as soon as possible. Thank you!`;
    const encoded = encodeURIComponent(text);
    const link = `https://wa.me/919999999999?text=${encoded}`;
    
    // Open whatsapp link
    window.open(link, "_blank");
    
    // Mark as ordered
    setOrdered((prev) => ({ ...prev, [item.id]: true }));
  };

  if (isWorkspaceEmpty) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm">
          <h2 className="font-display font-semibold text-xl">Stock Room & Reorder Checklist</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Automated procurement assistance based on daily ingredient velocity</p>
        </div>
        <div className="p-8 text-center bg-card border border-border rounded-2xl shadow-sm max-w-xl mx-auto space-y-4">
          <div className="h-12 w-12 rounded-xl bg-muted/20 border border-border/80 flex items-center justify-center mx-auto text-muted-foreground">
            <ClipboardList className="h-6 w-6" />
          </div>
          <h3 className="font-display text-lg font-semibold">Inventory Tracker Locked</h3>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Procurement velocity checklists generate automatically once billing logs are loaded. Please upload POS transaction history in the workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 bg-card border border-border rounded-2xl shadow-sm">
        <h2 className="font-display font-semibold text-xl">Stock Room & Reorder Checklist</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Automated procurement assistance based on daily ingredient velocity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        {/* Reorder checklist */}
        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Suggested Reorder Checklist</h3>
          
          <div className="space-y-3">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-surface border border-border rounded-xl flex items-center justify-between gap-4 flex-wrap hover:border-gold/30 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs md:text-sm text-foreground">{item.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      item.urgency === "Urgent" 
                        ? "bg-red-50 text-rag-red border-red-100" 
                        : "bg-amber-50 text-rag-amber border-amber-100"
                    }`}>
                      {item.urgency}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Suggested quantity: <strong className="text-foreground">{item.quantity}</strong> · Supplier: {item.supplier}
                  </div>
                  {item.warning && (
                    <div className="text-[10px] text-rag-red font-semibold flex items-center gap-1 mt-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      {item.warning}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleWhatsappOrder(item)}
                    className={`h-9 px-4 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      ordered[item.id]
                        ? "bg-green-50 border border-green-200 text-rag-green hover:bg-green-100"
                        : "bg-gold-gradient text-primary-foreground shadow glow-gold"
                    }`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {ordered[item.id] ? "Ordered again" : "Order via WhatsApp"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Waste warnings and logistics tips */}
        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Expiration & Waste Warnings</h3>
          
          <div className="p-4 rounded-xl border border-red-100 bg-red-50/50 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-rag-red">
              <AlertCircle className="h-4 w-4 shrink-0" /> Expiration Warning
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tomato stock (2kg) will expire in 24 hours. Current sales velocity indicates only 1.2kg will be consumed before spoiling.
            </p>
            <div className="text-[10px] font-bold text-rag-red">Recommended action: Cook extra Tomato Soup base tonight and freeze it.</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-surface space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Info className="h-4 w-4 text-primary shrink-0" /> Stocking Smart Tip
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Rice stocking holds 6 days of runway. Supplier Nizam Veg Dist charges ₹20 less per kg on bulk order minimums above 35kg.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- View Component D: Voice (Feedback Hub) ---
function VoiceView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6">
      {/* Happiness scores */}
      <div className="p-6 bg-card border border-border rounded-2xl shadow-sm flex flex-col justify-between">
        <div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Guest Opinion Hub</div>
          <h2 className="font-display font-semibold text-xl mt-0.5">Guest Satisfaction Score</h2>
          <p className="text-xs text-muted-foreground mt-1">Overall rating compiled from digital checkout slips and Google Reviews</p>

          <div className="py-8 flex flex-col items-center justify-center">
            <div className="h-32 w-32 rounded-full border-[8px] border-primary/10 border-t-primary flex items-center justify-center relative shadow-inner animate-pulse">
              <div className="text-center">
                <span className="font-display font-bold text-4xl text-foreground">94%</span>
                <span className="block text-[10px] text-rag-green font-bold mt-0.5">EXCELLENT</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center max-w-xs">Guests praise food taste and warm service, while noting slightly slow checkouts during Sunday lunches.</p>
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-border">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Core Sentiment Breakdown</div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Food Taste & Quality</span>
            <span className="font-semibold text-rag-green">98% Satisfied</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Staff & Friendliness</span>
            <span className="font-semibold text-rag-green">95% Satisfied</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Speed of Service</span>
            <span className="font-semibold text-rag-amber">84% Satisfied</span>
          </div>
        </div>
      </div>

      {/* Review details */}
      <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Top Mentions & Complaints</h3>

        <div className="space-y-3.5">
          <div className="p-4 bg-green-50/40 border border-green-100 rounded-xl space-y-1.5">
            <div className="text-xs font-bold text-rag-green flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" /> Top Compliments
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              "The Butter Chicken has the perfect creaminess. Staff offered us complimentary dessert because we had kids with us. Fantastic!"
            </p>
          </div>

          <div className="p-4 bg-red-50/40 border border-red-100 rounded-xl space-y-1.5">
            <div className="text-xs font-bold text-rag-red flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Common Issues
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              "Waited almost 25 minutes for our table. The POS UPI billing machine took 2 tries to generate the scan code."
            </p>
          </div>

          <div className="p-4 bg-surface border border-border rounded-xl space-y-1">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Staff Action Item</div>
            <p className="text-xs text-foreground font-medium">
              Keep table turnovers quick during lunch hours. Suggest guests use the UPI POS code to settle payments before desserts are served.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- View Component E: Menu Combo Engineering (Existing AI Engine) ---
function MenuAndCombosView({ restaurantName }: { restaurantName: string }) {
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string>("Click generate below to let Gemini analyze menu metrics for slow items and automatically formulate profit-boosting Combos.");

  const generateMenuAdvice = async () => {
    setLoading(true);
    const query = `Analyze ${restaurantName}'s menu list. Samosa has a low attachment rate (only 8% of bills), and Garlic Naan is frequently bought but drinks/desserts attachment is less than 15%. Formulate 3 distinct profit combos to boost slow buying items and upsell higher margin mocktails.`;
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
            <p className="text-xs text-muted-foreground mt-0.5">Gemini analyzes transaction files to build profit-maximizing menu bundles.</p>
          </div>
          <button
            onClick={generateMenuAdvice}
            disabled={loading}
            className="px-4 py-2.5 rounded-full bg-gold-gradient text-primary-foreground font-bold text-xs shadow-md glow-gold flex items-center gap-1.5 cursor-pointer h-10"
          >
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate New Combos
          </button>
        </div>

        <div className="p-5 bg-surface border border-border rounded-xl leading-relaxed text-sm text-foreground/90 font-sans">
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

// --- View Component F: AI Poster Creator (Existing AI Engine) ---
function AIPosterCreatorView() {
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
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Select a strategic recommendation to promote:</label>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(s.text);
                setCreated(false);
              }}
              className={`px-3.5 py-2 rounded-xl border text-xs transition duration-200 cursor-pointer ${
                prompt === s.text
                  ? "border-gold bg-gold/10 text-gold font-semibold"
                  : "border-border bg-surface hover:bg-surface-2 text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Offer Promotion Prompt Details</label>
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setCreated(false);
          }}
          rows={3}
          className="w-full bg-surface border border-border rounded-xl p-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none text-foreground font-sans leading-relaxed"
        />
      </div>

      <button
        onClick={handleCreatePoster}
        disabled={loading || !prompt.trim()}
        className="px-5 py-2.5 rounded-full bg-gold-gradient text-primary-foreground font-bold text-xs shadow-md glow-gold flex items-center gap-1.5 cursor-pointer h-10"
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
            <div className="relative group rounded-2xl overflow-hidden border border-gold/40 shadow bg-surface">
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
            <div className="p-5 bg-surface border border-border rounded-2xl text-sm leading-relaxed text-foreground/90 font-sans h-full max-h-[500px] overflow-y-auto scrollbar-thin">
              <FormattedAIResponse text={posterDetails} />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// --- View Component G: Contact Support ---
function ContactSupportView() {
  return (
    <div className="max-w-xl mx-auto p-6 bg-card rounded-2xl border border-border text-center space-y-5 shadow-sm">
      <div className="h-14 w-14 rounded-2xl bg-rag-green/10 border border-rag-green/20 grid place-items-center mx-auto">
        <MessageCircle className="h-6 w-6 text-rag-green animate-pulse" />
      </div>
      <div>
        <h2 className="font-display font-semibold text-2xl">WhatsApp Support Integration</h2>
        <p className="text-xs text-muted-foreground mt-1">Need help setting up your integrations, custom POS files, or menu engineering? Contact our support team instantly.</p>
      </div>
      <a
        href="https://wa.me/919999999999?text=Hi%20Rasoi%20Support!%20I%20need%20help%20with%20custom%20menu%20integrations."
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-rag-green text-white font-bold text-sm shadow hover:opacity-90 transition cursor-pointer"
      >
        <MessageCircle className="h-4 w-4" /> Message Support on WhatsApp
      </a>
    </div>
  );
}

// --- Subcomponents & Shared Utilities ---
function SkeletonPulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-2 ${className}`} />;
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <SkeletonPulse className="h-3 w-20" />
            <SkeletonPulse className="h-8 w-24" />
            <SkeletonPulse className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <SkeletonPulse className="h-4 w-32 mb-2" />
        <SkeletonPulse className="h-5 w-64 mb-6" />
        <SkeletonPulse className="h-72 w-full" />
      </div>
    </div>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return <button className="h-9 w-9 rounded-full border border-border bg-surface hover:bg-surface-2 grid place-items-center text-muted-foreground hover:text-foreground transition cursor-pointer">{children}</button>;
}

function FilterDropdown({
  label,
  options,
  value,
  onChange,
}: {
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
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition duration-150 cursor-pointer ${
          !isDefault
            ? "border-primary bg-primary/10 text-primary font-bold"
            : "border-border bg-surface hover:bg-surface-2 text-muted-foreground hover:text-foreground"
        }`}
      >
        <span>{value}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute left-0 mt-1.5 z-50 min-w-[140px] rounded-xl border border-border bg-popover p-1 shadow-lg"
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
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface"
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