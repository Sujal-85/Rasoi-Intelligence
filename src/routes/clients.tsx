import { createFileRoute, Link, useNavigate, Outlet, useMatch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, ArrowRight, MoreVertical, ShieldAlert, Cpu, IndianRupee, Settings, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CLIENTS, inr } from "@/lib/mock/data";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/clients")({
  head: () => ({ meta: [{ title: "Admin Portal — Rasoi Intelligence" }, { name: "description", content: "Super Admin Control Center." }] }),
  component: ClientsLayout,
});

const ragColor = { green: "text-rag-green bg-rag-green/10 border-rag-green/30", amber: "text-rag-amber bg-rag-amber/10 border-rag-amber/30", red: "text-rag-red bg-rag-red/10 border-rag-red/30" };

/* Layout wrapper — renders <Outlet /> so child routes (clients.$id) can display */
function ClientsLayout() {
  const childMatch = useMatch({ from: "/clients/$id", shouldThrow: false });

  // If a child route is active (e.g. /clients/c1), render it directly via Outlet
  if (childMatch) {
    return <Outlet />;
  }

  // Otherwise render the admin clients list page
  return <ClientsPage />;
}

function ClientsPage() {
  const nav = useNavigate();
  const { userRole, loading: authLoading } = useAuth();
  const [adminTab, setAdminTab] = useState<"Clients" | "AI Usage" | "Payments">("Clients");
  const [clientsList, setClientsList] = useState<any[]>(CLIENTS);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!userRole) {
        nav({ to: "/login" });
      } else if (userRole !== "admin") {
        const fallbackId = sessionStorage.getItem("restaurantId") || "c1";
        nav({ to: "/clients/$id", params: { id: fallbackId } as any });
      }
    }
  }, [userRole, authLoading, nav]);

  useEffect(() => {
    async function loadRestaurants() {
      try {
        const { data, error } = await supabase
          .from("restaurants")
          .select("*");
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const mapped = data.map((c: any) => {
            const existing = CLIENTS.find(x => x.id === c.id || x.name.toLowerCase() === c.name.toLowerCase());
            return {
              id: c.id,
              name: c.name,
              type: c.type || "Fine Dining",
              location: c.location || "Mumbai",
              city: c.city || "Mumbai",
              icon: c.icon || "🍽️",
              capacity: c.capacity || 50,
              lastPeriod: existing?.lastPeriod || "March 2025",
              lastRevenue: existing?.lastRevenue || 1200000,
              repeatRate: existing?.repeatRate || 55,
              rag: (existing?.rag || "green") as any,
              monthsOfData: existing?.monthsOfData || 6,
              sessions: existing?.sessions || 5,
            };
          });
          
          // Merge default CLIENTS that might not be in DB to keep the dashboard rich
          const existingNames = new Set(mapped.map(m => m.name.toLowerCase()));
          const remainingClients = CLIENTS.filter(c => !existingNames.has(c.name.toLowerCase()));
          setClientsList([...mapped, ...remainingClients]);
        } else {
          setClientsList(CLIENTS);
        }
      } catch (err) {
        console.warn("Failed to fetch restaurants from Supabase, using mock CLIENTS:", err);
        setClientsList(CLIENTS);
      } finally {
        setDbLoading(false);
      }
    }
    loadRestaurants();
  }, []);

  if (authLoading || !userRole || userRole !== "admin") {
    return null;
  }

  const totalRevenue = clientsList.reduce((s, c) => s + c.lastRevenue, 0);
  const totalSessions = clientsList.reduce((s, c) => s + c.sessions, 0);

  // Mock Admin-specific details
  const usages = [
    { name: "Saffron Lounge (c1)", apiCalls: 1247, tokens: "3.4M tokens", computeTime: "42.5s", status: "Optimal" },
    { name: "The Spicy Tadka (c2)", apiCalls: 890, tokens: "2.1M tokens", computeTime: "28.1s", status: "Optimal" },
    { name: "Rasoi Express (c3)", apiCalls: 1560, tokens: "5.8M tokens", computeTime: "89.4s", status: "High Load" },
  ];

  const payments = [
    { name: "Saffron Lounge (c1)", plan: "Growth", amount: "₹2,499", dueDate: "05 June 2026", status: "Paid" },
    { name: "The Spicy Tadka (c2)", plan: "Starter", amount: "₹999", dueDate: "28 May 2026", status: "Payment Overdue" },
    { name: "Rasoi Express (c3)", plan: "Agency", amount: "₹5,999", dueDate: "01 June 2026", status: "Pending" },
  ];

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold">Super Admin Console</div>
            <h1 className="font-display text-4xl mt-2">Core Control Centre</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage system intelligence, usage limits, and client registrations.</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gold-gradient text-primary-foreground text-sm font-medium glow-gold">
            <Plus className="h-4 w-4" /> Register New Restaurant
          </button>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="mt-8 border-b border-border/80 flex gap-6 mb-8">
          {[
            { id: "Clients", label: "Registered Restaurants", icon: Users },
            { id: "AI Usage", label: "Client AI Engine Usage", icon: Cpu },
            { id: "Payments", label: "Outstanding Payments", icon: IndianRupee }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as any)}
              className={`relative py-3 text-sm flex items-center gap-2 transition ${adminTab === tab.id ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
            >
              <tab.icon className="h-4 w-4 text-gold/80" />
              {tab.label}
              {adminTab === tab.id && <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-gold-gradient" />}
            </button>
          ))}
        </div>

        {adminTab === "Clients" && (
          <>
            <div className="grid sm:grid-cols-3 gap-4">
              <StatCard label="Registered clients" value={clientsList.length.toString()} />
              <StatCard label="Analyses run" value={totalSessions.toString()} />
              <StatCard label="Revenue analysed" value={inr(totalRevenue)} />
            </div>

            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {clientsList.map((c, i) => (
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
                        <span className={`text-xs px-2 py-1 rounded-full border ${ragColor[c.rag as keyof typeof ragColor] || ragColor.green}`}>
                          Repeat {c.repeatRate}%
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm text-gold opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition">
                          Open <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {adminTab === "AI Usage" && (
          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
            <div className="p-6 border-b border-border/60">
              <h3 className="font-display text-lg">AI Token Usage & Limits</h3>
              <p className="text-xs text-muted-foreground">Real-time compute and API metrics logged for Gemini API integration.</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-surface/60 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">Restaurant</th>
                  <th className="text-left px-6 py-3 font-medium">Total API Queries</th>
                  <th className="text-left px-6 py-3 font-medium">Token Consumed</th>
                  <th className="text-left px-6 py-3 font-medium">Compute Duration</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {usages.map((u, i) => (
                  <tr key={i} className="border-t border-border/60 hover:bg-surface/40">
                    <td className="px-6 py-4 font-medium">{u.name}</td>
                    <td className="px-6 py-4 font-mono">{u.apiCalls}</td>
                    <td className="px-6 py-4 font-mono text-gold">{u.tokens}</td>
                    <td className="px-6 py-4 font-mono">{u.computeTime}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        u.status === "Optimal" ? "text-rag-green bg-rag-green/10 border-rag-green/20" : "text-rag-amber bg-rag-amber/10 border-rag-amber/20"
                      }`}>{u.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {adminTab === "Payments" && (
          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
            <div className="p-6 border-b border-border/60">
              <h3 className="font-display text-lg">Payment Status</h3>
              <p className="text-xs text-muted-foreground">Pending invoices and subscription logs across standard accounts.</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-surface/60 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">Restaurant</th>
                  <th className="text-left px-6 py-3 font-medium">Active Subscription Plan</th>
                  <th className="text-left px-6 py-3 font-medium">Outstanding Balance</th>
                  <th className="text-left px-6 py-3 font-medium">Invoice Due Date</th>
                  <th className="text-left px-6 py-3 font-medium">Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i} className="border-t border-border/60 hover:bg-surface/40">
                    <td className="px-6 py-4 font-medium">{p.name}</td>
                    <td className="px-6 py-4"><span className="inline-block px-2 py-0.5 bg-surface border border-border text-xs rounded-full">{p.plan}</span></td>
                    <td className="px-6 py-4 font-mono font-medium text-foreground">{p.amount}</td>
                    <td className="px-6 py-4 text-muted-foreground">{p.dueDate}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        p.status === "Paid" 
                          ? "text-rag-green bg-rag-green/10 border-rag-green/20" 
                          : p.status === "Pending" 
                            ? "text-rag-amber bg-rag-amber/10 border-rag-amber/20" 
                            : "text-rag-red bg-rag-red/10 border-rag-red/20"
                      }`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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