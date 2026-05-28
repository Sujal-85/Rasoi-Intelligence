import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Trash2, ShieldCheck, KeyRound, Cpu } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Rasoi Intelligence" }, { name: "description", content: "Workspace, AI and preference settings." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { userRole, userEmail, userName, loading } = useAuth();

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