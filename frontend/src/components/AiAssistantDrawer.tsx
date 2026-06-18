import React, { useEffect, useRef, useState } from "react";
import { X, Sparkles, Send, Bot, User as UserIcon } from "lucide-react";
import api from "../services/api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What's expiring soon?",
  "How are today's sales?",
  "What's low on stock?",
];

const AiAssistantDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your Stock Easy AI Assistant. Ask me about inventory, near-expiry stock, today's sales, or reorder alerts.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/ai/ask", { prompt: text });
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err?.response?.data?.message || "Sorry, I couldn't process that right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {open && <div className="fixed inset-0 z-30 bg-black/10 md:hidden" onClick={onClose} />}

      <aside
        className={`fixed right-0 top-0 z-40 h-screen w-full max-w-sm transform border-l border-slate-200/60 bg-white/80 backdrop-blur-md shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/60 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal/10">
                <Sparkles className="h-4.5 w-4.5 text-teal" />
              </div>
              <div>
                <p className="text-sm font-bold text-graphite-900">Stock Easy AI Assistant</p>
                <p className="text-xs text-slate-400">Grounded in your live shop data</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex items-start gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    m.role === "user" ? "bg-graphite-900" : "bg-teal/10"
                  }`}
                >
                  {m.role === "user" ? (
                    <UserIcon className="h-3.5 w-3.5 text-white" />
                  ) : (
                    <Bot className="h-3.5 w-3.5 text-teal" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-graphite-900 text-white"
                      : "border border-slate-200/70 bg-white text-slate-700"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal/10">
                  <Bot className="h-3.5 w-3.5 text-teal" />
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-white px-3.5 py-2.5 text-sm text-slate-400">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap gap-2 px-5 pb-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="rounded-full border border-teal/30 bg-teal/5 px-3 py-1 text-xs font-medium text-teal hover:bg-teal/10"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-slate-200/60 p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Stock Easy AI..."
                className="input-field flex-1"
              />
              <button type="submit" className="btn-primary !px-3.5" disabled={loading}>
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AiAssistantDrawer;
