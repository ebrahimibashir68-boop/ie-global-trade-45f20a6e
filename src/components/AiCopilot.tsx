import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

const transport = new DefaultChatTransport({ api: "/api/chat" });

const SUGGESTIONS = [
  "Draft a contract for 20 tonnes of coffee beans, CIF Dubai, paid in π.",
  "How does escrow work when I release funds from my Pi Wallet?",
  "What's new in cross-border trade tech I should know about?",
];

function messageText(m: UIMessage) {
  return m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
}

import { loadSettings, subscribeSettings } from "@/lib/app-settings";

export function AiCopilot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [enabled, setEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport,
  });

  useEffect(() => {
    setEnabled(loadSettings().aiCopilot);
    return subscribeSettings((s) => setEnabled(s.aiCopilot));
  }, []);

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const isLoading = status === "submitted" || status === "streaming";

  const submit = async (text: string) => {
    const value = text.trim();
    if (!value || isLoading) return;
    setInput("");
    await sendMessage({ text: value });
    inputRef.current?.focus();
  };

  if (!enabled) return null;

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close PiTrade Copilot" : "Open PiTrade Copilot"}
        className="fixed bottom-5 right-5 z-50 inline-flex size-14 items-center justify-center rounded-full bg-gold-grad text-primary-foreground shadow-gold transition hover:brightness-110 active:scale-95"
      >
        {open ? <X className="size-6" /> : <Bot className="size-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[min(78vh,640px)] w-[min(96vw,400px)] flex-col overflow-hidden rounded-2xl border border-gold/30 bg-surface/95 shadow-2xl backdrop-blur">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gold/20 px-4 py-3">
            <div className="inline-flex size-9 items-center justify-center rounded-full bg-gold/15 text-gold">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm font-semibold leading-tight">
                PiTrade Copilot
              </div>
              <div className="text-[11px] text-muted-foreground">
                Trade help · Contract drafts · Ecosystem updates
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Ask about contracts, Pi Wallet payments, or what's new in trade tech.
                </p>
                <div className="space-y-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => submit(s)}
                      className="w-full rounded-xl border border-gold/25 bg-background/40 px-3 py-2 text-left text-xs text-foreground/90 transition hover:border-gold/50 hover:bg-gold/5"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              const text = messageText(m);
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={isUser ? "flex justify-end" : "flex justify-start"}
                >
                  {isUser ? (
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-primary-foreground">
                      {text}
                    </div>
                  ) : (
                    <div className="max-w-[92%] text-sm leading-relaxed text-foreground">
                      <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-headings:mt-3 prose-headings:mb-1 prose-ul:my-2 prose-ol:my-2 prose-code:text-gold">
                        <ReactMarkdown>{text || "…"}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {status === "submitted" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex size-2 animate-pulse rounded-full bg-gold" />
                Thinking…
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error.message || "Something went wrong. Try again."}
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit(input);
            }}
            className="border-t border-gold/20 bg-background/40 p-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submit(input);
                  }
                }}
                rows={1}
                placeholder="Ask PiTrade Copilot…"
                className="max-h-32 min-h-[40px] flex-1 resize-none rounded-xl border border-gold/25 bg-surface/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold/60 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold-grad text-primary-foreground shadow-gold transition hover:brightness-110 disabled:opacity-50"
              >
                <Send className="size-4" />
              </button>
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground">
              PiTrade Copilot may make mistakes. Verify contract terms before signing.
            </div>
          </form>
        </div>
      )}
    </>
  );
}
