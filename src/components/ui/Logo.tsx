import { cn } from "@/lib/utils";

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("h-7 w-7", className)} aria-hidden>
      <rect x="4" y="3" width="17" height="21" rx="4" fill="var(--foreground)" />
      <rect x="13" y="11" width="16" height="13" rx="5" fill="var(--accent)" />
      <path d="M17 22.5 L17 28 L21.5 22.5 Z" fill="var(--accent)" />
    </svg>
  );
}

export function Logo({ className, iconOnly }: { className?: string; iconOnly?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Mark />
      {!iconOnly && (
        <span className="font-display text-lg font-semibold tracking-tight">DocuChat</span>
      )}
    </span>
  );
}
