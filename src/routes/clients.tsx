import { createFileRoute, Link, useNavigate, Outlet, useMatch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, ArrowRight, MoreVertical, ShieldAlert, Cpu, IndianRupee, Settings, Users, CheckCircle2, AlertCircle, Zap, CreditCard } from "lucide-react";
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
  const { userRole, loading: authLoading, user } = useAuth();
  const [adminTab, setAdminTab] = useState<"Clients" | "AI Usage" | "Payments">("Clients");
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  // Registration Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regType, setRegType] = useState("Fine Dining");
  const [regCapacity, setRegCapacity] = useState("60");
  const [regLocation, setRegLocation] = useState("");
  const [regCity, setRegCity] = useState("Mumbai");
  const [regIcon, setRegIcon] = useState("🍽️");
  const [regError, setRegError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!userRole) {
        nav({ to: "/login" });
      } else if (userRole !== "admin") {
        const fallbackId = sessionStorage.getItem("restaurantId") || "c1";
        nav({ to: "/sessions/$id/dashboard", params: { id: fallbackId } as any });
      }
    }
  }, [userRole, authLoading, nav]);

  useEffect(() => {
    async function loadRestaurants() {
      try {
        // Load custom local storage restaurants first
        const localRestStr = typeof window !== "undefined" ? localStorage.getItem("rasoi_local_restaurants") : null;
        const localRestaurants = localRestStr ? JSON.parse(localRestStr) : [];
        const localMapped = localRestaurants.map((c: any) => ({
          id: c.id,
          name: c.name,
          type: c.type || "Fine Dining",
          location: c.location || "Mumbai",
          city: c.city || "Mumbai",
          icon: c.icon || "🍽️",
          capacity: c.capacity || 50,
          lastPeriod: "Never",
          lastRevenue: 0,
          repeatRate: 0,
          rag: "green" as const,
          monthsOfData: 0,
          sessions: 0
        }));

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
          
          // Merge local restaurants that might not be in DB
          const existingNames = new Set(mapped.map(m => m.name.toLowerCase()));
          const remainingLocal = localMapped.filter((c: any) => !existingNames.has(c.name.toLowerCase()));
          
          setClientsList([...mapped, ...remainingLocal]);
        } else {
          setClientsList(localMapped);
        }
      } catch (err) {
        console.warn("Failed to fetch restaurants from Supabase, using mock + local CLIENTS:", err);
        const localRestStr = typeof window !== "undefined" ? localStorage.getItem("rasoi_local_restaurants") : null;
        const localRestaurants = localRestStr ? JSON.parse(localRestStr) : [];
        const localMapped = localRestaurants.map((c: any) => ({
          id: c.id,
          name: c.name,
          type: c.type || "Fine Dining",
          location: c.location || "Mumbai",
          city: c.city || "Mumbai",
          icon: c.icon || "🍽️",
          capacity: c.capacity || 50,
          lastPeriod: "Never",
          lastRevenue: 0,
          repeatRate: 0,
          rag: "green" as const,
          monthsOfData: 0,
          sessions: 0
        }));
        
        setClientsList(localMapped);
      } finally {
        setDbLoading(false);
      }
    }
    loadRestaurants();
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const newId = "c_" + Math.random().toString(36).substr(2, 9);
    const newRestaurantData = {
      name: regName,
      email: regEmail,
      type: regType,
      capacity: Number(regCapacity),
      location: regLocation,
      city: regCity,
      icon: regIcon,
    };

    try {
      // 1. Try saving to Supabase first
      const { data, error } = await supabase
        .from("restaurants")
        .insert({
          ...newRestaurantData,
          owner_id: user?.id || null, // Align with current logged in admin
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const newClientItem = {
          id: data.id,
          name: data.name,
          type: data.type || "Fine Dining",
          location: data.location || "Mumbai",
          city: data.city || "Mumbai",
          icon: data.icon || "🍽️",
          capacity: data.capacity || 0,
          lastPeriod: "Never",
          lastRevenue: 0,
          repeatRate: 0,
          rag: "green" as const,
          monthsOfData: 0,
          sessions: 0,
        };
        setClientsList(prev => [newClientItem, ...prev]);
        setShowRegisterModal(false);
        // Clear fields
        setRegName("");
        setRegEmail("");
        setRegLocation("");
        setRegCapacity("60");
      }
    } catch (err: any) {
      console.warn("Could not register restaurant in Supabase, using local fallback:", err);
      
      // 2. Local fallback: Save to localStorage
      const localRestItem = {
        id: newId,
        ...newRestaurantData,
        lastPeriod: "Never",
        lastRevenue: 0,
        repeatRate: 0,
        rag: "green" as const,
        monthsOfData: 0,
        sessions: 0,
      };

      try {
        const localList = JSON.parse(localStorage.getItem("rasoi_local_restaurants") || "[]");
        localList.push(localRestItem);
        localStorage.setItem("rasoi_local_restaurants", JSON.stringify(localList));

        // Prepend to local state list
        setClientsList(prev => [localRestItem, ...prev]);
        setShowRegisterModal(false);
        
        // Clear fields
        setRegName("");
        setRegEmail("");
        setRegLocation("");
        setRegCapacity("60");
      } catch (localErr) {
        setRegError("Failed to save restaurant locally.");
      }
    }
  };

  if (authLoading || !userRole || userRole !== "admin") {
    return null;
  }

  const totalRevenue = clientsList.reduce((s, c) => s + c.lastRevenue, 0);
  const totalSessions = clientsList.reduce((s, c) => s + c.sessions, 0);

  // AI Usage & Payments are derived from registered clientsList (no hardcoded mock data)
  const usages = clientsList.map((c: any) => ({
    name: c.name,
    apiCalls: 0,
    tokens: "0 tokens",
    computeTime: "0s",
    status: "No Data",
  }));

  const payments = clientsList.map((c: any) => ({
    name: c.name,
    plan: "—",
    amount: "₹0",
    dueDate: "—",
    status: "No Invoice",
  }));

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold">Super Admin Console</div>
            <h1 className="font-display text-4xl mt-2">Core Control Centre</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage system intelligence, usage limits, and client registrations.</p>
          </div>
          <button 
            onClick={() => {
              setRegError(null);
              setShowRegisterModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gold-gradient text-primary-foreground text-sm font-medium glow-gold hover:opacity-95 active:scale-[0.98] transition-all"
          >
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
                    to="/sessions/$id/dashboard" params={{ id: c.id }}
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
            {usages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-gold/60" />
                </div>
                <div>
                  <div className="font-display text-base font-semibold">No AI usage data yet</div>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">API token metrics will appear here once restaurants are registered and start uploading billing data.</p>
                </div>
              </div>
            ) : (
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
                      <td className="px-6 py-4 font-mono text-muted-foreground">{u.apiCalls}</td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">{u.tokens}</td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">{u.computeTime}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border text-muted-foreground bg-surface border-border/60">{u.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {adminTab === "Payments" && (
          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
            <div className="p-6 border-b border-border/60">
              <h3 className="font-display text-lg">Payment Status</h3>
              <p className="text-xs text-muted-foreground">Pending invoices and subscription logs across standard accounts.</p>
            </div>
            {payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-gold/60" />
                </div>
                <div>
                  <div className="font-display text-base font-semibold">No payment records yet</div>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">Invoice and subscription data will appear here once restaurants are onboarded and billing plans are assigned.</p>
                </div>
              </div>
            ) : (
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
                      <td className="px-6 py-4 font-mono font-medium text-muted-foreground">{p.amount}</td>
                      <td className="px-6 py-4 text-muted-foreground">{p.dueDate}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border text-muted-foreground bg-surface border-border/60">{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Registration Modal Overlay */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl p-6 space-y-4 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-border/60">
                <h2 className="font-display text-2xl font-bold">Register Restaurant</h2>
                <button 
                  onClick={() => setShowRegisterModal(false)}
                  className="text-muted-foreground hover:text-foreground text-2xl p-1 leading-none"
                >
                  &times;
                </button>
              </div>
              
              {regError && (
                <div className="p-3 text-xs bg-rag-red/10 border border-rag-red/30 rounded-xl text-rag-red text-center">
                  {regError}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Restaurant Name</span>
                    <input 
                      type="text" required placeholder="Mumbai Dhaba" value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Email</span>
                    <input 
                      type="email" required placeholder="contact@mumbaidhaba.in" value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Type</span>
                    <select 
                      value={regType} onChange={(e) => setRegType(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 cursor-pointer"
                    >
                      <option value="Fine Dining">Fine Dining</option>
                      <option value="Bar & Restaurant">Bar & Restaurant</option>
                      <option value="Casual">Casual</option>
                      <option value="QSR">QSR</option>
                      <option value="Cloud Kitchen">Cloud Kitchen</option>
                      <option value="Dhaba">Dhaba</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Capacity (Covers)</span>
                    <input 
                      type="number" required placeholder="60" value={regCapacity}
                      onChange={(e) => setRegCapacity(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Location</span>
                    <input 
                      type="text" required placeholder="Bandra West" value={regLocation}
                      onChange={(e) => setRegLocation(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">City</span>
                    <input 
                      type="text" required placeholder="Mumbai" value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Icon</span>
                  <select 
                    value={regIcon} onChange={(e) => setRegIcon(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 cursor-pointer"
                  >
                    <option value="🪷">🪷 Lotus</option>
                    <option value="🍽️">🍽️ Plate & Silverware</option>
                    <option value="🌿">🌿 Leaf</option>
                    <option value="🍸">🍸 Martini Glass</option>
                    <option value="🍛">🍛 Curry Bowl</option>
                    <option value="🐟">🐟 Fish</option>
                    <option value="🚛">🚛 Truck</option>
                  </select>
                </label>

                <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                  <button 
                    type="button" 
                    onClick={() => setShowRegisterModal(false)}
                    className="px-4 py-2 border border-border hover:bg-surface rounded-full text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 bg-gold-gradient text-primary-foreground font-semibold rounded-full text-xs shadow glow-gold"
                  >
                    Register Restaurant
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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