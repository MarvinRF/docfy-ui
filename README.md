# docfy-ui

AI-first OpenAPI documentation UI — companion project to [nestjs-docfy](https://github.com/MarvinRF/nest-docfy).

A lean, modern API reference UI with a "Copy for AI" button on every endpoint: a one-click, pre-formatted text representation optimized for pasting into an LLM prompt — instead of dumping raw OpenAPI JSON or full HTML.

Status: early development. See `docs/implementation-plan.md` (TODO) for the phased build plan.

## Phase 1 — Document Model

Parses and normalizes an OpenAPI 3.0/3.1 spec into an in-memory model (`tagGroups → endpoints`) consumed by the UI. No React yet — this layer is pure TypeScript, tested in isolation.

- `src/document-model/normalize.ts` — `normalizeDocument(spec)`, dereferences `$ref`s via `@apidevtools/swagger-parser` and groups endpoints by tag, preserving declared order.
- `src/document-model/cap-depth.ts` — `capDepth(value)`, makes a dereferenced (and possibly cyclic, for recursive DTOs) schema safe to `JSON.stringify`.
- `src/__tests__/parser-spike.spec.ts` — records the decision to use `@apidevtools/swagger-parser` over `@readme/openapi-parser` (smaller bundle, `browser` field, equivalent 3.1 support) as a regression-protecting test.

## Scripts

```bash
npm test         # run the test suite (vitest)
npm run typecheck
```
