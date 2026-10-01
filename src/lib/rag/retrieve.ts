import { createAdminClient } from "@/lib/supabase/admin";
import { embedQuery } from "./embeddings";
import type { RetrievedSource } from "./types";

// Cosine similarity below this means "nothing relevant was found" — we skip
// the LLM call entirely and return the fixed "I don't know" response.
const SIMILARITY_THRESHOLD = 0.55;
const MATCH_COUNT = 6;

type MatchRow = {
  chunk_id: string;
  document_id: string;
  filename: string;
  locator_type: "page" | "section";
  locator_value: number;
  content: string;
  similarity: number;
};

export async function retrieveSources(
  orgId: string,
  question: string,
  documentIds?: string[]
): Promise<RetrievedSource[]> {
  const admin = createAdminClient();
  const queryEmbedding = await embedQuery(question);

  const { data, error } = await admin.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    p_org_id: orgId,
    p_document_ids: documentIds && documentIds.length > 0 ? documentIds : null,
    match_count: MATCH_COUNT,
  });

  if (error) throw new Error(error.message);

  return ((data ?? []) as MatchRow[]).map((row) => ({
    chunkId: row.chunk_id,
    documentId: row.document_id,
    filename: row.filename,
    locatorType: row.locator_type,
    locatorValue: row.locator_value,
    content: row.content,
    similarity: row.similarity,
  }));
}

export function hasRelevantContext(sources: RetrievedSource[]): boolean {
  return sources.length > 0 && sources[0].similarity >= SIMILARITY_THRESHOLD;
}
