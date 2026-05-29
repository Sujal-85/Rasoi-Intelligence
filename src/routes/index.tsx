import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight, ShieldCheck, Sparkles, BarChart3, Upload, Cpu, FileBarChart, Target, Check,
  IndianRupee, ShoppingBag, Receipt, MessageCircle, Heart, AlertTriangle, Coffee, QrCode,
  Plus, Trash2, RefreshCw, ChevronDown, Download, HelpCircle, Send, CheckCircle2
} from "lucide-react";
import heroImg from "@/assets/hero-restaurant.jpg";
import butterChickenPoster from "@/assets/butter_chicken_combo_poster.png";
import miniDessertPoster from "@/assets/mini_dessert_poster.png";
import samosaPoster from "@/assets/samosa_happy_hours_poster.png";
import { LandingNav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rasoi Intelligence — Turn restaurant data into plain-English business value" },
      { name: "description", content: "AI-powered analytics for Indian restaurants. Upload billing data, get 40+ metrics and a 5-action improvement plan in under a minute." },
      { property: "og:title", content: "Rasoi Intelligence" },
      { property: "og:description", content: "AI-powered analytics for Indian restaurants." },
    ],
  }),
  component: Landing,
});

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// FAQ Data
const FAQ_ITEMS = [
  {
    q: "Is my customer data secure and private?",
    a: "Completely. Rasoi runs on-device customer PII pseudonymisation. Customer phone numbers, names, and card details are fully stripped locally in your browser before files are parsed by our AI models. Your customer lists remain entirely in your possession."
  },
  {
    q: "Which POS systems and file formats do you support?",
    a: "We support data exports from all major Indian POS systems (Petpooja, Vyapar, Billberry, POSist, and others). Simply upload your transactions as an Excel spreadsheet, CSV export, or PDF invoice batch."
  },
  {
    q: "Do I need to write SQL or configure dashboard layouts?",
    a: "No. Rasoi was built specifically for busy restaurant owners and managers. Our system translates your billing history into mathematically sound, plain-English operations guidelines. No charts with complex legends, no queries."
  },
  {
    q: "How does the AI combo poster generator work?",
    a: "Our AI model identifies dishes frequently bought together (but rarely in a single order) and creates high-margin combo pairings. It then generates visual promotional posters with matching pricing strategies, ready for WhatsApp Status or printing."
  },
  {
    q: "Can I connect my POS directly to sync data automatically?",
    a: "Yes. In the Growth and Agency plans, we offer webhook configurations and API connectors that directly sync order data at the end of each daily closing shift, bypassing the manual file upload."
  }
];

// Venue logos ticker list
const CLIENT_VENUES = [
  "Saffron Lounge", "Mumbai Dhaba", "The Curry House", "Delhi Darbar", 
  "Royal Tadka", "Spiceland Bistro", "The Naan Stop", "Biryani Box",
  "Tandoor & Co.", "Chai Point Metro", "Desi Kitchen", "Flavors of Punjab"
];

function Landing() {
  const { signOut } = useAuth();

  // Auto-logout when user lands on the home/marketing page
  useEffect(() => {
    if (typeof window === "undefined") return;
    const role = sessionStorage.getItem("userRole");
    if (role) {
      // User was logged in — sign them out silently
      signOut();
    }
  }, [signOut]);

  // Playground State
  const [activeTab, setActiveTab] = useState<"pulse" | "register" | "poster" | "stock">("pulse");
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [showUpsellAlert, setShowUpsellAlert] = useState(false);
  
  // Simulated stats
  const [simulatedSales, setSimulatedSales] = useState(62400);
  const [simulatedOrders, setSimulatedOrders] = useState(42);

  // Cart State for Register tab
  interface CartItem {
    id: string;
    name: string;
    price: number;
    qty: number;
  }
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState<"none" | "10" | "happy">("none");
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  // Poster Tab State
  const [selectedCombo, setSelectedCombo] = useState<"butter_chicken" | "samosa" | "mini_dessert">("butter_chicken");
  const [generatingPoster, setGeneratingPoster] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Stock Tab State
  const [copiedStock, setCopiedStock] = useState<string | null>(null);

  // Pricing State
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [monthlySales, setMonthlySales] = useState(500000); // INR slider

  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Trigger simulated file upload sequence
  const startDemoUpload = () => {
    setUploading(true);
    setUploadStep(0);
    setUploadComplete(false);
    
    const steps = [
      "Reading sales-register.xlsx...",
      "Scrubbing guest names and PII (92 customer profiles anonymized)...",
      "Calculating attach rates & hourly daypart traffic...",
      "Compiling plain-English operations metrics...",
      "AI Analysis successfully built!"
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setUploadStep(currentStep);
      } else {
        clearInterval(interval);
        setUploading(false);
        setUploadComplete(true);
        // Boost sales stats to demonstrate new analysis values
        setSimulatedSales(78900);
        setSimulatedOrders(57);
        setActiveTab("pulse");
      }
    }, 700);
  };

  // Add Item to cart in register simulator
  const handleAddToCart = (item: { id: string; name: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...item, qty: 1 }];
    });

    // If Butter Chicken is added and no Garlic Naan is present, show Upsell recommendation
    if (item.id === "bc" && !cart.some((i) => i.id === "gn")) {
      setShowUpsellAlert(true);
    }
  };

  const addUpsellItem = () => {
    handleAddToCart({ id: "gn", name: "Garlic Naan", price: 80 });
    setShowUpsellAlert(false);
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
    if (id === "bc") setShowUpsellAlert(false);
  };

  // Calculate pricing values
  const getSubtotal = () => cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const getDiscountAmount = () => {
    const sub = getSubtotal();
    if (discountType === "10") return sub * 0.1;
    if (discountType === "happy") return sub * 0.15;
    return 0;
  };
  const getTotal = () => Math.max(0, getSubtotal() - getDiscountAmount());

  // POS Checkout Simulation
  const triggerPOSPayment = () => {
    if (cart.length === 0) return;
    setPaymentModal(true);
    setPaymentProcessing(true);
    setPaymentDone(false);

    // Simulate UPI checkout scan and approval
    setTimeout(() => {
      setPaymentProcessing(false);
      setPaymentDone(true);
      setTimeout(() => {
        // Increment global KPIs with current cart total
        setSimulatedSales((prev) => prev + Math.round(getTotal()));
        setSimulatedOrders((prev) => prev + 1);
        setPaymentModal(false);
        setCart([]);
        setDiscountType("none");
      }, 1500);
    }, 2000);
  };

  // Stock Order simulation copy
  const handleStockWhatsApp = (item: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStock(item);
    setTimeout(() => setCopiedStock(null), 3000);
  };

  // ROI Calculator details
  const annualDiscountFactor = billingPeriod === "annual" ? 0.8 : 1;
  const estimatedRevenueLift = Math.round(monthlySales * 0.11); // 11% average lift
  const estimatedHoursSaved = 35; // 35 hours per month

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 relative overflow-hidden font-sans grain">
      <LandingNav />

      {/* Hero Blurred Background Image Overlay (Resolves unused heroImg) */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-[0.06] blur-xl pointer-events-none z-0" 
        style={{ backgroundImage: `url(${heroImg})` }}
      />

      {/* Decorative spatial grid and glowing light sources */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.25] pointer-events-none z-0" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[130px] pointer-events-none animate-pulse duration-[8000ms] z-0" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[110px] pointer-events-none animate-pulse duration-[10000ms] z-0" />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
          
          {/* Left Text Column */}
          <div className="space-y-6 md:space-y-8 text-left">
            <motion.div
              initial="hidden" animate="visible" variants={fadeUp}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card shadow-sm text-xs font-semibold text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              Now in Private Beta · 46+ Indian venues waitlisted
            </motion.div>

            <motion.h1
              initial="hidden" animate="visible" custom={1} variants={fadeUp}
              className="font-display text-5xl md:text-7xl font-bold tracking-tight text-balance leading-[0.95]"
            >
              Turn your <span className="text-gold-gradient italic drop-shadow-[0_2px_15px_rgba(229,178,82,0.15)] font-display">रसोई</span> data into <span className="text-gold-gradient font-display">profit</span>.
            </motion.h1>

            <motion.p
              initial="hidden" animate="visible" custom={2} variants={fadeUp}
              className="text-lg text-muted-foreground max-w-xl text-balance leading-relaxed"
            >
              Upload last month's billing records (Excel, CSV, or PDF). 
              Rasoi scrubs private guest info instantly, computes 40+ key metrics, 
              and compiles a plain-English growth plan. No complex code. Just profit.
            </motion.p>

            {/* Interactive File Ingestion Action */}
            <motion.div
              initial="hidden" animate="visible" custom={3} variants={fadeUp}
              className="space-y-4 pt-2"
            >
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gold-gradient text-primary-foreground font-bold text-sm shadow-lg glow-gold hover:opacity-95 transition-all duration-200 active:scale-[0.98]"
                >
                  Start free trial
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={startDemoUpload}
                  disabled={uploading}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-border bg-card hover:bg-surface/80 text-sm font-semibold text-foreground transition-all duration-200 shadow-sm"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-gold" />
                      Processing sample records...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 text-gold animate-bounce" />
                      Simulate Excel data upload
                    </>
                  )}
                </button>
              </div>

              {/* Upload progress state machine display */}
              <AnimatePresence mode="wait">
                {uploading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-2xl border border-gold/30 bg-gold/5 max-w-md space-y-2.5 shadow-inner"
                  >
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-gold font-bold">RASOI PARSER ACTIVE</span>
                      <span className="text-muted-foreground">{Math.round((uploadStep + 1) * 20)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gold-gradient" 
                        initial={{ width: "0%" }}
                        animate={{ width: `${(uploadStep + 1) * 20}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <p className="text-xs font-mono text-foreground font-medium animate-pulse">
                      ⚡ Step {uploadStep + 1}: {[
                        "Reading sales-register.xlsx...",
                        "Scrubbing guest names and PII (92 customer profiles anonymized)...",
                        "Calculating attach rates & hourly daypart traffic...",
                        "Compiling plain-English operations metrics...",
                        "AI Analysis successfully built!"
                      ][uploadStep]}
                    </p>
                  </motion.div>
                )}
                {uploadComplete && !uploading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 text-xs font-mono text-rag-green bg-rag-green/10 border border-rag-green/20 px-3 py-1.5 rounded-full"
                  >
                    <Check className="h-3.5 w-3.5" /> Sample data loaded into interactive preview dashboard below!
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial="hidden" animate="visible" custom={4} variants={fadeUp}
              className="flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-muted-foreground font-medium pt-4 border-t border-border/80"
            >
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" /> On-Device PII Stripping</div>
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-gold" /> 20s Automated Insights</div>
            </motion.div>
          </div>

          {/* Right Column: Premium Interactive Mockup Playground */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full"
          >
            {/* Soft gold/saffron gradient glow */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-gold/30 to-saffron/20 rounded-[2rem] blur-2xl opacity-60 pointer-events-none" />

            {/* Interactive Mockup Outer Shell */}
            <div className="relative rounded-[2rem] overflow-hidden border border-border bg-card/90 shadow-2xl backdrop-blur-md p-5 min-h-[460px] flex flex-col justify-between">
              
              {/* Mockup Title bar */}
              <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-gold-gradient grid place-items-center text-primary-foreground text-[10px] font-bold">र</div>
                  <span className="font-display text-xs font-bold text-foreground">Rasoi Console · <span className="text-muted-foreground font-sans">Saffron Lounge</span></span>
                  {uploadComplete && (
                    <span className="px-1.5 py-0.5 rounded bg-rag-green/10 text-rag-green text-[8px] font-mono border border-rag-green/20">Active Session Data</span>
                  )}
                </div>
                {/* Simulated Tab controls */}
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-destructive/40" />
                  <span className="w-2.5 h-2.5 rounded-full bg-rag-amber/40" />
                  <span className="w-2.5 h-2.5 rounded-full bg-rag-green/40" />
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex gap-1 bg-surface rounded-xl p-1 mb-4 text-xs font-semibold overflow-x-auto scrollbar-none border border-border/40">
                <button 
                  onClick={() => setActiveTab("pulse")}
                  className={`flex-1 min-w-[70px] text-center py-1.5 rounded-lg transition-all duration-200 ${activeTab === "pulse" ? "bg-card text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"}`}
                >
                  📊 Pulse
                </button>
                <button 
                  onClick={() => setActiveTab("register")}
                  className={`flex-1 min-w-[70px] text-center py-1.5 rounded-lg transition-all duration-200 ${activeTab === "register" ? "bg-card text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"}`}
                >
                  🧾 Register
                </button>
                <button 
                  onClick={() => setActiveTab("poster")}
                  className={`flex-1 min-w-[70px] text-center py-1.5 rounded-lg transition-all duration-200 ${activeTab === "poster" ? "bg-card text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"}`}
                >
                  🎨 Poster
                </button>
                <button 
                  onClick={() => setActiveTab("stock")}
                  className={`flex-1 min-w-[70px] text-center py-1.5 rounded-lg transition-all duration-200 ${activeTab === "stock" ? "bg-card text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"}`}
                >
                  📦 Stock
                </button>
              </div>

              {/* Tab Content Panels */}
              <div className="flex-1 flex flex-col justify-start relative overflow-hidden min-h-[300px]">
                
                {/* 1. PULSE VIEW */}
                {activeTab === "pulse" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 flex flex-col justify-between h-full"
                  >
                    {/* Metrics row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-surface border border-border/80 rounded-xl space-y-0.5">
                        <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-bold">Today's Revenue</div>
                        <div className="text-base font-bold text-foreground font-mono">₹{simulatedSales.toLocaleString("en-IN")}</div>
                        <div className="text-[8px] text-rag-green font-bold">▲ 14% vs avg</div>
                      </div>
                      <div className="p-3 bg-surface border border-border/80 rounded-xl space-y-0.5">
                        <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-bold">Total Sales</div>
                        <div className="text-base font-bold text-foreground font-mono">{simulatedOrders} bills</div>
                        <div className="text-[8px] text-rag-green font-bold">▲ {uploadComplete ? "15 orders" : "4 orders"}</div>
                      </div>
                      <div className="p-3 bg-surface border border-border/80 rounded-xl space-y-0.5">
                        <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-bold">Avg Ticket</div>
                        <div className="text-base font-bold text-foreground font-mono">₹{uploadComplete ? "1,384" : "1,480"}</div>
                        <div className="text-[8px] text-muted-foreground font-semibold">Healthy</div>
                      </div>
                    </div>

                    {/* SVG Peak hours attach rates graphic (Correct details) */}
                    <div className="p-3 bg-surface border border-border/80 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-semibold text-muted-foreground">Attach Rate Trends (Hour by Hour)</span>
                        <span className="text-gold font-bold">Peak Dip: 3 PM - 5 PM</span>
                      </div>
                      <div className="h-16 w-full flex items-end">
                        <svg className="w-full h-full" viewBox="0 0 300 60" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          {/* Graph Path */}
                          <path 
                            d="M 0 50 Q 30 15 60 20 T 120 10 T 180 45 T 240 12 T 300 8 L 300 60 L 0 60 Z" 
                            fill="url(#chartGrad)" 
                          />
                          <path 
                            d="M 0 50 Q 30 15 60 20 T 120 10 T 180 45 T 240 12 T 300 8" 
                            fill="none" 
                            stroke="var(--gold)" 
                            strokeWidth="2" 
                          />
                          {/* Indicator Line at 3 PM Dip */}
                          <line x1="170" y1="5" x2="170" y2="55" stroke="var(--destructive)" strokeWidth="1" strokeDasharray="3,3" />
                          <circle cx="170" cy="42" r="3" fill="var(--destructive)" />
                        </svg>
                      </div>
                    </div>

                    {/* AI opportunity card */}
                    <div className="p-3.5 bg-surface border border-border/80 rounded-xl relative overflow-hidden space-y-1.5 shadow-sm">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-gold uppercase tracking-wider">
                        <Sparkles className="h-3 w-3" /> High Profit Opportunity
                      </div>
                      <div className="text-xs font-semibold text-foreground leading-normal">
                        "Butter Chicken is attachment-heavy. However, only 14% of lunch orders attach Garlic Naan. Creating a combo could lift average ticket sizes by 15%."
                      </div>
                      <div className="pt-1.5 flex justify-between items-center">
                        <span className="text-[8px] text-muted-foreground font-mono">Estimated lift: +₹32,000/mo</span>
                        <button 
                          onClick={() => {
                            setSelectedCombo("butter_chicken");
                            setActiveTab("poster");
                          }}
                          className="px-2 py-0.5 rounded bg-gold/15 text-gold text-[8px] font-bold border border-gold/25 hover:bg-gold-gradient hover:text-primary-foreground transition duration-200 flex items-center gap-0.5"
                        >
                          Try: Generate Poster <ArrowRight className="h-2 w-2" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. REGISTER (POS SIMULATOR) VIEW */}
                {activeTab === "register" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-[1.2fr_1fr] gap-3 h-full min-h-[300px]"
                  >
                    {/* Left Grid: Menu Items */}
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">Quick Cashier Grid</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "bc", name: "Butter Chicken", price: 340 },
                          { id: "gn", name: "Garlic Naan", price: 80 },
                          { id: "pt", name: "Paneer Tikka", price: 260 },
                          { id: "sl", name: "Sweet Lassi", price: 90 },
                        ].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleAddToCart(item)}
                            className="p-2 border border-border/80 bg-surface rounded-xl hover:border-gold/40 text-left transition duration-150 active:scale-[0.96] flex flex-col justify-between"
                          >
                            <span className="text-[10px] font-semibold text-foreground block truncate">{item.name}</span>
                            <span className="text-[9px] font-mono text-muted-foreground font-bold mt-1">₹{item.price}</span>
                          </button>
                        ))}
                      </div>

                      {/* AI suggestion banner */}
                      <AnimatePresence>
                        {showUpsellAlert && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="p-2 border border-gold/30 bg-gold/5 rounded-xl space-y-1 shadow-sm"
                          >
                            <div className="flex items-center gap-1 text-[8px] font-bold text-gold uppercase tracking-wider">
                              <Sparkles className="h-3 w-3" /> Smart Recommendation
                            </div>
                            <p className="text-[9px] leading-snug font-medium text-foreground">
                              Guests buying Butter Chicken order Garlic Naan 82% of the time. Suggest Naan!
                            </p>
                            <button
                              onClick={addUpsellItem}
                              className="w-full text-center py-1 rounded bg-gold-gradient text-primary-foreground font-bold text-[8px] hover:opacity-90 transition active:scale-[0.98]"
                            >
                              + Add Garlic Naan (₹80)
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Right Grid: Cart and Charge */}
                    <div className="border-l border-border/50 pl-3 flex flex-col justify-between h-full">
                      <div className="space-y-2 overflow-y-auto max-h-[170px] scrollbar-none">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">Current Bill</span>
                        {cart.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground text-[10px] flex flex-col items-center gap-1">
                            <ShoppingBag className="h-5 w-5 opacity-40 text-muted-foreground" />
                            <span>Cart is empty</span>
                            <span className="text-[8px] text-muted-foreground/60">Tap menu items to add</span>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {cart.map((item) => (
                              <div key={item.id} className="flex justify-between items-center text-[10px] bg-surface/60 p-1.5 rounded-lg border border-border/40">
                                <div className="truncate pr-1">
                                  <span className="font-semibold text-foreground">{item.name}</span>
                                  <span className="text-muted-foreground font-mono text-[8px] ml-1">x{item.qty}</span>
                                </div>
                                <div className="flex items-center gap-1.5 font-mono shrink-0">
                                  <span>₹{item.price * item.qty}</span>
                                  <button 
                                    onClick={() => handleRemoveFromCart(item.id)}
                                    className="text-destructive hover:text-destructive/80"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Bill Calculation & Checkout button */}
                      <div className="border-t border-border/50 pt-2 space-y-1.5">
                        {cart.length > 0 && (
                          <div className="space-y-1 text-[9px] font-mono">
                            <div className="flex justify-between text-muted-foreground">
                              <span>Subtotal</span>
                              <span>₹{getSubtotal()}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Discount</span>
                              <span>-₹{getDiscountAmount()}</span>
                            </div>
                            <div className="flex justify-between font-bold text-foreground border-t border-border/40 pt-1">
                              <span>Total</span>
                              <span>₹{getTotal()}</span>
                            </div>
                          </div>
                        )}

                        {/* Discount selectors */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => setDiscountType("none")}
                            className={`flex-1 text-center py-0.5 rounded text-[8px] font-bold border transition ${discountType === "none" ? "bg-foreground text-background border-foreground" : "bg-surface border-border text-muted-foreground"}`}
                          >
                            No Disc
                          </button>
                          <button
                            onClick={() => setDiscountType("10")}
                            className={`flex-1 text-center py-0.5 rounded text-[8px] font-bold border transition ${discountType === "10" ? "bg-foreground text-background border-foreground" : "bg-surface border-border text-muted-foreground"}`}
                          >
                            10%
                          </button>
                          <button
                            onClick={() => setDiscountType("happy")}
                            className={`flex-1 text-center py-0.5 rounded text-[8px] font-bold border transition ${discountType === "happy" ? "bg-foreground text-background border-foreground" : "bg-surface border-border text-muted-foreground"}`}
                          >
                            Happy Hr
                          </button>
                        </div>

                        <button
                          onClick={triggerPOSPayment}
                          disabled={cart.length === 0}
                          className="w-full text-center py-2 rounded-xl bg-gold-gradient text-primary-foreground font-bold text-xs hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow active:scale-[0.98]"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          Charge Bill
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. POSTER MAKER VIEW */}
                {activeTab === "poster" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-[1.1fr_1fr] gap-3 h-full min-h-[300px]"
                  >
                    {/* Left: Poster settings */}
                    <div className="space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">AI Poster Creator</span>
                        <div className="space-y-1.5">
                          {[
                            { id: "butter_chicken", name: "Butter Chicken & Naan Combo" },
                            { id: "samosa", name: "Happy Hour Samosa & Chai" },
                            { id: "mini_dessert", name: "Mini Dessert Attachment Deal" }
                          ].map((combo) => (
                            <button
                              key={combo.id}
                              onClick={() => setSelectedCombo(combo.id as any)}
                              className={`w-full text-left p-2 rounded-xl border text-[10px] font-semibold transition ${selectedCombo === combo.id ? "bg-gold/10 text-gold border-gold/30" : "bg-surface border-border/80 text-muted-foreground hover:text-foreground"}`}
                            >
                              {combo.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Download option */}
                      <div className="space-y-1.5">
                        <button
                          onClick={() => {
                            setGeneratingPoster(true);
                            setGenerationProgress(0);
                            const interval = setInterval(() => {
                              setGenerationProgress((p) => {
                                if (p < 100) return p + 25;
                                clearInterval(interval);
                                setGeneratingPoster(false);
                                return 100;
                              });
                            }, 300);
                          }}
                          className="w-full text-center py-2 rounded-xl bg-gold-gradient text-primary-foreground font-bold text-xs hover:opacity-95 transition flex items-center justify-center gap-1.5 shadow"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {generatingPoster ? `Generating (${generationProgress}%)` : "Generate Marketing PDF"}
                        </button>
                        <span className="text-[8px] text-muted-foreground text-center block">Generates printable high-res A4 poster design</span>
                      </div>
                    </div>

                    {/* Right: Live Poster Canvas */}
                    <div className="border border-border/80 rounded-2xl overflow-hidden bg-surface relative flex items-center justify-center aspect-[3/4]">
                      {/* Interactive fade image rendering based on selection */}
                      <div className="absolute inset-0 p-2 flex items-center justify-center bg-card">
                        <img 
                          src={
                            selectedCombo === "butter_chicken" ? butterChickenPoster :
                            selectedCombo === "samosa" ? samosaPoster :
                            miniDessertPoster
                          } 
                          alt="Marketing Promo Poster" 
                          className="w-full h-full object-contain rounded-lg border border-border/40 shadow-sm"
                        />
                      </div>
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-gold-gradient text-primary-foreground rounded text-[7px] font-bold tracking-widest uppercase">
                        AI Render
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 4. STOCK ALERTS VIEW */}
                {activeTab === "stock" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="space-y-3.5 flex flex-col justify-between h-full"
                  >
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold block">Smart Inventory Reorder Logs</span>
                      
                      <div className="space-y-2">
                        {[
                          { 
                            item: "Basmati Rice", 
                            qty: "25kg required", 
                            warn: "Runout expected in 2 days", 
                            supplier: "Rajesh Traders",
                            text: "Hi Rajesh, please deliver 25kg Basmati Rice to Saffron Lounge. Thank you." 
                          },
                          { 
                            item: "Dairy (Paneer)", 
                            qty: "15kg required", 
                            warn: "Weekend reserve low", 
                            supplier: "Amul Distribution",
                            text: "Hi Amul distributor, please send 15kg Paneer block to Saffron Lounge. Urgent. Thanks." 
                          },
                          { 
                            item: "Tomatoes", 
                            qty: "10kg required", 
                            warn: "Waste expiration check pending", 
                            supplier: "Mandvi Sabzi Market",
                            text: "Hi Mandvi Market vendor, please dispatch 10kg tomatoes to Saffron Lounge. Thanks." 
                          }
                        ].map((stock) => (
                          <div 
                            key={stock.item}
                            className="p-3 bg-surface border border-border/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-foreground">{stock.item}</span>
                                <span className="px-1.5 py-0.5 rounded bg-destructive/15 text-destructive text-[8px] font-bold border border-destructive/20">Reorder</span>
                              </div>
                              <div className="text-[9px] text-muted-foreground">{stock.qty} · <span className="text-rag-amber font-semibold">{stock.warn}</span></div>
                            </div>
                            
                            <button
                              onClick={() => handleStockWhatsApp(stock.item, stock.text)}
                              className="px-2.5 py-1.5 bg-gold-gradient text-primary-foreground text-[9px] font-bold rounded-lg shadow-sm hover:opacity-90 transition duration-150 flex items-center gap-1"
                            >
                              {copiedStock === stock.item ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <MessageCircle className="h-3 w-3" />
                                  Order WhatsApp
                                </>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {copiedStock && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        className="p-2 border border-rag-green/20 bg-rag-green/10 text-rag-green rounded-xl text-[9px] text-center font-mono font-medium"
                      >
                        ✔ Ready to paste in supplier's WhatsApp chat to dispatch order!
                      </motion.div>
                    )}
                  </motion.div>
                )}

              </div>

              {/* Interactive payment QR Modal overlay (POS Register Tab) */}
              <AnimatePresence>
                {paymentModal && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center"
                  >
                    <div className="bg-card border border-border/80 p-5 rounded-2xl max-w-[240px] space-y-4 shadow-xl">
                      <div className="h-10 w-10 rounded-full bg-gold/10 border border-gold/20 grid place-items-center mx-auto">
                        <QrCode className="h-5 w-5 text-gold" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-foreground">UPI Dynamic Payment</h4>
                        <span className="text-base font-bold text-foreground font-mono">₹{getTotal().toLocaleString("en-IN")}</span>
                      </div>
                      
                      {/* Simulated QR Code Box */}
                      <div className="h-32 w-32 bg-surface border border-border/80 rounded-xl mx-auto flex items-center justify-center p-2 relative">
                        <div className="w-full h-full bg-muted-foreground/10 rounded-lg flex items-center justify-center border border-dashed border-border/60">
                          {paymentProcessing ? (
                            <RefreshCw className="h-6 w-6 animate-spin text-gold" />
                          ) : (
                            <CheckCircle2 className="h-12 w-12 text-rag-green animate-bounce" />
                          )}
                        </div>
                      </div>

                      <p className="text-[9px] text-muted-foreground font-mono">
                        {paymentProcessing ? "💳 Simulating Scan & UPI authorization..." : "🎉 Payment Accepted! Syncing ticket..."}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Decorative base cards to represent stack layers */}
              <div className="absolute -bottom-4 left-6 right-6 h-3 bg-card border border-border/60 rounded-b-2xl shadow-lg opacity-40 z-[-1]" />
              <div className="absolute -bottom-2.5 left-3 right-3 h-3 bg-card border border-border/60 rounded-b-2xl shadow-lg opacity-60 z-[-1]" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRUST VENUES TICKER */}
      <section className="py-8 border-y border-border bg-surface/30 relative overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-6">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold block text-center mb-5">
            Empowering Waitlisted & Active Private Beta Venues Across India
          </span>
          <div className="relative flex w-full overflow-x-hidden">
            <div className="flex gap-8 items-center animate-infinite-scroll whitespace-nowrap">
              {CLIENT_VENUES.concat(CLIENT_VENUES).map((venue, idx) => (
                <div 
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-border/80 bg-card rounded-full text-xs font-semibold text-foreground/80 shadow-sm backdrop-blur hover:border-gold/30 transition cursor-default"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  {venue}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES SECTION */}
      <section id="features" className="py-24 border-t border-border relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl text-left">
            <div className="text-xs uppercase tracking-[0.2em] text-gold font-bold">Platform Capabilities</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 text-balance">
              Designed for restaurant operations, <em className="text-gold-gradient font-display italic">not</em> developer metrics.
            </h2>
          </div>
          
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            {[
              { 
                icon: ShieldCheck, 
                title: "On-Device PII Protection", 
                body: "Customer privacy is prioritized. Guest phone numbers and names are completely scrubbed inside your browser before the AI maps attachment coordinates." 
              },
              { 
                icon: Cpu, 
                title: "Plain-English Guidance", 
                body: "Skip standard database tables and SQL layouts. Get direct, written instructions outlining what is bleeding profit, what to change, and who to contact." 
              },
              { 
                icon: BarChart3, 
                title: "40+ Restaurant Metrics", 
                body: "Daypart analysis, customer return frequencies, RFM buyer cohorts, ingredient usage rates, and food wastage alerts calculated mathematically." 
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group rounded-2xl border border-border bg-card p-6 hover:border-gold/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="h-11 w-11 rounded-xl bg-gold/10 grid place-items-center border border-gold/25 transition group-hover:scale-105">
                  <f.icon className="h-5 w-5 text-gold" />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold">{f.title}</h3>
                <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how" className="py-24 border-t border-border bg-surface/10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl text-left">
            <div className="text-xs uppercase tracking-[0.2em] text-gold font-bold font-sans">Operational Workflow</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 text-balance">
              From files to improvement plan in <em className="text-gold-gradient italic font-display">under 20 seconds</em>.
            </h2>
          </div>
          
          <div className="mt-16 grid md:grid-cols-4 gap-5 relative">
            <div className="hidden lg:block absolute top-10 left-[12%] right-[12%] h-[1px] bg-border border-dashed z-0" />
            {[
              { n: "01", icon: Upload, title: "1. Upload File", body: "Drop raw Excel logs, POS reports, or sales sheets." },
              { n: "02", icon: Cpu, title: "2. Compute Stats", body: "Metrics and trends are compiled securely on-device." },
              { n: "03", icon: Sparkles, title: "3. Read Report", body: "Extract written plain-English profitability guidelines." },
              { n: "04", icon: Target, title: "4. Run Combos", body: "Push combos to POS and generate promo posters." },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="relative rounded-2xl border border-border bg-card p-6 space-y-4 hover:border-gold/30 transition-all z-10"
              >
                <div className="h-10 w-10 rounded-full bg-background border border-gold/30 grid place-items-center relative z-10 shadow-sm font-semibold">
                  <s.icon className="h-4.5 w-4.5 text-gold" />
                </div>
                <div className="space-y-1">
                  <div className="font-mono text-[9px] font-bold text-gold uppercase tracking-wider">{s.n}</div>
                  <h4 className="font-display text-lg font-bold">{s.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI CALCULATOR & PRICING SECTION */}
      <section id="pricing" className="py-24 border-t border-border relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-end mb-16">
            <div className="max-w-2xl text-left">
              <div className="text-xs uppercase tracking-[0.2em] text-gold font-bold">Subscription Options</div>
              <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 text-balance">
                Simple pricing. ROI in <em className="text-gold-gradient italic font-display">one single move</em>.
              </h2>
            </div>
            
            {/* Billing Toggle Selector */}
            <div className="flex lg:justify-end">
              <div className="inline-flex items-center gap-1.5 bg-surface border border-border rounded-full p-1 shadow-sm">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${billingPeriod === "monthly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("annual")}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${billingPeriod === "annual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Annual
                  <span className="px-1.5 py-0.5 bg-gold/15 text-gold text-[8px] font-bold rounded-full border border-gold/30">Save 20%</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive ROI Slider Widget */}
          <div className="p-6 md:p-8 rounded-3xl border border-border bg-card shadow-lg mb-16 relative overflow-hidden">
            <div className="absolute -right-24 -top-24 h-48 w-48 bg-gold/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="grid md:grid-cols-[1.2fr_1fr] gap-8 items-center">
              <div className="space-y-5">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-gold font-bold flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> Dynamic ROI Estimator
                  </span>
                  <h3 className="font-display text-2xl font-bold text-foreground">Calculate your estimated profits</h3>
                  <p className="text-xs text-muted-foreground">Adjust the slider below to represent your restaurant's current average monthly revenue to see how much Rasoi can recover.</p>
                </div>
                
                {/* Custom Range Slider */}
                <div className="space-y-3 pt-3">
                  <div className="flex justify-between font-mono text-sm font-semibold text-foreground">
                    <span>Monthly Sales</span>
                    <span className="text-gold text-base">₹{monthlySales.toLocaleString("en-IN")}</span>
                  </div>
                  <input 
                    type="range" 
                    min="100000" 
                    max="2500000" 
                    step="50000" 
                    value={monthlySales}
                    onChange={(e) => setMonthlySales(Number(e.target.value))}
                    className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-gold border border-border"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
                    <span>₹1,00,000</span>
                    <span>₹10,00,000</span>
                    <span>₹25,00,000</span>
                  </div>
                </div>
              </div>

              {/* Estimations Output layout */}
              <div className="bg-surface/50 border border-border/80 rounded-2xl p-6 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-bold">Estimated AI Lift</span>
                  <div className="text-xl font-bold text-foreground font-mono">₹{estimatedRevenueLift.toLocaleString("en-IN")}</div>
                  <span className="text-[8px] text-rag-green font-semibold">Average 11% Attachment Increase</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-bold">Admin Hours Saved</span>
                  <div className="text-xl font-bold text-foreground font-mono">~{estimatedHoursSaved} hrs/mo</div>
                  <span className="text-[8px] text-muted-foreground">Manual spreadsheets eliminated</span>
                </div>
                <div className="col-span-2 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Estimated Payback Period:</span>
                  <span className="px-2 py-0.5 bg-rag-green/10 text-rag-green font-bold text-[10px] rounded-full border border-rag-green/20">
                    Less than 2 days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                name: "Starter", 
                price: billingPeriod === "monthly" ? 999 : 799, 
                desc: "For single-venue restaurant owners.", 
                features: [
                  "1 active restaurant outlet", 
                  "6 months transaction logs history", 
                  "40+ operations and daypart metrics", 
                  "Plain-English business recommendations",
                  "Manual spreadsheet uploads (Excel/CSV)"
                ], 
                cta: "Start free trial" 
              },
              { 
                name: "Growth", 
                price: billingPeriod === "monthly" ? 2499 : 1999, 
                featured: true, 
                desc: "For small chains and scaling outlets.", 
                features: [
                  "5 active restaurant outlets", 
                  "12 months transaction logs history", 
                  "Direct webhook integrations (Petpooja, Vyapar)",
                  "Automatic daily close WhatsApp summaries",
                  "AI Combo Poster download & custom logo formats",
                  "Priority support setup assistance"
                ], 
                cta: "Start 14-day trial" 
              },
              { 
                name: "Agency", 
                price: billingPeriod === "monthly" ? 5999 : 4799, 
                desc: "For consultants and large corporate groups.", 
                features: [
                  "Unlimited restaurant outlet profiles", 
                  "Unlimited upload size history", 
                  "White-labeled PDF performance exports", 
                  "API Access & multi-terminal webhooks",
                  "Dedicated support manager",
                  "Custom database integration development"
                ], 
                cta: "Contact our team" 
              },
            ].map((t) => (
              <div
                key={t.name}
                className={`relative rounded-2xl border p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-xl ${
                  t.featured 
                    ? "border-gold bg-card shadow-lg scale-[1.02] z-10" 
                    : "border-border bg-card/60 hover:border-gold/30"
                }`}
              >
                {t.featured && (
                  <>
                    <div className="absolute -top-3.5 left-6 px-3 py-1 rounded-full bg-gold-gradient text-primary-foreground text-[8px] font-bold uppercase tracking-widest">
                      Most Popular Option
                    </div>
                    {/* Glowing gold background sweep line */}
                    <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse duration-[3000ms]" />
                  </>
                )}
                <div className="space-y-4 text-left">
                  <div>
                    <h3 className="font-display text-xl font-bold text-foreground">{t.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                  </div>
                  <div className="flex items-baseline gap-1 pt-2">
                    <span className="font-display text-4xl font-bold">₹{t.price.toLocaleString("en-IN")}</span>
                    <span className="text-xs text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-2.5 pt-4 border-t border-border text-xs">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  to="/register"
                  className={`mt-8 inline-flex w-full justify-center items-center gap-2 py-3 rounded-full text-xs font-bold transition-all duration-200 active:scale-[0.98] ${
                    t.featured 
                      ? "bg-gold-gradient text-primary-foreground hover:opacity-95 shadow" 
                      : "border border-border bg-surface hover:bg-surface-2 text-foreground"
                  }`}
                >
                  {t.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTERACTIVE FAQ SECTION */}
      <section className="py-24 border-t border-border bg-surface/5 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase tracking-[0.2em] text-gold font-bold">Common Queries</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Frequently Asked Questions</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">Have questions about data ingestion, privacy protection, or custom setups? We have compiled the answers.</p>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, idx) => (
              <div 
                key={idx}
                className="border border-border bg-card rounded-2xl overflow-hidden transition-all duration-200 hover:border-gold/30"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left font-semibold text-sm md:text-base text-foreground transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown 
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-300 shrink-0 ml-4 ${openFaq === idx ? "rotate-180 text-gold" : ""}`} 
                  />
                </button>
                
                <AnimatePresence initial={false}>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-5 pt-1 text-xs md:text-sm text-muted-foreground border-t border-border/40 leading-relaxed text-left">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-24 border-t border-border bg-surface/5 relative overflow-hidden z-10">
        <div className="absolute inset-0 ambient-glow opacity-30 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative z-10">
          <div className="h-12 w-12 rounded-full bg-gold/10 border border-gold/25 grid place-items-center mx-auto">
            <FileBarChart className="h-6 w-6 text-gold" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-5 text-balance leading-tight">
            Stop guessing. Let <span className="text-gold-gradient font-display">Rasoi</span> run the numbers.
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Your restaurant's transaction logs are a goldmine of attachment sales, daypart traffic, and reorder patterns. 
            Spend 20 seconds uploading them to unlock immediate revenue.
          </p>
          <div className="pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gold-gradient text-primary-foreground font-bold text-sm shadow-lg glow-gold hover:opacity-95 transition-all duration-200 active:scale-[0.98]"
            >
              Get started for free <ArrowRight className="h-4.5 w-4.5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
