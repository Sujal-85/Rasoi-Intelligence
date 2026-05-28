import { CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";

const map = {
  green: { Icon: CheckCircle2, label: "What's working", cls: "border-rag-green/30 bg-rag-green/5", icc: "text-rag-green" },
  red: { Icon: AlertTriangle, label: "Needs attention", cls: "border-rag-red/30 bg-rag-red/5", icc: "text-rag-red" },
  gold: { Icon: Lightbulb, label: "Biggest opportunity", cls: "border-gold/30 bg-gold/5", icc: "text-gold" },
} as const;

export function InsightCard({ tone, title, body }: { tone: keyof typeof map; title: string; body: string }) {
  const m = map[tone];
  return (
    <div className={`rounded-2xl border p-5 ${m.cls}`}>
      <div className="flex items-center gap-2">
        <m.Icon className={`h-4 w-4 ${m.icc}`} />
        <span className={`text-[10px] uppercase tracking-[0.18em] ${m.icc}`}>{m.label}</span>
      </div>
      <div className="font-display text-lg mt-2">{title}</div>
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{body}</p>
    </div>
  );
}