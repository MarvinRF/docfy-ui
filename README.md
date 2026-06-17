# docfy-ui

AI-first OpenAPI documentation UI — companion project to [nestjs-docfy](https://github.com/MarvinRF/nest-docfy).

A lean, modern API reference UI with a "Copy for AI" button on every endpoint: a one-click, pre-formatted text representation optimized for pasting into an LLM prompt — instead of dumping raw OpenAPI JSON or full HTML.

Status: early development. See `docs/implementation-plan.md` (TODO) for the phased build plan.

## Phase 1 — Document Model

Parses and normalizes an OpenAPI 3.0/3.1 spec into an in-memory model (`tagGroups → endpoints`) consumed by the UI. No React yet — this layer is pure TypeScript, tested in isolation.

- `src/document-model/normalize.ts` — `normalizeDocument(spec)`, dereferences `$ref`s via `@apidevtools/swagger-parser` and groups endpoints by tag, preserving declared order.
- `src/document-model/cap-depth.ts` — `capDepth(value)`, makes a dereferenced (and possibly cyclic, for recursive DTOs) schema safe to `JSON.stringify`.
- `src/__tests__/parser-spike.spec.ts` — records the decision to use `@apidevtools/swagger-parser` over `@readme/openapi-parser` (smaller bundle, `browser` field, equivalent 3.1 support) as a regression-protecting test.

## Phase 2 — "Copy for AI" transformer

Pure function `operationToAiText(endpoint)` — turns a normalized `Endpoint` into the plain-text representation behind the "Copy for AI" button. No I/O, no React dependency; runs in well under 5ms.

- `src/transformers/copy-for-ai.ts`
- Reproduces the worked example from the spec exactly, with two documented deviations from ambiguities in the source spec:
  1. **Type over format in examples** — the spec's own algorithm says "chave: tipo" (key: type), but its worked example shows `"id": "uuid"` (using `format`) for one field and `"email": "string"` (using `type`, ignoring its `format: email`) for another — an internal inconsistency. We always use `type`, consistently; format-specific detail (uuid, email, etc.) surfaces in the Validation section instead.
  2. **`required` does not produce its own Validation line** — the worked example shows zero "X is required" lines for a register endpoint where required fields are near-certain, so presence is conveyed by the field appearing in the Request example, not a separate line.
- Section join uses a single newline between sections (matching the literal worked example), not the blank line the spec's prose mentions — the two contradict each other; we matched the testable example.

## Phase 3 — UI shell

React 19 + Vite 8 + Tailwind 4 + React Router 7 + Zustand. No endpoint detail rendering or Copy buttons yet — that's Phase 4.

- `src/styles/tokens.ts` — `getThemeTokens(theme)` / `deriveSurfaceTokens(bg, text)`, pure functions implementing spec section 4.1 (the 3 base tokens, plus derived `bgElevated`/`border` by mixing `bg` toward `text`, never introducing a new hue).
- `src/styles/apply-theme.ts` — sets the CSS custom properties + `data-theme` on `<html>`; no reload needed to switch themes.
- `src/state/theme-store.ts` — Zustand store, persists the chosen theme to `localStorage`.
- `src/document-model/filter.ts` — `filterTagGroups(groups, query)`, the client-side search (substring match on path/summary/operationId, no debounce).
- `src/hooks/use-openapi-spec.ts` — fetches the spec from a URL (default `/api-json`, override via `?spec=<url>`) and runs it through `normalizeDocument`.
- `src/components/` — `Sidebar` (collapsible tag sections, method-color badges), `SearchInput`, `MethodBadge`, `Shell` (layout + theme toggle + routing), `EndpointPlaceholder` (Phase 3 stand-in for the real detail panel).

**Known gap to verify in Phase 5**: `npm run build` succeeds, but Vite/Rolldown logs warnings about `path`/`util` being externalized from `@apidevtools/swagger-parser`'s dependency chain. The package declares a `browser` field specifically to avoid this, so it's worth a real browser smoke test against a running NestJS app's `/api-json` before considering this fully resolved.

## Scripts

```bash
npm run dev        # start the Vite dev server
npm run build       # typecheck + production build
npm run preview     # preview the production build
npm test            # run the test suite (vitest)
npm run typecheck
```
