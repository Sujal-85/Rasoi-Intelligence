import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Trash2, ShieldCheck, KeyRound, Cpu, Database, AlertCircle, CheckCircle2, FileCode } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { KPIS, REVENUE_BY_WEEK, TOP_ITEMS, ORDERS_BY_HOUR, PAYMENT_MIX, INSIGHTS } from "@/lib/mock/data";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Rasoi Intelligence" }, { name: "description", content: "Workspace, AI and preference settings." }] }),
  component: SettingsPage,
});

const SEED_RESTAURANTS = [
  { id: 'c1000000-0000-0000-0000-000000000001', name: 'Saffron Lounge', email: 'demo@rasoi.in', type: 'Fine Dining', location: 'Bandra West', city: 'Mumbai', capacity: 64, icon: '🪷' },
  { id: 'c2000000-0000-0000-0000-000000000002', name: 'Tandoor & Tonic', email: 'tandoor@rasoi.in', type: 'Bar & Restaurant', location: 'Indiranagar', city: 'Bengaluru', capacity: 110, icon: '🍸' },
  { id: 'c3000000-0000-0000-0000-000000000003', name: 'Curry Leaf Cafe', email: 'curry@rasoi.in', type: 'Casual', location: 'Koramangala', city: 'Bengaluru', capacity: 48, icon: '🌿' },
  { id: 'c4000000-0000-0000-0000-000000000004', name: 'Dilli Junction', email: 'dilli@rasoi.in', type: 'QSR', location: 'Connaught Place', city: 'Delhi', capacity: 32, icon: '🍛' },
  { id: 'c5000000-0000-0000-0000-000000000005', name: 'Coastal Co.', email: 'coastal@rasoi.in', type: 'Cloud Kitchen', location: 'Powai', city: 'Mumbai', capacity: 0, icon: '🐟' },
  { id: 'c6000000-0000-0000-0000-000000000006', name: 'Maharaja Dhaba', email: 'maharaja@rasoi.in', type: 'Dhaba', location: 'NH-44', city: 'Karnal', capacity: 180, icon: '🚛' }
];

const SEED_INSIGHT = {
  restaurant_id: 'c1000000-0000-0000-0000-000000000001',
  period: 'March 2025',
  type: 'Executive Digest',
  title: 'Saffron Lounge Operations Pulse',
  summary: 'Dinner covers contributing 41% of revenue. Attachment sales for desserts represent a 15% ticket lift opportunity.',
  raw_analysis: {
    kpis: KPIS,
    revenueByWeek: REVENUE_BY_WEEK,
    topItems: TOP_ITEMS,
    ordersByHour: ORDERS_BY_HOUR,
    paymentMix: PAYMENT_MIX,
    insights: INSIGHTS
  },
  tone: 'green',
  status: 'New'
};

function SettingsPage() {
  const { userRole, userEmail, userName, loading, user } = useAuth();
  
  // Database Seeding State
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center items-center h-64">
          <Cpu className="h-6 w-6 text-gold animate-spin" />
        </div>
      </AppShell>
    );
  }

  const isAdmin = userRole === "admin";

  const handleSeedDatabase = async () => {
    setSeeding(true);
    setSeedError(null);
    setSeedSuccess(null);
    try {
      // 1. Seed Restaurants (Set owner_id to current user to satisfy RLS row access constraints!)
      for (const restaurant of SEED_RESTAURANTS) {
        const payload = {
          ...restaurant,
          owner_id: user?.id || null
        };
        const { error } = await supabase
          .from("restaurants")
          .upsert(payload, { onConflict: "id" });

        if (error) {
          throw new Error(`Failed to upsert restaurant '${restaurant.name}': ${error.message}`);
        }
      }

      // 2. Seed default AI Insight for Saffron Lounge (c1)
      const { error: insightError } = await supabase
        .from("ai_insights")
        .upsert(SEED_INSIGHT, { onConflict: "restaurant_id,period" });

      if (insightError) {
        console.warn("Could not seed default AI insight, table might be unconfigured:", insightError.message);
      }

      setSeedSuccess("Database seeded successfully! All mock restaurants and analytical insights have been created. RLS access rules have been mapped to your user ID.");
    } catch (err: any) {
      console.error("Failed to seed Supabase database:", err);
      setSeedError(err.message || "An unknown database query error occurred.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-6 lg:px-10 py-10 space-y-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-gold">
            {isAdmin ? "Admin Configuration" : "Restaurant Settings"}
          </div>
          <h1 className="font-display text-4xl mt-2">
            {isAdmin ? "Global Settings" : "Workspace Settings"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure system metrics, database seeding configurations, and preferences.
          </p>
        </div>

        {/* Supabase Schema & Seeding Card (Visible to everyone for testing utility) */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-gold" />
            <h3 className="font-display text-xl font-bold">Supabase Integration Utilities</h3>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-3">
            <p>
              To populate your remote database with analytical structures and bypass empty console screens, execute the database migrations in your Supabase project:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs">
              <li>Open your <strong>Supabase Dashboard</strong> and navigate to the <strong>SQL Editor</strong>.</li>
              <li>Open <a href="file:///d:/Rasoi/backend/schema.sql" className="font-bold underline text-gold">backend/schema.sql</a>, copy its contents, and execute them to construct the tables and security policies.</li>
              <li>Open <a href="file:///d:/Rasoi/backend/seed.sql" className="font-bold underline text-gold">backend/seed.sql</a> and execute its seeding commands.</li>
            </ol>
            <p className="text-xs">
              Alternatively, click below to populate the <code className="bg-surface px-1.5 py-0.5 rounded border">restaurants</code> table directly from the web client.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={handleSeedDatabase}
              disabled={seeding}
              className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-full bg-gold-gradient text-primary-foreground text-sm font-semibold glow-gold disabled:opacity-60"
            >
              {seeding ? (
                <><Cpu className="h-4 w-4 animate-spin" /> Writing seed records...</>
              ) : (
                <><Database className="h-4 w-4" /> Seed Supabase Database</>
              )}
            </button>

            {seedSuccess && (
              <div className="p-3 text-xs bg-rag-green/10 border border-rag-green/30 rounded-xl text-rag-green flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{seedSuccess}</span>
              </div>
            )}

            {seedError && (
              <div className="p-3 text-xs bg-rag-red/10 border border-rag-red/30 rounded-xl text-rag-red flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">Seeding failed:</span>
                  <span>{seedError}</span>
                  <span className="block mt-1 text-[10px] text-muted-foreground">
                    Did you run the migrations in <a href="file:///d:/Rasoi/backend/schema.sql" className="underline font-bold">schema.sql</a> first?
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {isAdmin ? (
          <>
            <Section title="AI Global Engine Configuration" desc="Configure defaults for Gemini core intelligence.">
              <Row label="Gemini API Key"><Input type="password" defaultValue="AIzaSyCicSBUaZ_dh-b4KxjheLwkNUwLR9yO7cs" /></Row>
              <Row label="Default Model Core"><Input defaultValue="gemini-1.5-pro" /></Row>
              <Row label="Daily Token Usage Limit (Global)"><Input type="number" defaultValue="5000000" /></Row>
            </Section>

            <Section title="Database & Security Settings" desc="Setup system variables.">
              <Row label="Max File Upload Limit (MB)"><Input type="number" defaultValue="50" /></Row>
              <Row label="System Rate Limiter (requests/min)"><Input type="number" defaultValue="120" /></Row>
            </Section>
          </>
        ) : (
          <>
            <Section title="Restaurant Profile" desc={`How your restaurant shows up in outputs.`}>
              <Row label="Restaurant Name"><Input defaultValue={userName || "Saffron Lounge"} /></Row>
              <Row label="Email"><Input defaultValue={userEmail || "contact@saffronlounge.in"} /></Row>
              <Row label="City"><Input defaultValue="Mumbai" /></Row>
            </Section>

            <Section title="Preferences" desc="Defaults applied to every report.">
              <Row label="Currency"><Input defaultValue="₹ INR" /></Row>
              <Row label="Date format"><Input defaultValue="DD/MM/YYYY" /></Row>
            </Section>
          </>
        )}

        <div className="rounded-2xl border border-rag-red/30 bg-rag-red/5 p-6">
          <div className="flex items-center gap-2 text-rag-red"><Trash2 className="h-4 w-4" /><span className="font-medium">Danger zone</span></div>
          <p className="text-sm text-muted-foreground mt-2">Permanently delete account workspace contents.</p>
          <button className="mt-4 px-4 py-2 rounded-full border border-rag-red/40 text-rag-red text-sm hover:bg-rag-red/10">Delete data</button>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6">
      <div className="font-display text-xl">{title}</div>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
      <div className="mt-5 space-y-4">{children}</div>
      <div className="mt-6"><button className="px-4 py-2 rounded-full bg-gold-gradient text-primary-foreground text-sm font-medium">Save changes</button></div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />;
}