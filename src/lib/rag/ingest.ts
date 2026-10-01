import { createAdminClient } from "@/lib/supabase/admin";
import { parsePdf, parseDocx } from "./parse";
import { chunkUnits } from "./chunk";
import { embedTexts } from "./embeddings";

const INSERT_BATCH = 200;

/** Downloads, parses, chunks, embeds, and stores a previously-uploaded document. */
export async function ingestDocument(documentId: string) {
  const admin = createAdminClient();

  const { data: doc, error } = await admin
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .single();
  if (error || !doc) throw new Error("Document not found");

  try {
    const { data: fileData, error: downloadError } = await admin.storage
      .from("documents")
      .download(doc.storage_path);
    if (downloadError || !fileData) {
      throw new Error(downloadError?.message || "Failed to download file from storage");
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    const units = doc.kind === "pdf" ? await parsePdf(buffer) : await parseDocx(buffer);
    const locatorType = doc.kind === "pdf" ? "page" : "section";
    const chunks = chunkUnits(units, locatorType);

    if (chunks.length === 0) {
      throw new Error("No extractable text found in this document");
    }

    const embeddings = await embedTexts(
      chunks.map((c) => c.content),
      "RETRIEVAL_DOCUMENT"
    );

    const rows = chunks.map((chunk, i) => ({
      document_id: documentId,
      org_id: doc.org_id,
      locator_type: chunk.locatorType,
      locator_value: chunk.locatorValue,
      content: chunk.content,
      embedding: embeddings[i],
    }));

    for (let i = 0; i < rows.length; i += INSERT_BATCH) {
      const { error: insertError } = await admin
        .from("document_chunks")
        .insert(rows.slice(i, i + INSERT_BATCH));
      if (insertError) throw new Error(insertError.message);
    }

    await admin
      .from("documents")
      .update({ status: "ready", page_count: units.length, error: null })
      .eq("id", documentId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown processing error";
    await admin.from("documents").update({ status: "failed", error: message }).eq("id", documentId);
    throw err;
  }
}
