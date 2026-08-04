import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Bot, Send, Sparkles, X, Wrench, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AGENTS, type AgentId } from "@/lib/ai/agents";
import { supabase } from "@/integrations/supabase/client";
import { loadSettings, subscribeSettings } from "@/lib/app-settings";

function messageText(m: UIMessage) {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

type ToolPart = { type: string; state?: string; output?: unknown; errorText?: string };

function toolActivity(m: UIMessage): ToolPart[] {
  return (m.parts as unknown as ToolPart[]).filter((p) => p.type?.startsWith("tool-"));
}

function toolLabel(type: string) {
  return type.replace(/^tool-/, "").replace(/_/g, " ");
}

export function AiCopilot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [agent, setAgent] = useState<AgentId>("desk");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setToken(s?.access_token ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { agent },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    [agent, token],
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({ id: agent, transport });

  const active = AGENTS.find((a) => a.id === agent) ?? AGENTS[0]!;

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
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close PiTrade AI agents" : "Open PiTrade AI agents"}
        className="fixed bottom-5 right-5 z-50 inline-flex size-14 items-center justify-center rounded-full bg-gold-grad text-primary-foreground shadow-gold transition hover:brightness-110 active:scale-95"
      >
        {open ? <X className="size-6" /> : <Bot className="size-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[min(80vh,680px)] w-[min(96vw,420px)] flex-col overflow-hidden rounded-2xl border border-gold/30 bg-surface/95 shadow-2xl backdrop-blur">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gold/20 px-4 py-3">
            <div className="inline-flex size-9 items-center justify-center rounded-full bg-gold/15 text-gold">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-semibold leading-tight">{active.name}</div>
              <div className="truncate text-[11px] text-muted-foreground">{active.tagline}</div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="rounded-lg border border-gold/25 px-2 py-1 text-[10px] text-muted-foreground transition hover:border-gold/50 hover:text-foreground"
              >
                New
              </button>
            )}
          </div>

          {/* Agent picker */}
          <div className="flex gap-1.5 overflow-x-auto border-b border-gold/15 px-3 py-2">
            {AGENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAgent(a.id)}
                className={`shrink-0 rounded-full border px-3 py-1 text-[11px] transition ${
                  a.id === agent
                    ? "border-gold/60 bg-gold/15 text-gold"
                    : "border-gold/20 text-muted-foreground hover:border-gold/40 hover:text-foreground"
                }`}
              >
                {a.name.replace(" Agent", "")}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{active.blurb}</p>
                <div className="space-y-2">
                  {active.suggestions.map((s) => (
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
              const tools = isUser ? [] : toolActivity(m);
              return (
                <div key={m.id} className={isUser ? "flex justify-end" : "space-y-2"}>
                  {isUser ? (
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-primary-foreground">
                      {text}
                    </div>
                  ) : (
                    <>
                      {tools.map((t, i) => (
                        <div
                          key={`${t.type}-${i}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-gold/20 bg-background/40 px-2.5 py-1 text-[11px] text-muted-foreground"
                        >
                          {t.state === "output-available" ? (
                            <CheckCircle2 className="size-3 text-gold" />
                          ) : (
                            <Wrench className="size-3 animate-pulse text-gold" />
                          )}
                          <span className="capitalize">{toolLabel(t.type)}</span>
                          {t.errorText && <span className="text-red-300">failed</span>}
                        </div>
                      ))}
                      {text && (
                        <div className="max-w-[95%] text-sm leading-relaxed text-foreground">
                          <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-headings:mt-3 prose-headings:mb-1 prose-ul:my-2 prose-ol:my-2 prose-code:text-gold">
                            <ReactMarkdown>{text}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {status === "submitted" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex size-2 animate-pulse rounded-full bg-gold" />
                Working…
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
                placeholder={`Ask the ${active.name.replace(" Agent", "")} agent…`}
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
              Agents act on your account. Review contract terms before signing or paying.
            </div>
          </form>
        </div>
      )}
    </>
  );
}
