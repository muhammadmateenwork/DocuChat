import { createAdminClient } from "@/lib/supabase/admin";

export type DocumentSection = {
  locatorType: "page" | "section";
  locatorValue: number;
  content: string;
};

export type DocumentContent = {
  orgId: string;
  filename: string;
  kind: "pdf" | "docx";
  sections: DocumentSection[];
};

/** Full extracted text of a document, chunk by chunk, for in-app reading (not just citations). */
export async function getDocumentContent(documentId: string): Promise<DocumentContent> {
  const admin = createAdminClient();

  const { data: doc, error: docError } = await admin
    .from("documents")
    .select("id, org_id, filename, kind")
    .eq("id", documentId)
    .single();
  if (docError || !doc) throw new Error("Document not found");

  const { data: chunks, error: chunksError } = await admin
    .from("document_chunks")
    .select("locator_type, locator_value, content, created_at")
    .eq("document_id", documentId)
    .order("locator_value", { ascending: true })
    .order("created_at", { ascending: true });
  if (chunksError) throw new Error(chunksError.message);

  return {
    orgId: doc.org_id as string,
    filename: doc.filename as string,
    kind: doc.kind as "pdf" | "docx",
    sections: (chunks ?? []).map((c) => ({
      locatorType: c.locator_type as "page" | "section",
      locatorValue: c.locator_value as number,
      content: c.content as string,
    })),
  };
}
