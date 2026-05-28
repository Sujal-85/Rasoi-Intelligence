import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type RAG = "green" | "amber" | "red" | "neutral";

const ragRing = {
  green: "ring-rag-green/30",
  amber: "ring-rag-amber/30",
  red: "ring-rag-red/30",
  neutral: "ring-border",
};

const deltaColor = (delta?: number) =>
  delta === undefined ? "text-muted-foreground"
    : delta > 0 ? "text-rag-green" : delta < 0 ? "text-rag-red" : "text-muted-foreground";

export function KPICard({
  title, value, delta, deltaSuffix = "%", sub, rag = "neutral", icon: Icon, delay = 0,
}: {
  title: string;
  value: string;
  delta?: number;
  deltaSuffix?: string;
  sub?: string;
  rag?: RAG;
  icon?: LucideIcon;
  delay?: number;
}) {
  const D = delta === undefined ? Minus : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative rounded-2xl border border-border/70 bg-card p-5 ring-1 ${ragRing[rag]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{title}</span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="font-display text-3xl mt-2">{value}</div>
      <div className="mt-2 flex items-center justify-between text-xs">
        {delta !== undefined ? (
          <span className={`inline-flex items-center gap-1 ${deltaColor(delta)}`}>
            <D className="h-3 w-3" />
            {delta > 0 ? "+" : ""}{delta.toFixed(1)}{deltaSuffix}
          </span>
        ) : <span className="text-muted-foreground">—</span>}
        {sub && <span className="text-muted-foreground">{sub}</span>}
      </div>
    </motion.div>
  );
}