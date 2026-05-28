import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertTriangle, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getClient, inr } from "@/lib/mock/data";

export const Route = createFileRoute("/clients/$id")({
  head: ({ params }) => {
    const c = getClient(params.id);
    return { meta: [{ title: `${c.name} — Rasoi Intelligence` }, { name: "description", content: `Analytics workspace for ${c.name}.` }] };
  },
  component: ClientDetailPage,
});

const tabs = ["New analysis", "History", "Settings"] as const;

function ClientDetailPage() {
  const { id } = Route.useParams();
  const c = getClient(id);
  const [tab, setTab] = useState<typeof tabs[number]>("New analysis");

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
        <Link to="/clients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All clients
        </Link>
        <div className="mt-4 flex items-start gap-5 flex-wrap">
          <div className="h-16 w-16 rounded-2xl bg-surface-2 border border-border grid place-items-center text-4xl">{c.icon}</div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-4xl">{c.name}</h1>
            <div className="text-sm text-muted-foreground mt-1">
              <span className="inline-block px-2 py-0.5 rounded-full border border-border bg-surface mr-2 text-foreground/80">{c.type}</span>
              {c.location}, {c.city} · {c.capacity > 0 ? `${c.capacity} covers` : "Cloud kitchen"}
            </div>
          </div>
          <Link
            to="/sessions/$id/dashboard" params={{ id: c.id }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gold-gradient text-primary-foreground text-sm font-medium glow-gold"
          >
            Open latest dashboard
          </Link>
        </div>

        <div className="mt-10 border-b border-border flex gap-6">
          {tabs.map((t) => (
            <button
              key={t} onClick={() => setTab(t)}
              className={`relative py-3 text-sm transition ${tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t}
              {tab === t && <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-gold-gradient" />}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "New analysis" && <NewAnalysis />}
          {tab === "History" && <History />}
          {tab === "Settings" && <SettingsTab />}
        </div>
      </div>
    </AppShell>
  );
}

function NewAnalysis() {
  return (
    <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
      <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-10 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-gold/10 border border-gold/20 grid place-items-center">
          <Upload className="h-6 w-6 text-gold" />
        </div>
        <div className="font-display text-xl mt-4">Drop last month's billing here</div>
        <p className="text-sm text-muted-foreground mt-1">Excel, CSV, PDF or photos of receipts. Up to 10 files.</p>
        <button className="mt-5 px-4 py-2 rounded-full bg-gold-gradient text-primary-foreground text-sm font-medium">Choose files</button>
        <div className="mt-4 text-xs text-muted-foreground">or <button className="text-gold hover:underline">load demo data</button></div>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Period</div>
        <div className="font-display text-2xl mt-1">March 2025</div>
        <div className="mt-5 space-y-3 text-sm">
          <Row icon={CheckCircle2} ok>Detected fields will appear here once you upload.</Row>
          <Row icon={AlertTriangle}>GST inclusivity will be confirmed before AI runs.</Row>
        </div>
        <button disabled className="mt-6 w-full px-4 py-2.5 rounded-full bg-gold-gradient text-primary-foreground text-sm font-medium opacity-40 cursor-not-allowed">
          Generate AI report
        </button>
      </div>
    </div>
  );
}

function Row({ icon: Icon, ok, children }: { icon: typeof CheckCircle2; ok?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className={`h-4 w-4 mt-0.5 ${ok ? "text-rag-green" : "text-rag-amber"}`} />
      <span className="text-muted-foreground">{children}</span>
    </div>
  );
}

function History() {
  const rows = [
    { m: "March 2025", tx: 1247, rev: 1842000, repeat: 58, rag: { g: 6, a: 4, r: 2 } },
    { m: "February 2025", tx: 1129, rev: 1638000, repeat: 56, rag: { g: 5, a: 5, r: 2 } },
    { m: "January 2025", tx: 1058, rev: 1495000, repeat: 53, rag: { g: 4, a: 5, r: 3 } },
    { m: "December 2024", tx: 1402, rev: 2104000, repeat: 61, rag: { g: 7, a: 3, r: 2 } },
  ];
  return (
    <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface/60 text-xs uppercase tracking-widest text-muted-foreground">
          <tr><Th>Month</Th><Th>Transactions</Th><Th>Revenue</Th><Th>Repeat</Th><Th>RAG</Th><Th>Actions</Th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.m} className="border-t border-border/60 hover:bg-surface/40">
              <Td className="font-medium">{r.m}</Td>
              <Td className="font-mono">{r.tx.toLocaleString("en-IN")}</Td>
              <Td className="font-mono">{inr(r.rev)}</Td>
              <Td>{r.repeat}%</Td>
              <Td>
                <div className="inline-flex items-center gap-1">
                  <Pill cls="bg-rag-green/15 text-rag-green">{r.rag.g}</Pill>
                  <Pill cls="bg-rag-amber/15 text-rag-amber">{r.rag.a}</Pill>
                  <Pill cls="bg-rag-red/15 text-rag-red">{r.rag.r}</Pill>
                </div>
              </Td>
              <Td>
                <Link to="/sessions/$id/dashboard" params={{ id: "c1" }} className="text-gold hover:underline">View →</Link>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) { return <th className="text-left px-5 py-3 font-medium">{children}</th>; }
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <td className={`px-5 py-4 ${className}`}>{children}</td>; }
function Pill({ children, cls }: { children: React.ReactNode; cls: string }) { return <span className={`text-[10px] px-1.5 py-0.5 rounded ${cls}`}>{children}</span>; }

function SettingsTab() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="rounded-2xl border border-border/70 bg-card p-6">
        <div className="font-display text-xl">Client details</div>
        <p className="text-sm text-muted-foreground mt-1">Edit how this restaurant shows up across the workspace.</p>
        <button className="mt-4 px-4 py-2 rounded-full bg-surface-2 border border-border text-sm hover:bg-surface">Edit details</button>
      </div>
      <div className="rounded-2xl border border-rag-red/30 bg-rag-red/5 p-6">
        <div className="flex items-center gap-2 text-rag-red"><Trash2 className="h-4 w-4" /><span className="font-medium">Danger zone</span></div>
        <p className="text-sm text-muted-foreground mt-2">Deleting this client removes all sessions and transactions. This can't be undone.</p>
        <button className="mt-4 px-4 py-2 rounded-full border border-rag-red/40 text-rag-red text-sm hover:bg-rag-red/10">Delete client</button>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-6">
        <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-gold" /><span className="font-medium">Export raw data</span></div>
        <p className="text-sm text-muted-foreground mt-2">Download all parsed transactions and computed metrics as JSON.</p>
      </div>
    </div>
  );
}