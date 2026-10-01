"use client";

import { useEffect, useState } from "react";
import { FileText, Sparkles } from "lucide-react";

type Turn = { role: "user" | "assistant"; text: string; source?: string; rtl?: boolean };

const SCRIPT: Turn[] = [
  { role: "user", text: "How many vacation days do I get?" },
  {
    role: "assistant",
    text: "Full-time employees accrue 20 paid vacation days per year, credited monthly.",
    source: "Employee Handbook.pdf · page 4",
  },
  { role: "user", text: "كم عدد ساعات العمل؟", rtl: true },
  {
    role: "assistant",
    text: "ساعات العمل من 9 صباحًا حتى 6 مساءً.",
    source: "دليل-الموظف.docx · القسم 2",
    rtl: true,
  },
];

const TYPE_SPEED_MS = 32;
const PAUSE_AFTER_USER_MS = 450;
const THINK_MS = 650;
const PAUSE_AFTER_ASSISTANT_MS = 2200;
const LOOP_PAUSE_MS = 1200;

export function HeroPreview() {
  const [completed, setCompleted] = useState<Turn[]>([]);
  const [typed, setTyped] = useState("");
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const after = (fn: () => void, ms: number) => {
      timers.push(setTimeout(() => !cancelled && fn(), ms));
    };

    function playFrom(index: number) {
      if (index >= SCRIPT.length) {
        after(() => {
          setCompleted([]);
          playFrom(0);
        }, LOOP_PAUSE_MS);
        return;
      }

      const turn = SCRIPT[index];

      if (turn.role === "user") {
        setTyped("");
        let i = 0;
        const typeNext = () => {
          i++;
          setTyped(turn.text.slice(0, i));
          if (i < turn.text.length) {
            after(typeNext, TYPE_SPEED_MS);
          } else {
            after(() => {
              setCompleted((prev) => [...prev, turn]);
              setTyped("");
              playFrom(index + 1);
            }, PAUSE_AFTER_USER_MS);
          }
        };
        typeNext();
      } else {
        setThinking(true);
        after(() => {
          setThinking(false);
          setCompleted((prev) => [...prev, turn]);
          after(() => playFrom(index + 1), PAUSE_AFTER_ASSISTANT_MS);
        }, THINK_MS);
      }
    }

    playFrom(0);
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="shadow-accent/10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        <span className="ml-3 text-xs font-medium text-muted-foreground">
          Acme Corp — Employee Handbook.pdf
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-medium text-success">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          Live
        </span>
      </div>

      <div className="flex min-h-[19rem] flex-col justify-start space-y-3 p-5">
        {completed.map((turn, i) => (
          <TurnBubble key={i} turn={turn} />
        ))}

        {typed && (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
              {typed}
              <span className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 animate-pulse bg-current" />
            </div>
          </div>
        )}

        {thinking && (
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="inline-flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3.5">
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function TurnBubble({ turn }: { turn: Turn }) {
  if (turn.role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
          dir={turn.rtl ? "rtl" : undefined}
        >
          {turn.text}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up flex items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <div className="max-w-[85%] space-y-2">
        <div
          className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm text-foreground"
          dir={turn.rtl ? "rtl" : undefined}
        >
          {turn.text}
        </div>
        {turn.source && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            {turn.source}
          </div>
        )}
      </div>
    </div>
  );
}
