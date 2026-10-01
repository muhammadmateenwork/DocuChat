-- Cosine similarity search over document_chunks, scoped to an org and
-- optionally to a subset of document ids. Only returns chunks belonging to
-- documents that finished processing.

create or replace function match_document_chunks(
  query_embedding vector(768),
  p_org_id uuid,
  p_document_ids uuid[] default null,
  match_count int default 6
)
returns table (
  chunk_id uuid,
  document_id uuid,
  filename text,
  locator_type locator_type,
  locator_value int,
  content text,
  similarity float
)
language sql stable
as $$
  select
    dc.id as chunk_id,
    dc.document_id,
    d.filename,
    dc.locator_type,
    dc.locator_value,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  join documents d on d.id = dc.document_id
  where dc.org_id = p_org_id
    and d.status = 'ready'
    and (p_document_ids is null or dc.document_id = any(p_document_ids))
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;
