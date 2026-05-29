import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertTriangle, Trash2, Cpu, FileSpreadsheet, FileImage, Sparkles, XCircle, Bot } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CLIENTS, getClient, inr, KPIS, REVENUE_BY_WEEK, TOP_ITEMS, ORDERS_BY_HOUR, PAYMENT_MIX, INSIGHTS, RAG_SUMMARY } from "@/lib/mock/data";
import { getGeminiResponse, getModelName } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";

export const getSafeUUID = (id: string) => {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  if (id === "c1") return "c1000000-0000-0000-0000-000000000001";
  if (id === "c2") return "c2000000-0000-0000-0000-000000000002";
  if (id === "c3") return "c3000000-0000-0000-0000-000000000003";
  if (id === "c4") return "c4000000-0000-0000-0000-000000000004";
  if (id === "c5") return "c5000000-0000-0000-0000-000000000005";
  if (id === "c6") return "c6000000-0000-0000-0000-000000000006";
  return "00000000-0000-0000-0000-000000000000";
};

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
  const [client, setClient] = useState<any>(getClient(id));
  const nav = useNavigate();
  const [tab, setTab] = useState<typeof tabs[number]>("New analysis");
  
  // Safe SSR support for sessionStorage
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = sessionStorage.getItem("userRole") || "restaurant";
      setUserRole(role);
    }
  }, []);

  useEffect(() => {
    async function loadClient() {
      try {
        const { data, error } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", getSafeUUID(id))
          .single();
        if (error) throw error;
        if (data) {
          const mockMatch = CLIENTS.find(x => x.id === data.id || x.name.toLowerCase() === data.name.toLowerCase());
          setClient({
            id: data.id,
            name: data.name,
            type: data.type || "Fine Dining",
            location: data.location || "Mumbai",
            city: data.city || "Mumbai",
            icon: data.icon || "🍽️",
            capacity: data.capacity || 50,
            lastPeriod: mockMatch?.lastPeriod || "March 2025",
            lastRevenue: mockMatch?.lastRevenue || 1200000,
            repeatRate: mockMatch?.repeatRate || 55,
            rag: mockMatch?.rag || "green",
            monthsOfData: mockMatch?.monthsOfData || 6,
            sessions: mockMatch?.sessions || 5,
          });
        }
      } catch (err) {
        console.warn("Failed to fetch client from Supabase, using mock fallback:", err);
      }
    }
    loadClient();
  }, [id]);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
        {userRole === "admin" && (
          <Link to="/clients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All clients
          </Link>
        )}
        <div className="mt-4 flex items-start gap-5 flex-wrap">
          <div className="h-16 w-16 rounded-2xl bg-surface-2 border border-border grid place-items-center text-4xl">{client.icon}</div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-4xl">{client.name}</h1>
            <div className="text-sm text-muted-foreground mt-1">
              <span className="inline-block px-2 py-0.5 rounded-full border border-border bg-surface mr-2 text-foreground/80">{client.type}</span>
              {client.location}, {client.city} · {client.capacity > 0 ? `${client.capacity} covers` : "Cloud kitchen"}
            </div>
          </div>
          <Link
            to="/sessions/$id/dashboard" params={{ id: client.id }}
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
          {tab === "New analysis" && <NewAnalysis clientId={client.id} client={client} />}
          {tab === "History" && <History restaurantId={client.id} />}
          {tab === "Settings" && <SettingsTab />}
        </div>
      </div>
    </AppShell>
  );
}

interface UploadedFile {
  name: string;
  type: string;
  size: string;
  content: string; // actual text content or base64 preview
  rawSize: number;
}

type AnalysisStep = "idle" | "reading" | "sending" | "parsing" | "done" | "error";

const STEP_LABELS: Record<AnalysisStep, string> = {
  idle: "",
  reading: "Reading uploaded files...",
  sending: "Sending data to Gemini...",
  parsing: "Parsing AI response into analytics...",
  done: "Analysis complete!",
  error: "Analysis failed — see error below.",
};

function NewAnalysis({ clientId, client }: { clientId: string; client: ReturnType<typeof getClient> }) {
  const nav = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [detectedFields, setDetectedFields] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");
  const [tourStep, setTourStep] = useState(0);


  const handleLoadDemoDataset = () => {
    setUploadedFiles([
      {
        name: "saffron_lounge_billing_march2025.csv",
        type: "text/csv",
        size: "14.2 KB",
        content: `Date,Order ID,Item Name,Quantity,Category,Price,Payment Method\n01-03-2025,TXN001,Butter Chicken,2,Mains,380,UPI\n01-03-2025,TXN001,Garlic Naan,2,Breads,60,UPI\n01-03-2025,TXN002,Dal Makhani,1,Mains,260,Cash`,
        rawSize: 14500
      }
    ]);
    setDetectedFields(["Date", "Order ID", "Item Name", "Quantity", "Category", "Price", "Payment Method"]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    setDetectedFields([]);

    const rawFiles = Array.from(e.target.files);
    const readPromises = rawFiles.map(file => {
      return new Promise<UploadedFile>((resolve) => {
        const reader = new FileReader();
        const isText = file.type.startsWith("text/") || file.name.endsWith(".csv") || file.name.endsWith(".tsv") || file.name.endsWith(".json") || file.name.endsWith(".txt");
        
        reader.onload = () => {
          let content = isText ? (reader.result as string) : `[Binary file: ${file.name}]`;
          if (content.length > 15000) content = content.substring(0, 15000) + "\n... [truncated]";
          resolve({ name: file.name, type: file.type || "application/octet-stream", size: (file.size / 1024).toFixed(1) + " KB", content, rawSize: file.size });
        };
        reader.onerror = () => resolve({ name: file.name, type: "unknown", size: "0 KB", content: "[Error]", rawSize: 0 });

        if (isText) reader.readAsText(file); else reader.readAsArrayBuffer(file);
      });
    });

    const results = await Promise.all(readPromises);
    setUploadedFiles(prev => [...prev, ...results]);
    setUploading(false);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setDetectedFields([]);
  };

  const handleStartAnalysis = async () => {
    if (uploadedFiles.length === 0) return;
    setErrorMsg("");
    setAnalysisStep("reading");

    const fileContents = uploadedFiles.map((f, i) => `--- FILE ${i + 1}: ${f.name} ---\n${f.content}`).join("\n\n");
    setAnalysisStep("sending");

    const prompt = `You are Rasoi AI. Analyze: ${client.name}. ${instructions ? `FOCUS: ${instructions}` : ""} DATA: ${fileContents} Return JSON matching requested analytics schema.`;

    try {
      const response = await getGeminiResponse(prompt);
      setAnalysisStep("parsing");
      const parsed = JSON.parse(response.replace(/```json|```/g, ""));
      const cacheKey = `rasoi_ai_analytics_${clientId}`;
      sessionStorage.setItem(cacheKey, JSON.stringify(parsed));
      
      // Save newly generated insights to Supabase so it persists permanently
      try {
        const tone = parsed.insights?.[0]?.tone || "green";
        const title = parsed.insights?.[0]?.title || "Monthly Analytics Summary";
        const summary = parsed.aiSummary || "Analysis of restaurant sales and metrics.";
        
        await supabase.from("ai_insights").insert({
          restaurant_id: getSafeUUID(clientId),
          period: parsed.lastPeriod || "March 2025",
          type: "Monthly Analytics",
          title,
          summary,
          raw_analysis: parsed,
          tone
        });
      } catch (dbErr) {
        console.warn("Could not save new AI insight to Supabase:", dbErr);
      }

      setAnalysisStep("done");
      setTimeout(() => nav({ to: "/sessions/$id/dashboard", params: { id: clientId } as any }), 1500);
    } catch (err: any) {
      setAnalysisStep("error");
      setErrorMsg(err.message || "Failed analysis.");
    }
  };

  const analyzing = analysisStep !== "idle" && analysisStep !== "done" && analysisStep !== "error";
  const textDataSize = uploadedFiles.reduce((sum, f) => sum + f.content.length, 0);

  return (
    <div className="relative grid lg:grid-cols-[1.5fr_1fr] gap-6">
      {tourStep > 0 && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl z-50 flex flex-col justify-center items-center p-6 text-center transition-all duration-300">
          <div className="max-w-md bg-card border border-gold/40 rounded-2xl p-6 shadow-2xl relative glow-gold animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-gold" />
              <div className="text-xs uppercase tracking-widest text-gold font-bold">Step {tourStep} of 4</div>
            </div>
            {tourStep === 1 && <><h3 className="font-display text-xl">Attach Billing Logs</h3><p className="text-sm text-muted-foreground mt-2 leading-relaxed">Click the **paperclip icon** to attach CSV/text logs.</p></>}
            {tourStep === 2 && <><h3 className="font-display text-xl">Set Custom Guidelines</h3><p className="text-sm text-muted-foreground mt-2 leading-relaxed">Type instructions (e.g., *"Focus on Dal Makhani sales"*).</p></>}
            {tourStep === 3 && <><h3 className="font-display text-xl">Gemini Core Engine</h3><p className="text-sm text-muted-foreground mt-2 leading-relaxed">Powered by **Gemini 2.5 Flash** for rapid analysis.</p></>}
            {tourStep === 4 && <><h3 className="font-display text-xl">Run AI Diagnostics</h3><p className="text-sm text-muted-foreground mt-2 leading-relaxed">Click **Generate AI Insights** to build your charts.</p></>}
            <div className="mt-6 flex items-center justify-between gap-4">
              <button onClick={() => setTourStep(0)} className="text-xs text-muted-foreground hover:text-foreground font-semibold">Skip Tour</button>
              <div className="flex gap-2">
                {tourStep > 1 && <button onClick={() => setTourStep(s => s - 1)} className="px-3.5 py-1.5 rounded-lg border border-border bg-surface-2 text-xs font-semibold text-foreground">Back</button>}
                <button onClick={() => tourStep < 4 ? setTourStep(s => s + 1) : setTourStep(0)} className="px-4 py-1.5 rounded-lg bg-gold-gradient text-primary-foreground text-xs font-semibold glow-gold">{tourStep === 4 ? "Finish" : "Next"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold flex items-center gap-2"><Bot className="h-5 w-5 text-gold" /> Gemini Insights Console</h2>
            <p className="text-xs text-muted-foreground">Upload files and write prompt rules to train the local model.</p>
          </div>
          <button onClick={() => setTourStep(1)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs font-semibold hover:bg-gold/20 transition"><Sparkles className="h-3.5 w-3.5" /> Quick Tour</button>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col p-4 space-y-4">
          {uploadedFiles.length > 0 ? (
            <div className="flex flex-wrap gap-2 animate-in fade-in duration-200">
              {uploadedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 border border-border/80 rounded-xl text-xs">
                  <FileSpreadsheet className="h-4 w-4 text-rag-green" />
                  <span className="font-medium truncate max-w-[150px]">{f.name}</span>
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-rag-red transition ml-1"><XCircle className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-10 flex items-center text-xs text-muted-foreground/80 italic">No files attached. Click the paperclip to load datasets.</div>
          )}

          <div className="relative border border-border rounded-xl bg-surface/50 focus-within:ring-2 focus-within:ring-ring/40 transition">
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Provide specific details or guidelines (e.g. 'Focus on Dal Makhani sales')..."
              className="w-full bg-transparent resize-none pl-4 pr-12 pt-3 pb-12 text-sm focus:outline-none min-h-[90px]"
              disabled={analyzing}
            />
            <div className="absolute left-3 bottom-3 flex items-center gap-2">
              <input id="tour-file-input" type="file" multiple accept=".csv,.tsv,.txt,.json,.xlsx,.xls" onChange={handleFileUpload} disabled={uploading || analyzing} className="hidden" />
              <label htmlFor="tour-file-input" className="h-8 w-8 rounded-lg bg-surface border border-border/80 hover:border-gold/30 hover:bg-surface-2 grid place-items-center cursor-pointer text-muted-foreground hover:text-foreground transition shadow-sm"><Upload className="h-4 w-4 text-gold" /></label>
            </div>
            <div className="absolute right-3 bottom-3"><span className="text-[10px] text-muted-foreground font-mono bg-surface border border-border rounded px-1.5 py-0.5">Gemini 2.5 Active</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SuggestionCard title="⚡ Load Demo Dataset" desc="Instantly load Saffron Lounge's transaction log for simulation." onClick={handleLoadDemoDataset} />
          <SuggestionCard title="🌿 Exclude Tax & GST" desc="Set instruction: 'Please exclude 5% tax/GST from gross returns.'" onClick={() => setInstructions("Please exclude 5% GST and service taxes from the gross revenue calculations.")} />
          <SuggestionCard title="🍕 Focus on Breads" desc="Set instruction: 'Analyze bread attachments (Naan/Roti) with Curry.'" onClick={() => setInstructions("Analyze bread attachments. Check how Dal Makhani/Butter Chicken orders bundle with Garlic Naan vs Roti.")} />
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-6 flex flex-col justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Analysis Details</div>
          <div className="font-display text-2xl mt-1">March 2025 Summary</div>
          <div className="mt-6 space-y-3.5 text-sm">
            <StatusRow icon={CheckCircle2} ok={uploadedFiles.length > 0}>{uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s) loaded.` : "Attach billing files to train."}</StatusRow>
            {detectedFields.length > 0 && <StatusRow icon={CheckCircle2} ok>Detected {detectedFields.length} columns.</StatusRow>}
          </div>

          {analysisStep !== "idle" && (
            <div className="mt-6 space-y-2.5">
              {(["reading", "sending", "parsing", "done"] as const).map(step => {
                const isActive = step === analysisStep;
                const isComplete = ["reading", "sending", "parsing", "done"].indexOf(step) < ["reading", "sending", "parsing", "done"].indexOf(analysisStep);
                return (
                  <div key={step} className={`flex items-center gap-2.5 text-xs ${isActive ? "text-gold font-medium" : isComplete ? "text-rag-green" : "text-muted-foreground"}`}>
                    {isActive ? <Sparkles className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    {STEP_LABELS[step]}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <button onClick={handleStartAnalysis} disabled={uploadedFiles.length === 0 || analyzing} className="mt-8 w-full px-4 py-3 rounded-xl bg-gold-gradient text-primary-foreground text-sm font-semibold glow-gold">
          {analyzing ? "Running calculations..." : "Generate AI Insights"}
        </button>
      </div>
    </div>
  );
}

function SuggestionCard({ title, desc, onClick }: { title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="p-3.5 rounded-xl border border-border bg-card hover:bg-surface-2 hover:border-gold/30 text-left transition flex flex-col justify-between group">
      <div className="font-semibold text-xs text-foreground group-hover:text-gold transition">{title}</div>
      <div className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{desc}</div>
    </button>
  );
}

function StatusRow({ icon: Icon, ok, children }: { icon: any; ok?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className={`h-4 w-4 mt-0.5 ${ok ? "text-rag-green" : "text-rag-amber"}`} />
      <span className="text-muted-foreground">{children}</span>
    </div>
  );
}

function History({ restaurantId }: { restaurantId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const { data, error } = await supabase
          .from("ai_insights")
          .select("*")
          .eq("restaurant_id", getSafeUUID(restaurantId))
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const formatted = data.map((insight: any) => {
            const raw = insight.raw_analysis || {};
            const kpis = raw.kpis || {};
            const rag = raw.ragSummary || { green: 0, amber: 0, red: 0 };
            return {
              id: insight.id,
              m: insight.period || new Date(insight.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
              tx: kpis.totalOrders || 0,
              rev: kpis.totalRevenue || 0,
              repeat: kpis.repeatRate || 0,
              rag: { g: rag.green || 0, a: rag.amber || 0, r: rag.red || 0 }
            };
          });
          setRows(formatted);
        } else {
          // Default fallbacks
          setRows([
            { m: "March 2025", tx: 1247, rev: 1842000, repeat: 58, rag: { g: 6, a: 4, r: 2 } },
            { m: "February 2025", tx: 1129, rev: 1638000, repeat: 56, rag: { g: 5, a: 5, r: 2 } },
            { m: "January 2025", tx: 1058, rev: 1495000, repeat: 53, rag: { g: 4, a: 5, r: 3 } },
            { m: "December 2024", tx: 1402, rev: 2104000, repeat: 61, rag: { g: 7, a: 3, r: 2 } },
          ]);
        }
      } catch (err) {
        console.warn("Failed to fetch ai_insights history, falling back:", err);
        setRows([
          { m: "March 2025", tx: 1247, rev: 1842000, repeat: 58, rag: { g: 6, a: 4, r: 2 } },
          { m: "February 2025", tx: 1129, rev: 1638000, repeat: 56, rag: { g: 5, a: 5, r: 2 } },
          { m: "January 2025", tx: 1058, rev: 1495000, repeat: 53, rag: { g: 4, a: 5, r: 3 } },
          { m: "December 2024", tx: 1402, rev: 2104000, repeat: 61, rag: { g: 7, a: 3, r: 2 } },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Cpu className="h-6 w-6 text-gold animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading analysis history...</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface/60 text-xs uppercase tracking-widest text-muted-foreground">
          <tr><Th>Month</Th><Th>Transactions</Th><Th>Revenue</Th><Th>Repeat</Th><Th>RAG</Th><Th>Actions</Th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id || r.m} className="border-t border-border/60 hover:bg-surface/40">
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
                <Link to="/sessions/$id/dashboard" params={{ id: restaurantId }} className="text-gold hover:underline">View →</Link>
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