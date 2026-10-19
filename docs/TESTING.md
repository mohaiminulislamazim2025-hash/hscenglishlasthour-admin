# Testing

## Commands

```bash
npm test         # run all tests once (vitest)
npm run test:watch
npm run typecheck
npm run lint
npm run build
```

Run all of the above before considering work done.

## What is tested

Tests cover **pure logic** with no network access. Files live in `tests/` and
match `**/*.test.{ts,tsx}`.

| File | Covers |
| --- | --- |
| `tests/storage-paths.test.ts` | Path conventions and extension parsing. |
| `tests/upload-validation.test.ts` | Upload policy + signing schema. |
| `tests/order-status.test.ts` | Status recognition and transition rules. |
| `tests/book-validation.test.ts` | Book create/update schemas and coercion (incl. omitted checkboxes). |
| `tests/order-query.test.ts` | Order list query parsing/defaults. |
| `tests/format.test.ts` | Money, bytes, dates, id formatting. |
| `tests/customers.test.ts` | Customer aggregation (repository mocked). |
| `tests/theme.test.ts` | Theme preference parsing + resolution. |

## Test setup

- `vitest.config.ts` uses the jsdom environment and aliases:
  - `@` → project root.
  - `server-only` → `tests/server-only-stub.ts` so server modules can be
    imported in tests.
- `vitest.setup.ts` loads `@testing-library/jest-dom`.

## Not covered (by design)

- Live Supabase calls (no network in tests). Data logic that talks to Supabase
  is exercised manually against the real project.
- End-to-end browser flows.

When adding functionality, prefer extracting pure functions (validation,
formatting, aggregation, transitions) so they can be unit-tested without
Supabase.
