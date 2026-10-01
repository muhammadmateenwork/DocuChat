"use client";

import { useEffect, useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { DocumentsSidebar, DocumentsChipRow, type BrowsableDoc } from "@/components/DocumentsSidePanel";

export default function DashboardChatPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<BrowsableDoc[]>([]);

  useEffect(() => {
    fetch("/api/orgs/me")
      .then((res) => res.json())
      .then((data) => setOrgId(data.orgId));

    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) =>
        setDocuments(
          (data.documents ?? []).filter((d: { status: string }) => d.status === "ready")
        )
      );
  }, []);

  if (!orgId) {
    return (
      <div className="space-y-3 p-6">
        <div className="bg-muted h-4 w-40 animate-pulse rounded" />
        <div className="bg-muted h-4 w-64 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <DocumentsChipRow documents={documents} />
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <ChatPanel mode="org" orgId={orgId} documents={documents} />
        </div>
        <DocumentsSidebar documents={documents} title="Your documents" />
      </div>
    </div>
  );
}
