-- Lets an anonymous /demo visitor upload their own documents into a private,
-- ephemeral organization tied to a browser cookie (see src/lib/authz.ts),
-- separate from the shared curated demo workspace. Possession of the
-- matching session cookie is the only "auth" for these orgs.
alter table organizations add column session_token text unique;

-- Basic abuse guard shared by all uploaders (real users and anonymous demo
-- sessions alike): cap individual file size at the storage layer.
update storage.buckets set file_size_limit = 20971520 where id = 'documents';
