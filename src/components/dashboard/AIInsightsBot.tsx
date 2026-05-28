import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Bot, Sparkles, TrendingUp, Users, Pizza } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getGeminiResponse } from "@/lib/gemini";
import { FormattedAIResponse } from "@/components/ui/FormattedAIResponse";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

export function AIInsightsBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "bot",
      text: "Namaste! I am Rasoi AI powered by Gemini Brain. Ask me anything about your restaurant's billing files, metrics, popular items, or customer retention patterns! If you haven't yet, please upload your billing sheets in the workspace tab so I can train on your specific restaurant data.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add small delay to ensure rendering is complete
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isTyping, open]);

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

    // Convert existing message log into standard conversation history for Gemini context
    const historyContext = messages.map(m => ({
      role: m.sender === "user" ? "user" : "model",
      text: m.text
    }));

    const aiAnswer = await getGeminiResponse(userMsg.text, historyContext);

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: "bot",
      text: aiAnswer,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gold-gradient text-primary-foreground flex items-center justify-center glow-gold hover:opacity-95 transition z-40"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 w-96 h-[500px] rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden z-50 glow-gold"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/60 bg-surface/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gold/15 border border-gold/30 grid place-items-center">
                  <Bot className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <div className="font-display font-medium text-sm">Rasoi AI Assistant</div>
                  <div className="text-[10px] text-rag-green flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-rag-green animate-pulse" /> Live analytical engine
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Prompts */}
            <div className="p-3 bg-surface/30 border-b border-border/40 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
              <button
                onClick={() => { setInput("Which items are frequently bought together?"); }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border/80 bg-card/80 text-[11px] text-muted-foreground hover:text-foreground hover:border-gold/30 transition shrink-0"
              >
                <Pizza className="h-3 w-3 text-gold" /> Bundled Items
              </button>
              <button
                onClick={() => { setInput("Analyze customer frequency and retention"); }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border/80 bg-card/80 text-[11px] text-muted-foreground hover:text-foreground hover:border-gold/30 transition shrink-0"
              >
                <Users className="h-3 w-3 text-gold" /> Loyalty & Regulars
              </button>
              <button
                onClick={() => { setInput("How to increase average table billing?"); }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border/80 bg-card/80 text-[11px] text-muted-foreground hover:text-foreground hover:border-gold/30 transition shrink-0"
              >
                <TrendingUp className="h-3 w-3 text-gold" /> Lift Revenue
              </button>
            </div>

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${
                      m.sender === "user"
                        ? "bg-gold-gradient text-primary-foreground rounded-tr-none font-medium"
                        : "bg-surface-2 border border-border/80 rounded-tl-none text-foreground"
                    }`}
                  >
                    {m.sender === "bot" ? <FormattedAIResponse text={m.text} /> : m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-surface-2 border border-border/80 rounded-2xl rounded-tl-none p-3 text-xs text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-gold animate-spin" /> Rasoi AI is calculating rules and segments...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 border-t border-border/60 bg-surface/40 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask e.g. which item is popular..."
                className="flex-1 bg-surface border border-border/80 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-gold-gradient text-primary-foreground glow-gold hover:opacity-95 transition shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
