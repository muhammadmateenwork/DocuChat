-- RLS as defense-in-depth. The app talks to Supabase via the service role key
-- from server-only API routes, which bypasses RLS entirely and does its own
-- authorization checks (see src/lib/authz.ts). These policies only matter if
-- a table is ever queried directly with the anon/authenticated key, and even
-- then only grant read access to a user's own org data (plus public read of
-- demo org rows). No insert/update/delete policies are defined for
-- anon/authenticated: all writes go through the service role.

alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table chat_messages enable row level security;
alter table demo_usage enable row level security;

create policy "members can read their orgs"
  on organizations for select
  using (
    is_demo = true
    or id in (select org_id from organization_members where user_id = auth.uid())
  );

create policy "members can read their own membership rows"
  on organization_members for select
  using (user_id = auth.uid());

create policy "members can read their org documents"
  on documents for select
  using (
    org_id in (select id from organizations where is_demo = true)
    or org_id in (select org_id from organization_members where user_id = auth.uid())
  );

create policy "members can read their org chunks"
  on document_chunks for select
  using (
    org_id in (select id from organizations where is_demo = true)
    or org_id in (select org_id from organization_members where user_id = auth.uid())
  );

create policy "members can read their org chat messages"
  on chat_messages for select
  using (
    org_id in (select org_id from organization_members where user_id = auth.uid())
  );
