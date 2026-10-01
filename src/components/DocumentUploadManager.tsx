"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Trash2, UploadCloud, Loader2, AlertTriangle, Inbox, Eye } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DocumentViewerModal } from "@/components/DocumentViewerModal";
import { useToast } from "@/components/ui/ToastProvider";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { cn } from "@/lib/utils";

export type ManagedDoc = {
  id: string;
  filename: string;
  kind: "pdf" | "docx";
  status: "processing" | "ready" | "failed";
  error: string | null;
  page_count: number | null;
  created_at: string;
};

function kindFromFilename(filename: string): "pdf" | "docx" | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  return null;
}

export function DocumentUploadManager({
  beforeUpload,
  onDocsChange,
  emptyHint = "No documents yet. Upload your first one above.",
  dropHint = "PDF or DOCX — drop one or several at once",
}: {
  /** Called before the upload request, e.g. to lazily create a demo session. */
  beforeUpload?: () => Promise<void>;
  onDocsChange?: (docs: ManagedDoc[]) => void;
  emptyHint?: string;
  dropHint?: string;
}) {
  const [docs, setDocs] = useState<ManagedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<ManagedDoc | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const confirmDialog = useConfirm();

  async function loadDocs() {
    const res = await fetch("/api/documents");
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    const list = data.documents ?? [];
    setDocs(list);
    onDocsChange?.(list);
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/documents")
      .then((res) => (res.ok ? res.json() : { documents: [] }))
      .then((data) => {
        const list = data.documents ?? [];
        setDocs(list);
        onDocsChange?.(list);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadOne(file: File): Promise<boolean> {
    const kind = kindFromFilename(file.name);
    if (!kind) {
      setUploadError(`${file.name}: only PDF and DOCX files are supported.`);
      return false;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError(`${file.name}: file is too large (20MB max).`);
      return false;
    }

    try {
      await beforeUpload?.();

      const createRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, kind }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(created.error || "Failed to start upload");

      const supabase = createBrowserSupabaseClient();
      const { error: uploadErr } = await supabase.storage
        .from("documents")
        .uploadToSignedUrl(created.path, created.token, file);
      if (uploadErr) throw new Error(uploadErr.message);

      await loadDocs();

      const processRes = await fetch(`/api/documents/${created.documentId}/process`, {
        method: "POST",
      });
      const processed = await processRes.json();
      if (!processRes.ok) throw new Error(processed.error || "Processing failed");

      return true;
    } catch (err) {
      setUploadError(`${file.name}: ${err instanceof Error ? err.message : "Upload failed"}`);
      return false;
    }
  }

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setUploadError(null);
    setUploadProgress({ done: 0, total: files.length });

    let succeeded = 0;
    for (let i = 0; i < files.length; i++) {
      const ok = await uploadOne(files[i]);
      if (ok) succeeded++;
      setUploadProgress({ done: i + 1, total: files.length });
    }

    await loadDocs();
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (succeeded > 0) {
      toast.show(
        succeeded === 1 ? "Document uploaded" : `${succeeded} documents uploaded`,
        "success"
      );
    }
    if (succeeded < files.length && files.length > 0) {
      toast.show(`${files.length - succeeded} upload${files.length - succeeded > 1 ? "s" : ""} failed`, "error");
    }
  }

  async function handleDelete(doc: ManagedDoc) {
    const ok = await confirmDialog({
      title: `Delete "${doc.filename}"?`,
      description: "This removes the file and everything DocuChat indexed from it. This can't be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;

    await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
    await loadDocs();
    toast.show("Document deleted", "success");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }

  const uploading = uploadProgress !== null;

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          "mb-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragActive ? "border-accent bg-accent-soft" : "border-border bg-muted/30"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          multiple
          className="hidden"
          id="file-upload"
          disabled={uploading}
          onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
        />
        <span className="bg-accent-soft text-accent mb-3 flex h-12 w-12 items-center justify-center rounded-full">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <UploadCloud className="h-6 w-6" />
          )}
        </span>
        <label htmlFor="file-upload" className="cursor-pointer">
          <span className="text-accent font-medium hover:underline">
            {uploading
              ? `Uploading ${uploadProgress.done}/${uploadProgress.total}…`
              : "Click to upload"}
          </span>
          {!uploading && <span className="text-muted-foreground"> or drag and drop</span>}
        </label>
        <p className="mt-1 text-xs text-muted-foreground">{dropHint}</p>
        {uploadError && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" /> {uploadError}
          </p>
        )}
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[0, 1].map((i) => (
            <div key={i} className="bg-muted h-[68px] animate-pulse rounded-xl" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
          <Inbox className="h-8 w-8" />
          <p className="text-sm">{emptyHint}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {docs.map((doc) => (
            <Card key={doc.id} className="flex items-center gap-4 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{doc.filename}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {doc.status === "ready" &&
                    `${doc.page_count ?? "?"} ${doc.kind === "pdf" ? "pages" : "sections"} indexed`}
                  {doc.status === "processing" && "Processing…"}
                  {doc.status === "failed" && `Failed: ${doc.error}`}
                </p>
              </div>
              <Badge
                variant={
                  doc.status === "ready"
                    ? "success"
                    : doc.status === "failed"
                      ? "destructive"
                      : "warning"
                }
              >
                {doc.status === "processing" && <Loader2 className="h-3 w-3 animate-spin" />}
                {doc.status}
              </Badge>
              {doc.status === "ready" && (
                <button
                  onClick={() => setPreview(doc)}
                  title="Read document"
                  className="hover:bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => handleDelete(doc)}
                title="Delete document"
                className="hover:bg-destructive-soft hover:text-destructive flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {preview && (
        <DocumentViewerModal
          documentId={preview.id}
          filename={preview.filename}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
