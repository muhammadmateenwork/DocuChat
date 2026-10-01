# DocuChat

Chat with your documents. Upload PDFs and Word files, ask questions in English, Arabic, or
Roman Urdu, and get answers with exact source citations — or "I don't know" instead of a
hallucination.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind)
- Supabase (Postgres + pgvector, Auth, Storage)
- OpenRouter for chat completions
- Google Gemini for embeddings (`gemini-embedding-001`, free tier)

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).

2. **Run the migrations** in `supabase/migrations/` against your project, in order — either
   via the Supabase SQL editor (paste each file) or the Supabase CLI:

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

3. **Copy env vars**:

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
     — from Supabase project Settings → API.
   - `OPENROUTER_API_KEY` — from [openrouter.ai/keys](https://openrouter.ai/keys).
   - `GEMINI_API_KEY` — from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
     (free tier).

4. **Install dependencies and run**:

   ```bash
   pnpm install
   pnpm dev
   ```

5. **Seed the public demo workspace** (pre-loaded sample docs in English/Arabic/Roman Urdu,
   served at `/demo` with no login):

   ```bash
   pnpm seed:demo
   ```

   Copy the printed `DEMO_ORG_ID` into `.env.local`, then restart the dev server.

## Notes

- All document/chat data access goes through server-only API routes using the Supabase
  service role key; RLS policies exist as defense-in-depth, not as the primary auth boundary.
- Document processing (parse → chunk → embed) runs synchronously in the upload request.
  Fine for typical documents; very large files or high upload volume would want a queue-based
  worker instead.
- Roman Urdu (Urdu written in Latin script) has no dedicated embedding support from any
  provider — retrieval quality there is best-effort, same as everywhere else in the industry.
