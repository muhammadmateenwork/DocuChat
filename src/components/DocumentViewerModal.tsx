"use client";

import { useEffect, useState } from "react";
import { X, FileText, ExternalLink } from "lucide-react";

type Section = { locatorType: "page" | "section"; locatorValue: number; content: string };

export function DocumentViewerModal({
  documentId,
  filename,
  onClose,
}: {
  documentId: string;
  filename: string;
  onClose: () => void;
}) {
  const [sections, setSections] = useState<Section[] | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/documents/${documentId}/content`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.sections) setSections(data.sections);
        else setError(data.error || "Could not load this document");
      })
      .catch(() => !cancelled && setError("Could not load this document"));

    fetch(`/api/documents/${documentId}/view`)
      .then((res) => res.json())
      .then((data) => !cancelled && data.url && setViewUrl(data.url));

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex h-full max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border p-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="bg-accent-soft text-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
              <FileText className="h-4.5 w-4.5" />
            </span>
            <h3 className="truncate text-sm font-semibold">{filename}</h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {viewUrl && (
              <a
                href={viewUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:bg-muted flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground"
              >
                Original file
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <button
              onClick={onClose}
              className="hover:bg-muted flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {error && <p className="text-sm text-destructive">{error}</p>}

          {!sections && !error && (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="bg-muted h-3 w-16 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-full animate-pulse rounded" />
                  <div className="bg-muted h-4 w-5/6 animate-pulse rounded" />
                </div>
              ))}
            </div>
          )}

          {sections && (
            <div className="space-y-6">
              {sections.map((s, i) => (
                <div key={i}>
                  <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {s.locatorType === "page" ? "Page" : "Section"} {s.locatorValue}
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {s.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
