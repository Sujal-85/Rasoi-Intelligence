import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Rasoi Intelligence" }, { name: "description", content: "Workspace, AI and preference settings." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-6 lg:px-10 py-10 space-y-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-gold">Settings</div>
          <h1 className="font-display text-4xl mt-2">Workspace</h1>
        </div>

        <Section title="Profile" desc="How you appear inside the workspace.">
          <Row label="Name"><Input defaultValue="Anika Kapoor" /></Row>
          <Row label="Email"><Input defaultValue="anika@loklearning.in" /></Row>
          <Row label="Company"><Input defaultValue="LokLearning" /></Row>
        </Section>

        <Section title="AI configuration" desc="Bring your own Anthropic key, or use our managed AI.">
          <Row label="Anthropic API key"><Input type="password" defaultValue="sk-ant-••••••••••••" /></Row>
          <Row label="Model"><Input defaultValue="claude-sonnet-4-5" /></Row>
          <p className="text-xs text-muted-foreground">Your key is encrypted at rest and never shared.</p>
        </Section>

        <Section title="Preferences" desc="Defaults applied to every report.">
          <Row label="Currency"><Input defaultValue="₹ INR" /></Row>
          <Row label="Date format"><Input defaultValue="DD/MM/YYYY" /></Row>
        </Section>

        <div className="rounded-2xl border border-rag-red/30 bg-rag-red/5 p-6">
          <div className="flex items-center gap-2 text-rag-red"><Trash2 className="h-4 w-4" /><span className="font-medium">Danger zone</span></div>
          <p className="text-sm text-muted-foreground mt-2">Permanently delete your account and all reports.</p>
          <button className="mt-4 px-4 py-2 rounded-full border border-rag-red/40 text-rag-red text-sm hover:bg-rag-red/10">Delete account</button>
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