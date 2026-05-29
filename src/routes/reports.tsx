import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { FileBarChart, Loader2, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/lib/supabase";
import { inr } from "@/lib/mock/data";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Rasoi Intelligence" }, { name: "description", content: "All analyses across your clients." }] }),
  component: ReportsPage,
});

interface ReportRow {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantCity: string;
  restaurantIcon: string;
  period: string;
  revenue: number;
  rag: string;
  createdAt: string;
}

const ragCls: Record<string, string> = {
  green: "bg-rag-green/15 text-rag-green",
  amber: "bg-rag-amber/15 text-rag-amber",
  red:   "bg-rag-red/15 text-rag-red",
  gold:  "bg-gold/10 text-gold",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months} mo ago`;
}

function ReportsPage() {
  const nav = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const role = sessionStorage.getItem("userRole");
    setUserRole(role);
    if (!role) {
      nav({ to: "/login" });
    } else if (role !== "admin") {
      nav({ to: "/sessions/$id/dashboard", params: { id: "c1" } as any });
    }
  }, [nav]);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      setError(null);
      try {
        const { data: insights, error: insightsErr } = await supabase
          .from("ai_insights")
          .select("id, restaurant_id, period, tone, raw_analysis, created_at")
          .order("created_at", { ascending: false });

        if (insightsErr) throw insightsErr;

        if (!insights || insights.length === 0) {
          setRows([]);
          return;
        }

        // Fetch all restaurants in one query
        const restaurantIds = [...new Set(insights.map((i: any) => i.restaurant_id))];
        const { data: restaurants } = await supabase
          .from("restaurants")
          .select("id, name, city, icon")
          .in("id", restaurantIds);

        const restaurantMap: Record<string, any> = {};
        (restaurants || []).forEach((r: any) => { restaurantMap[r.id] = r; });

        const mapped: ReportRow[] = insights.map((insight: any) => {
          const restaurant = restaurantMap[insight.restaurant_id] || {};
          const raw = insight.raw_analysis || {};
          const revenue = raw.kpis?.totalRevenue || 0;
          return {
            id: insight.id,
            restaurantId: insight.restaurant_id,
            restaurantName: restaurant.name || "Unknown Restaurant",
            restaurantCity: restaurant.city || "",
            restaurantIcon: restaurant.icon || "🍽️",
            period: insight.period || "—",
            revenue,
            rag: insight.tone || "green",
            createdAt: insight.created_at,
          };
        });

        setRows(mapped);
      } catch (err: any) {
        console.error("Failed to load reports:", err);
        setError(err?.message || "Could not load reports from Supabase.");
      } finally {
        setLoading(false);
      }
    }

    if (userRole === "admin") {
      loadReports();
    }
  }, [userRole]);

  if (!userRole || userRole !== "admin") return null;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">All reports</div>
        <h1 className="font-display text-4xl mt-2">Reports Library</h1>
        <p className="text-sm text-muted-foreground mt-1">Every AI analysis run, across every registered client.</p>

        <div className="mt-8 rounded-2xl border border-border/70 bg-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
              <span className="text-sm">Loading reports from Supabase...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-rag-red/10 border border-rag-red/20 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-rag-red" />
              </div>
              <div>
                <div className="font-display text-base font-semibold">Could not load reports</div>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">{error}</p>
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                <FileBarChart className="h-7 w-7 text-gold/60" />
              </div>
              <div>
                <div className="font-display text-xl font-semibold">No reports yet</div>
                <p className="text-xs text-muted-foreground mt-2 max-w-sm leading-relaxed">
                  Reports appear here after a restaurant uploads their POS billing data and runs an AI analysis. Go to a client workspace and upload files to generate the first report.
                </p>
              </div>
              <Link
                to="/clients"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold-gradient text-primary-foreground text-sm font-semibold glow-gold hover:opacity-95 transition-all"
              >
                View Registered Clients
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface/60 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Client</th>
                  <th className="text-left px-5 py-3 font-medium">Period</th>
                  <th className="text-left px-5 py-3 font-medium">Revenue</th>
                  <th className="text-left px-5 py-3 font-medium">RAG</th>
                  <th className="text-left px-5 py-3 font-medium">Generated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-border/60 hover:bg-surface/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{r.restaurantIcon}</span>
                        <div>
                          <div className="font-medium">{r.restaurantName}</div>
                          <div className="text-xs text-muted-foreground">{r.restaurantCity}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">{r.period}</td>
                    <td className="px-5 py-4 font-mono">{r.revenue > 0 ? inr(r.revenue) : "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] px-2 py-1 rounded-full ${ragCls[r.rag] || ragCls.green}`}>
                        {r.rag.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{timeAgo(r.createdAt)}</td>
                    <td className="px-5 py-4 text-right pr-5">
                      <Link
                        to="/sessions/$id/dashboard"
                        params={{ id: r.restaurantId }}
                        className="text-gold hover:underline"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}