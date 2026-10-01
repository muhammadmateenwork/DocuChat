"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ChatPanel } from "@/components/ChatPanel";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { DocumentsSidebar, DocumentsChipRow, type BrowsableDoc } from "@/components/DocumentsSidePanel";
import { DocumentUploadManager, type ManagedDoc } from "@/components/DocumentUploadManager";
import { cn } from "@/lib/utils";

type Tab = "sample" | "yours";

export default function DemoPage() {
  const [tab, setTab] = useState<Tab>("sample");
  const [sampleDocs, setSampleDocs] = useState<BrowsableDoc[]>([]);
  const [sessionOrgId, setSessionOrgId] = useState<string | null>(null);
  const [yourDocs, setYourDocs] = useState<ManagedDoc[]>([]);

  useEffect(() => {
    fetch("/api/demo/documents")
      .then((res) => res.json())
      .then((data) => setSampleDocs(data.documents ?? []));
  }, []);

  async function ensureSession() {
    if (sessionOrgId) return;
    const res = await fetch("/api/demo/session", { method: "POST" });
    const data = await res.json();
    if (data.orgId) setSessionOrgId(data.orgId);
  }

  const readyYourDocs = yourDocs.filter((d) => d.status === "ready");

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>
        <Button href="/signup" variant="accent" size="sm" className="shrink-0 whitespace-nowrap">
          <span className="hidden sm:inline">Sign up for your own workspace</span>
          <span className="sm:hidden">Sign up</span>
        </Button>
      </header>
      <div className="bg-accent-soft text-accent flex shrink-0 items-center justify-center gap-1.5 border-b border-border px-4 py-2 text-center text-xs font-medium">
        <Sparkles className="h-3.5 w-3.5" />
        Live demo · 15 questions/day
      </div>

      <div className="flex shrink-0 border-b border-border px-4 sm:px-6">
        <button
          onClick={() => setTab("sample")}
          className={cn(
            "border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
            tab === "sample" ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Sample documents
        </button>
        <button
          onClick={() => {
            setTab("yours");
            ensureSession();
          }}
          className={cn(
            "border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
            tab === "yours" ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Your documents
        </button>
      </div>

      {tab === "sample" ? (
        <>
          <DocumentsChipRow documents={sampleDocs} />
          <div className="flex min-h-0 flex-1">
            <div className="mx-auto min-h-0 w-full max-w-3xl flex-1">
              <ChatPanel mode="demo" key="sample" />
            </div>
            <DocumentsSidebar documents={sampleDocs} title="Sample documents" />
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col md:flex-row-reverse">
          <div className="max-h-64 shrink-0 overflow-y-auto border-b border-border p-4 md:h-full md:max-h-none md:w-80 md:border-b-0 md:border-l">
            <DocumentUploadManager
              beforeUpload={ensureSession}
              onDocsChange={setYourDocs}
              emptyHint="Upload a PDF or Word doc to try DocuChat on your own content."
            />
          </div>
          <div className="min-h-0 flex-1">
            {sessionOrgId && readyYourDocs.length > 0 ? (
              <ChatPanel mode="org" orgId={sessionOrgId} documents={readyYourDocs} key={sessionOrgId} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
                <p className="text-sm">Upload a document to start chatting with it.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
