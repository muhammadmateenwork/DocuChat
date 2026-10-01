"use client";

import { useState } from "react";
import { FileText, Eye } from "lucide-react";
import { DocumentViewerModal } from "./DocumentViewerModal";

export type BrowsableDoc = {
  id: string;
  filename: string;
  kind: "pdf" | "docx";
  page_count?: number | null;
};

/** Desktop sidebar: full list of documents with a one-click preview. */
export function DocumentsSidebar({
  documents,
  title = "Documents",
}: {
  documents: BrowsableDoc[];
  title?: string;
}) {
  const [preview, setPreview] = useState<BrowsableDoc | null>(null);

  return (
    <>
      <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-l border-border bg-muted/20 md:flex">
        <div className="border-b border-border px-4 py-3.5">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">
            {documents.length} document{documents.length === 1 ? "" : "s"} · click to read
          </p>
        </div>
        <div className="space-y-1.5 p-3">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setPreview(doc)}
              className="group hover:border-accent/30 flex w-full items-center gap-3 rounded-lg border border-transparent bg-card p-3 text-left shadow-sm transition-colors"
            >
              <span className="bg-accent-soft text-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{doc.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.kind.toUpperCase()}
                  {doc.page_count ? ` · ${doc.page_count} ${doc.kind === "pdf" ? "pages" : "sections"}` : ""}
                </p>
              </div>
              <Eye className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
          {documents.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">No documents yet</p>
          )}
        </div>
      </aside>

      {preview && (
        <DocumentViewerModal
          documentId={preview.id}
          filename={preview.filename}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}

/** Mobile fallback: a horizontal strip of tappable document chips. */
export function DocumentsChipRow({ documents }: { documents: BrowsableDoc[] }) {
  const [preview, setPreview] = useState<BrowsableDoc | null>(null);

  if (documents.length === 0) return null;

  return (
    <>
      <div className="flex gap-2 overflow-x-auto border-b border-border bg-muted/20 px-4 py-2.5 md:hidden">
        {documents.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setPreview(doc)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium"
          >
            <FileText className="text-accent h-3 w-3" />
            {doc.filename}
          </button>
        ))}
      </div>

      {preview && (
        <DocumentViewerModal
          documentId={preview.id}
          filename={preview.filename}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}
