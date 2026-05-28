import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Bot, Sparkles, TrendingUp, Users, Pizza, HelpCircle, ChevronRight, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getGeminiResponse } from "@/lib/gemini";
import { useAuth } from "@/lib/auth";
import { CLIENTS } from "@/lib/mock/data";
import { FormattedAIResponse } from "@/components/ui/FormattedAIResponse";

export const Route = createFileRoute("/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — Rasoi Intelligence" }, { name: "description", content: "Chat with Rasoi AI Assistant powered by Gemini." }] }),
  component: AssistantPage,
});

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

function AssistantPage() {
  const nav = useNavigate();
  const { userRole, restaurantId, loading: authLoading } = useAuth();
  const [activeRestaurantId, setActiveRestaurantId] = useState("c1");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync active restaurant
  useEffect(() => {
    if (!authLoading) {
      if (!userRole) {
        nav({ to: "/login" });
      } else {
        const storedId = sessionStorage.getItem("activeRestaurantId");
        const rId = userRole === "restaurant" ? (restaurantId || "c1") : (storedId || "c1");
        setActiveRestaurantId(rId);
      }
    }
  }, [userRole, restaurantId, authLoading, nav]);

  const activeRestaurant = CLIENTS.find(c => c.id === activeRestaurantId) || CLIENTS[0];

  // Initialize welcome message
  useEffect(() => {
    if (activeRestaurant) {
      setMessages([
        {
          id: "init",
          sender: "bot",
          text: `Namaste! I am Rasoi AI, your virtual assistant for ${activeRestaurant.name}. Ask me anything about your sales, menu optimizations, customer cohorts, or combo deals. \n\nIf you haven't uploaded your latest transaction logs, you can do so in the "Upload Data" section.`,
          timestamp: new Date()
        }
      ]);
    }
  }, [activeRestaurantId]);

  // Auto-scroll to bottom
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const historyContext = messages.map(m => ({
      role: m.sender === "user" ? "user" : "model",
      text: m.text
    }));

    // Inject active restaurant context for higher quality responses
    const contextPrompt = `
Context: You are analyzing data for "${activeRestaurant.name}" (a ${activeRestaurant.type} restaurant in ${activeRestaurant.location}, ${activeRestaurant.city}).
User query: ${userMsg.text}
`;

    const aiAnswer = await getGeminiResponse(contextPrompt, historyContext);

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: "bot",
      text: aiAnswer,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  const handleSuggestion = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <AppShell>
      <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/60 bg-surface/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gold/10 border border-gold/20 grid place-items-center">
              <Bot className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold">Rasoi AI Assistant</h1>
              <p className="text-xs text-muted-foreground">Conversational intelligence for {activeRestaurant.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rag-green animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">Gemini Active</span>
          </div>
        </div>

        {/* Main Content Pane */}
        <div className="flex-1 flex overflow-hidden">
          {/* Suggestions sidebar (desktop only) */}
          <div className="hidden md:flex w-80 border-r border-border/60 bg-sidebar/30 flex-col p-5 overflow-y-auto">
            <div className="text-xs uppercase tracking-wider text-gold font-semibold mb-4">Quick Prompts</div>
            <div className="space-y-3">
              <SuggestionCard
                icon={Pizza}
                title="Bundled Dishes"
                desc="Which menu items are frequently bought together?"
                onClick={() => handleSuggestion("Which items are frequently bought together?")}
              />
              <SuggestionCard
                icon={Users}
                title="Loyalty & Regulars"
                desc="Analyze customer retention rates and weekday repeat visits."
                onClick={() => handleSuggestion("Analyze customer frequency and retention")}
              />
              <SuggestionCard
                icon={TrendingUp}
                title="Increase Ticket Size"
                desc="How can we increase the average table billing size?"
                onClick={() => handleSuggestion("How to increase average table billing?")}
              />
              <SuggestionCard
                icon={HelpCircle}
                title="Lunch Combo Deals"
                desc="Suggest lunch combinations to boost weekday occupancy."
                onClick={() => handleSuggestion("Give me 3 lunch combo ideas to boost weekday sales")}
              />
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 flex flex-col bg-background/50 relative overflow-hidden">
            {/* Scrollable Messages container (with hidden scrollbar styling) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-3 max-w-[85%] lg:max-w-[75%]`}>
                    {m.sender === "bot" && (
                      <div className="h-8 w-8 rounded-lg bg-gold/15 border border-gold/30 grid place-items-center shrink-0">
                        <Bot className="h-4.5 w-4.5 text-gold" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                        m.sender === "user"
                          ? "bg-gold-gradient text-primary-foreground rounded-tr-none font-medium whitespace-pre-line"
                          : "bg-surface-2 border border-border/60 rounded-tl-none text-foreground"
                      }`}
                    >
                      {m.sender === "bot" ? <FormattedAIResponse text={m.text} /> : m.text}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[75%]">
                    <div className="h-8 w-8 rounded-lg bg-gold/15 border border-gold/30 grid place-items-center shrink-0">
                      <Bot className="h-4.5 w-4.5 text-gold animate-spin" />
                    </div>
                    <div className="bg-surface-2 border border-border/60 rounded-2xl rounded-tl-none p-4 text-xs text-muted-foreground flex items-center gap-1.5 shadow-sm">
                      <Sparkles className="h-3.5 w-3.5 text-gold animate-spin" />
                      Computing menu parameters and transactional coefficients...
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Floating Quick Prompts (mobile only) */}
            <div className="flex md:hidden px-4 py-2 border-t border-border/40 overflow-x-auto gap-2 bg-surface/20 scrollbar-none">
              <button
                onClick={() => handleSuggestion("Which items are frequently bought together?")}
                className="px-2.5 py-1 rounded-full border border-border bg-card text-[10px] text-muted-foreground whitespace-nowrap"
              >
                Bundled Items
              </button>
              <button
                onClick={() => handleSuggestion("Analyze customer frequency and retention")}
                className="px-2.5 py-1 rounded-full border border-border bg-card text-[10px] text-muted-foreground whitespace-nowrap"
              >
                Loyalty & Regulars
              </button>
              <button
                onClick={() => handleSuggestion("How to increase average table billing?")}
                className="px-2.5 py-1 rounded-full border border-border bg-card text-[10px] text-muted-foreground whitespace-nowrap"
              >
                Lift Revenue
              </button>
            </div>

            {/* Input Form Box */}
            <form onSubmit={handleSend} className="p-4 border-t border-border/60 bg-surface/30">
              <div className="max-w-4xl mx-auto flex gap-3 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Ask AI Assistant about ${activeRestaurant.name}...`}
                  className="flex-1 bg-surface border border-border hover:border-border-2 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 shadow-inner"
                />
                <button
                  type="submit"
                  className="px-5 rounded-2xl bg-gold-gradient text-primary-foreground glow-gold hover:opacity-95 transition flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Ask AI</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SuggestionCard({ icon: Icon, title, desc, onClick }: { icon: any; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3.5 rounded-xl border border-border/60 bg-card hover:bg-surface-2 hover:border-gold/30 transition flex gap-3 group"
    >
      <div className="h-8 w-8 rounded-lg bg-surface-2 border border-border group-hover:bg-gold/15 group-hover:border-gold/30 grid place-items-center shrink-0 transition">
        <Icon className="h-4 w-4 text-gold" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold flex items-center justify-between">
          {title}
          <ChevronRight className="h-3 w-3 text-muted-foreground/60 group-hover:translate-x-0.5 transition" />
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed truncate">{desc}</div>
      </div>
    </button>
  );
}
