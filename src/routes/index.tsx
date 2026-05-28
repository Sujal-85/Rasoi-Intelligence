import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight, ShieldCheck, Sparkles, BarChart3, Upload, Cpu, FileBarChart, Target, Check,
} from "lucide-react";
import heroImg from "@/assets/hero-restaurant.jpg";
import { LandingNav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rasoi Intelligence — Turn restaurant data into ₹₹₹" },
      { name: "description", content: "AI-powered analytics for Indian restaurants. Upload billing data, get 40+ metrics and a 5-action improvement plan in under a minute." },
      { property: "og:title", content: "Rasoi Intelligence" },
      { property: "og:description", content: "AI-powered analytics for Indian restaurants." },
    ],
  }),
  component: Landing,
});

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />

      {/* HERO */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 ambient-glow pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center relative">
          <div>
            <motion.div
              initial="hidden" animate="visible" variants={fadeUp}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/80 bg-surface/60 text-xs text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              Now in private beta — 47 restaurants on the waitlist
            </motion.div>

            <motion.h1
              initial="hidden" animate="visible" custom={1} variants={fadeUp}
              className="font-display mt-6 text-5xl md:text-7xl leading-[0.95] text-balance"
            >
              Turn your <span className="text-gold-gradient italic">रसोई</span> data into <span className="text-gold-gradient">₹₹₹</span>.
            </motion.h1>

            <motion.p
              initial="hidden" animate="visible" custom={2} variants={fadeUp}
              className="mt-6 text-lg text-muted-foreground max-w-xl text-balance"
            >
              Upload last month's billing — Excel, PDF, or photos of receipts.
              Rasoi computes 40+ restaurant metrics and writes you a plain-English action plan.
              No jargon. No dashboards you'll never open.
            </motion.p>

            <motion.div
              initial="hidden" animate="visible" custom={3} variants={fadeUp}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold-gradient text-primary-foreground font-medium glow-gold hover:opacity-95 transition"
              >
                Start free trial
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/clients"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border bg-surface/60 hover:bg-surface transition text-sm"
              >
                See live demo dashboard
              </Link>
            </motion.div>

            <motion.div
              initial="hidden" animate="visible" custom={4} variants={fadeUp}
              className="mt-10 flex items-center gap-6 text-xs text-muted-foreground"
            >
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" /> PII pseudonymised on-device</div>
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-gold" /> 20s to first insight</div>
            </motion.div>
          </div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden border border-border/80 glow-gold">
              <img
                src={heroImg}
                alt="Indian fine dining restaurant interior at dusk"
                width={1600} height={1200}
                className="w-full h-[460px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

              {/* Floating KPI cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="absolute top-6 left-6 bg-card/90 backdrop-blur rounded-2xl border border-border/70 p-4 w-48"
              >
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total revenue</div>
                <div className="font-display text-2xl mt-1">₹18.42L</div>
                <div className="text-xs text-rag-green mt-1">↑ 12.4% vs Feb</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="absolute bottom-6 right-6 bg-card/90 backdrop-blur rounded-2xl border border-border/70 p-4 w-56"
              >
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">AI says</div>
                <div className="text-sm mt-1 font-display italic leading-snug">
                  "Dessert attach is your fastest lever — only 18%."
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 border-t border-border/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.2em] text-gold">What it does</div>
            <h2 className="font-display text-4xl md:text-5xl mt-3 text-balance">
              Three things, done <em className="text-gold-gradient">unfairly</em> well.
            </h2>
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-5">
            {[
              { icon: ShieldCheck, title: "Private by design", body: "Customer names and phone numbers are pseudonymised before any AI ever sees them. Mappings live in memory for the request and are never persisted." },
              { icon: Cpu, title: "AI that speaks restaurant", body: "Claude reads your numbers and writes back in plain English — what's working, what's bleeding, and the exact 5 moves that will lift margin this week." },
              { icon: BarChart3, title: "40+ metrics, deterministic", body: "Revenue, footfall, menu engineering, daypart, RFM customers — all computed by code, not vibes. AI is on top, not in between." },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="group rounded-2xl border border-border/70 bg-surface/50 p-6 hover:border-gold/40 transition"
              >
                <div className="h-11 w-11 rounded-xl bg-gold/10 grid place-items-center border border-gold/20">
                  <f.icon className="h-5 w-5 text-gold" />
                </div>
                <div className="mt-5 font-display text-xl">{f.title}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-24 border-t border-border/60 relative overflow-hidden">
        <div className="absolute inset-0 ambient-glow opacity-50" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.2em] text-gold">How it works</div>
            <h2 className="font-display text-4xl md:text-5xl mt-3 text-balance">
              From messy Excel to a board-ready report in <em className="text-gold-gradient">under a minute</em>.
            </h2>
          </div>
          <div className="mt-14 grid md:grid-cols-4 gap-4 relative">
            <div className="hidden md:block absolute top-6 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
            {[
              { n: "01", icon: Upload, title: "Upload", body: "Drop Excel, CSV, PDF or photos of bills." },
              { n: "02", icon: Cpu, title: "Compute", body: "40+ metrics calculated deterministically." },
              { n: "03", icon: Sparkles, title: "Narrate", body: "Claude writes insights in plain English." },
              { n: "04", icon: Target, title: "Act", body: "Get a ranked 5-action improvement plan." },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="relative rounded-2xl border border-border/70 bg-card p-6"
              >
                <div className="h-12 w-12 rounded-full bg-background border border-gold/30 grid place-items-center relative z-10">
                  <s.icon className="h-5 w-5 text-gold" />
                </div>
                <div className="mt-4 font-mono text-xs text-muted-foreground">{s.n}</div>
                <div className="font-display text-xl mt-1">{s.title}</div>
                <p className="text-sm text-muted-foreground mt-1">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 border-t border-border/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.2em] text-gold">Pricing</div>
            <h2 className="font-display text-4xl md:text-5xl mt-3 text-balance">
              Pay for the <em className="text-gold-gradient">outcome</em>, not the dashboard.
            </h2>
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-5">
            {[
              { name: "Starter", price: "₹999", per: "/month", desc: "For owners running one venue.", features: ["1 restaurant", "6 months of history", "All 40+ metrics", "AI action plan"], cta: "Start free" },
              { name: "Growth", price: "₹2,499", per: "/month", featured: true, desc: "For groups and small chains.", features: ["5 restaurants", "12 months of history", "MoM comparisons", "Priority support"], cta: "Start free trial" },
              { name: "Agency", price: "₹5,999", per: "/month", desc: "For consultants & analytics firms.", features: ["Unlimited clients", "Full history", "White-label reports", "API access"], cta: "Talk to us" },
            ].map((t) => (
              <div
                key={t.name}
                className={`relative rounded-2xl border p-7 ${t.featured ? "border-gold/50 bg-surface glow-gold" : "border-border/70 bg-surface/40"}`}
              >
                {t.featured && (
                  <div className="absolute -top-3 left-7 px-3 py-1 rounded-full bg-gold-gradient text-primary-foreground text-[10px] font-medium uppercase tracking-widest">
                    Most popular
                  </div>
                )}
                <div className="font-display text-2xl">{t.name}</div>
                <p className="text-sm text-muted-foreground mt-1">{t.desc}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-5xl">{t.price}</span>
                  <span className="text-muted-foreground text-sm">{t.per}</span>
                </div>
                <ul className="mt-6 space-y-2 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`mt-7 inline-flex w-full justify-center items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition ${
                    t.featured ? "bg-gold-gradient text-primary-foreground hover:opacity-95" : "border border-border bg-card hover:bg-surface-2"
                  }`}
                >
                  {t.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border/60">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FileBarChart className="h-10 w-10 mx-auto text-gold" />
          <h2 className="font-display text-4xl md:text-5xl mt-5 text-balance">
            Your <em className="text-gold-gradient">next month's</em> P&L is hiding in last month's billing.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Most owners read their P&L once. Rasoi reads it daily, in your voice, and tells you what to do tomorrow.
          </p>
          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gold-gradient text-primary-foreground font-medium glow-gold"
          >
            Start free trial <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
