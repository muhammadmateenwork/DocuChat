"use client";

import { useRef, useState } from "react";
import { ArrowUp, FileText, MessageCircleMore, Sparkles, Languages, AlertTriangle } from "lucide-react";
import type { RetrievedSource } from "@/lib/rag/types";
import type { ReplyLanguage } from "@/lib/rag/prompt";
import { SourcePanel } from "./SourcePanel";
import { Markdown } from "./Markdown";
import { ChatDocumentFilter, LanguageDropdown } from "./ChatDocumentFilter";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: RetrievedSource[];
  streaming?: boolean;
};

type Props =
  | { mode: "org"; orgId: string; documents: { id: string; filename: string }[] }
  | { mode: "demo" };

const LANGUAGE_OPTIONS: { value: ReplyLanguage; label: string }[] = [
  { value: "auto", label: "Auto-detect" },
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "ur-roman", label: "Roman Urdu" },
];

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-current" style={{ animationDelay: "0ms" }} />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-current" style={{ animationDelay: "150ms" }} />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-current" style={{ animationDelay: "300ms" }} />
    </span>
  );
}

export function ChatPanel(props: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [replyLanguage, setReplyLanguage] = useState<ReplyLanguage>("auto");
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [activeSource, setActiveSource] = useState<RetrievedSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || sending) return;

    setError(null);
    setInput("");
    setSending(true);

    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", content: question };
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          sessionId: sessionIdRef.current,
          replyLanguage,
          ...(props.mode === "org"
            ? { orgId: props.orgId, documentIds: selectedDocIds }
            : { demo: true }),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(data.error || "Request failed");
      }

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: data.answer, sources: data.sources, streaming: false }
              : m
          )
        );
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let text = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const evt of events) {
          const lines = evt.split("\n");
          const eventLine = lines.find((l) => l.startsWith("event:"));
          const dataLine = lines.find((l) => l.startsWith("data:"));
          if (!eventLine || !dataLine) continue;

          const eventName = eventLine.slice(6).trim();
          const data = dataLine.slice(5).trim();

          if (eventName === "sources") {
            const sources = JSON.parse(data) as RetrievedSource[];
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, sources } : m))
            );
          } else if (eventName === "delta") {
            text += JSON.parse(data) as string;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: text } : m))
            );
          } else if (eventName === "error") {
            const { message } = JSON.parse(data) as { message: string };
            text += `\n\n[${message}]`;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: text } : m))
            );
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: text || "Sorry, I couldn't generate a response. Please try again.", streaming: false }
            : m
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-6">
        {props.mode === "org" && (
          <ChatDocumentFilter
            documents={props.documents}
            selectedIds={selectedDocIds}
            onChange={setSelectedDocIds}
          />
        )}
        <div className="flex items-center gap-1.5">
          <Languages className="h-3.5 w-3.5 text-muted-foreground" />
          <LanguageDropdown value={replyLanguage} onChange={(v) => setReplyLanguage(v as ReplyLanguage)} options={LANGUAGE_OPTIONS} />
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
              <MessageCircleMore className="h-5 w-5" />
            </span>
            <p className="max-w-xs text-sm">
              Ask a question about your documents. Answers only use what&apos;s in them, with
              sources you can click to verify.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex items-start gap-2.5"}>
            {m.role === "assistant" && (
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
            )}
            <div className={m.role === "user" ? "max-w-[85%]" : "max-w-[85%] flex-1"}>
              <div
                className={
                  m.role === "user"
                    ? "inline-block rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                    : "inline-block rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm text-foreground"
                }
              >
                {m.role === "assistant" ? (
                  m.content ? (
                    <Markdown content={m.content} />
                  ) : m.streaming ? (
                    <TypingDots />
                  ) : (
                    ""
                  )
                ) : (
                  m.content
                )}
              </div>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {m.sources.map((s) => (
                    <button
                      key={s.chunkId}
                      onClick={() => setActiveSource(s)}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent"
                    >
                      <FileText className="h-3 w-3" />
                      <span className="max-w-[9rem] truncate">{s.filename}</span>
                      <span className="text-muted-foreground/70">
                        · {s.locatorType === "page" ? "p." : "§"}
                        {s.locatorValue}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {error && (
          <div className="bg-destructive-soft text-destructive flex items-start gap-2 rounded-lg px-3 py-2 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-border p-4 sm:px-6">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your documents…"
          className="h-11 flex-1 rounded-full border border-input bg-card px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm shadow-accent/30 transition-colors hover:bg-accent-hover disabled:opacity-40"
        >
          <ArrowUp className="h-4.5 w-4.5" />
        </button>
      </form>

      {activeSource && <SourcePanel source={activeSource} onClose={() => setActiveSource(null)} />}
    </div>
  );
}
