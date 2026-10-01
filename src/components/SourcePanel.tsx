"use client";

import { useEffect, useState } from "react";
import { X, FileText, ExternalLink, AlertTriangle } from "lucide-react";
import type { RetrievedSource } from "@/lib/rag/types";

export function SourcePanel({
  source,
  onClose,
}: {
  source: RetrievedSource;
  onClose: () => void;
}) {
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/documents/${source.documentId}/view`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.url) setViewUrl(data.url);
        else setViewError(data.error || "Could not load document");
      })
      .catch(() => !cancelled && setViewError("Could not load document"));
    return () => {
      cancelled = true;
    };
  }, [source.documentId]);

  const locatorLabel = source.locatorType === "page" ? "Page" : "Section";
  const anchoredUrl =
    viewUrl && source.locatorType === "page" ? `${viewUrl}#page=${source.locatorValue}` : viewUrl;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <FileText className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {locatorLabel} {source.locatorValue}
              </p>
              <h3 className="text-sm font-semibold">{source.filename}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Exact source text
          </p>
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {source.content}
          </div>
        </div>

        <div className="border-t border-border p-5">
          {viewError ? (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" /> {viewError}
            </p>
          ) : (
            <a
              href={anchoredUrl ?? undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!anchoredUrl}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-medium text-accent-foreground shadow-sm shadow-accent/30 transition-colors hover:bg-accent-hover aria-disabled:pointer-events-none aria-disabled:opacity-50"
            >
              View in original document
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
