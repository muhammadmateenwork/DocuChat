-- Private bucket for uploaded source documents. Files are only ever accessed
-- via short-lived signed URLs generated server-side with the service role key,
-- so no public storage policies are needed.

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;
