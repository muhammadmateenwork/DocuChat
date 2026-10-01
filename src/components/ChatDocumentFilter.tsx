"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileText, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Doc = { id: string; filename: string };

export function ChatDocumentFilter({
  documents,
  selectedIds,
  onChange,
}: {
  documents: Doc[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  const label =
    selectedIds.length === 0
      ? "All documents"
      : selectedIds.length === 1
        ? documents.find((d) => d.id === selectedIds[0])?.filename || "1 document"
        : `${selectedIds.length} documents`;

  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
      >
        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="max-w-[10rem] truncate">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-20 mt-1.5 w-64 rounded-lg border border-border bg-card p-1.5 shadow-lg">
          <button
            onClick={() => onChange([])}
            className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted"
          >
            All documents
            {selectedIds.length === 0 && <Check className="h-3.5 w-3.5 text-accent" />}
          </button>
          <div className="my-1 border-t border-border" />
          <div className="max-h-56 overflow-y-auto">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => toggle(doc.id)}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted"
              >
                <span className="truncate">{doc.filename}</span>
                {selectedIds.includes(doc.id) && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                )}
              </button>
            ))}
            {documents.length === 0 && (
              <p className="px-2.5 py-1.5 text-sm text-muted-foreground">No documents yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function LanguageDropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "appearance-none rounded-full border border-border bg-card py-1.5 pr-7 pl-3 text-xs font-medium text-foreground hover:bg-muted"
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
