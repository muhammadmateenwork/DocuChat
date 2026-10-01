import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export function MiniUploadSnippet() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <span className="bg-accent-soft text-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground">Refund_Policy.pdf</p>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div className="bg-accent h-full w-3/4 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MiniChatSnippet() {
  return (
    <div className="space-y-2.5">
      <div className="flex justify-end">
        <div className="rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2 text-xs text-primary-foreground">
          What&apos;s our refund window?
        </div>
      </div>
      <div className="flex justify-start">
        <div className="rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2 text-xs text-foreground">
          30 days from the delivery date, per section 4.2.
        </div>
      </div>
    </div>
  );
}

export function MiniCitationSnippet() {
  return (
    <div className="space-y-2">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
        Refund_Policy.pdf · p.4
      </div>
      <div className="rounded-lg border border-border bg-surface p-3 text-xs leading-relaxed text-muted-foreground">
        <span className="bg-accent/20 rounded px-0.5 text-foreground">
          Customers may request a full refund within 30 days
        </span>{" "}
        of the delivery date, provided the item is unused.
      </div>
    </div>
  );
}

export function MiniSourcedAnswerSnippet() {
  return (
    <div className="space-y-2">
      <div className="rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2 text-xs text-foreground">
        Refunds are accepted within 30 days of delivery.
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
          Refund_Policy.pdf · p.4
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
          Terms.docx · §2
        </span>
      </div>
    </div>
  );
}

export function MiniAdminSnippet() {
  const rows = [
    { q: "What's our refund window?", answered: true },
    { q: "Who is the CEO?", answered: false },
  ];
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-border bg-surface px-3 py-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        <span>Question</span>
        <span>Status</span>
      </div>
      {rows.map((r) => (
        <div
          key={r.q}
          className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-border px-3 py-2 text-xs last:border-b-0"
        >
          <span className="truncate text-foreground">{r.q}</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
              r.answered ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"
            )}
          >
            {r.answered ? "Answered" : "I don't know"}
          </span>
        </div>
      ))}
    </div>
  );
}

export function MiniMultilingualSnippet() {
  return (
    <div className="space-y-2.5">
      <div className="flex justify-end">
        <div
          className="rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2 text-xs text-primary-foreground"
          dir="rtl"
        >
          كم عدد ساعات العمل؟
        </div>
      </div>
      <div className="flex justify-start">
        <div
          className="rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2 text-xs text-foreground"
          dir="rtl"
        >
          ساعات العمل من 9 صباحًا حتى 6 مساءً.
        </div>
      </div>
      <div className="flex justify-end">
        <div className="rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2 text-xs text-primary-foreground">
          Karachi office ki timing kya hai?
        </div>
      </div>
      <div className="flex justify-start">
        <div className="rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2 text-xs text-foreground">
          Subah 9 se shaam 5:30 tak, Jumma break ke saath.
        </div>
      </div>
    </div>
  );
}
