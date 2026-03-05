# Refactor Baseline and Standards

## Baseline audit

- Run `npm run db:audit` before and after schema changes.
- Keep audit JSON snapshots for rollback comparison.
- Validate these endpoints after each phase:
  - `/api/file-manager/files`
  - `/api/file-manager/folders`
  - `/api/files`
  - `/api/skills`

## Reset bootstrap

- This project now supports reset-first rollout because current DB has no production data.
- Use:
  - `npm run db:reset`
  - `npm run db:import`
  - `npm run db:sync`

## Engineering guardrails

- No N+1 query loops in API/domain code.
- Pagination is required on list endpoints.
- Select only required columns (no `select('*')` for list endpoints).
- Avoid wrapping entire handlers in generic `try/catch` unless adding useful context.
- Prefer guard clauses over deeply nested `if/else`.
- Keep domain logic in shared service modules, not duplicated in routes.

## Security guardrails

- Supabase config in this project uses only:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Verify digital signature before returning sensitive file content.
- Keep key rotation compatible using `signature_key_id`.
- Record audit log for read/write/signature verification failures.
