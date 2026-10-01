-- Core schema for DocuChat: multi-tenant orgs, documents, chunks with embeddings, chat log.

create extension if not exists vector;
create extension if not exists pgcrypto;

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id) on delete set null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create type org_role as enum ('owner', 'admin');

create table organization_members (
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role org_role not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create type document_kind as enum ('pdf', 'docx');
create type document_status as enum ('processing', 'ready', 'failed');

create table documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  kind document_kind not null,
  status document_status not null default 'processing',
  error text,
  page_count int,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create type locator_type as enum ('page', 'section');

create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  locator_type locator_type not null,
  locator_value int not null,
  content text not null,
  embedding vector(768),
  created_at timestamptz not null default now()
);

create index document_chunks_embedding_idx on document_chunks
  using hnsw (embedding vector_cosine_ops);
create index document_chunks_org_idx on document_chunks (org_id);
create index document_chunks_document_idx on document_chunks (document_id);

create type chat_role as enum ('user', 'assistant');

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  session_id uuid not null,
  role chat_role not null,
  content text not null,
  sources jsonb,
  answered boolean,
  created_at timestamptz not null default now()
);
create index chat_messages_org_created_idx on chat_messages (org_id, created_at desc);
create index chat_messages_session_idx on chat_messages (session_id);

create table demo_usage (
  ip_hash text not null,
  day date not null default current_date,
  count int not null default 0,
  primary key (ip_hash, day)
);
