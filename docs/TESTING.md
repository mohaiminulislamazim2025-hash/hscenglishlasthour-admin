# Testing

Tests cover pure logic and run with Vitest (`npm test`). No network access is
required.

## Suites

| File | Covers |
| --- | --- |
| `tests/product-validation.test.ts` | product create/update schema |
| `tests/upload-validation.test.ts` | image-only upload schema + metadata limits |
| `tests/storage-paths.test.ts` | `products/{id}/image.{ext}` conventions |
| `tests/order-query.test.ts` | order list query parsing |
| `tests/order-status.test.ts` | forward-only status machine + revenue rule |
| `tests/customers.test.ts` | customer aggregation by mobile |
| `tests/format.test.ts` | money/date/id formatting |
| `tests/theme.test.ts` | theme resolution + persistence |

## Commands

```bash
npm test             # vitest run
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run build        # production build
```

Run all four before considering work done.

## What is not covered by unit tests

- Live database reads/writes and Storage uploads (require the server secret key
  and a production write). These must be verified manually with owner approval.
