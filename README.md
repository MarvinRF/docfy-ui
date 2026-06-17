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
- `src/components/` — `Sidebar` (collapsible tag sections, method-color badges), `SearchInput`, `MethodBadge`, `Shell` (layout + theme toggle + routing).

**Real-browser bug found and fixed**: `@apidevtools/json-schema-ref-parser` (a transitive dependency of swagger-parser) calls `Buffer.isBuffer(value)` unconditionally — no `typeof Buffer !== 'undefined'` guard — which throws `Buffer is not defined` in any real browser (it only worked in our Node-based tests). Its `browser` package.json field only stubs `fs`, not `Buffer`. Confirmed `@readme/openapi-parser` (the alternative considered in the Phase 1 spike) depends on the exact same package/version, so switching libraries would not have avoided this. Fixed with a minimal polyfill (`src/polyfills.ts`, the `buffer` npm package) imported first in `main.tsx`. Verified by reproducing the exact failure in Node with `Buffer` deleted from `globalThis`, then confirming the polyfill resolves it — see the comment in `src/polyfills.ts`.

The `path`/`util` externalization warnings Vite/Rolldown still log during build are unrelated and benign — confirmed the production bundle contains no literal bare-specifier imports of those modules (the code paths that would need them are never reached for in-memory spec dereferencing).

## Phase 4 — Endpoint detail (Scalar-inspired 2-column layout)

Replaces the Phase 3 placeholder. Two columns: documentation on the left, a playground-style panel on the right. **Real request execution is explicitly out of scope for this iteration** — the "Test Request" button is rendered disabled. This was a deliberate scope decision (the original MVP spec excluded a live API test client; the user asked for the layout without changing that exclusion).

- `src/document-model/example.ts` — `buildSchemaExample(schema)`, extracted from `copy-for-ai.ts` so the same type-token example (no fake data) is shared between Copy for AI and the code snippets below. Also home to `STATUS_TEXT` and `pickPrimarySuccessResponse()`.
- `src/document-model/schema-tree.ts` — `schemaToTreeNodes(schema)`, a separate pure transform from `buildSchemaExample()`: walks schema *metadata* (name/type/required/nullable) for the navigable tree view, not example values.
- `src/transformers/code-snippets.ts` — `buildCodeSnippet(endpoint, baseUrl, lang)` for curl/JavaScript(fetch)/Axios/Python/PHP. Query params render as `name=type` placeholders, same no-fake-data principle as Copy for AI.
- `src/hooks/use-copy-to-clipboard.ts` — Clipboard API with an `execCommand('copy')` fallback for non-secure contexts, per spec section 3.5. `copied` flips back after ~1.5s.
- `src/components/SchemaTree.tsx` — expandable/collapsible tree (top level open by default, deeper nesting collapsed).
- `src/components/ParametersSection.tsx` / `ResponsesSection.tsx` — grouped by Path/Query/Headers and by status code, respectively.
- `src/components/RequestPanel.tsx` — method+path header, language-switchable snippet, copy button, disabled "Test Request".
- `src/components/ResponseViewer.tsx` — Response/Schema tabs for the primary success response. No "Headers" tab — OpenAPI response headers aren't extracted by the Document Model yet; that's a follow-up, not a silent omission.
- `src/components/EndpointDetail.tsx` — assembles the above; also where "Copy OpenAPI" (`JSON.stringify(capDepth(endpoint))`) and "Copy for AI" live.

**Bug found and fixed during integration testing**: `extractValidationRules()` in `copy-for-ai.ts` recursed into nested object schemas with no depth cap, unlike `flattenSchema()`/`schemaToTreeNodes()` which both already had one. A genuinely recursive DTO (the same case `capDepth()` exists to handle) crashed "Copy for AI" with a stack overflow. Added the same depth cap (10) used elsewhere; regression test in `copy-for-ai.spec.ts`.

**Test-writing gotcha worth remembering**: `userEvent.setup()` installs its own clipboard stub on `navigator.clipboard`. Mocking `navigator.clipboard` *before* calling `userEvent.setup()` gets silently clobbered — it must be mocked *after*.

## Scripts

```bash
npm run dev        # start the Vite dev server
npm run build       # typecheck + production build
npm run preview     # preview the production build
npm test            # run the test suite (vitest)
npm run typecheck
```
