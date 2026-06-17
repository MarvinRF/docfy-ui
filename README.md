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

**Bug found and fixed during integration testing**: `extractValidationRules()` in `copy-for-ai.ts` recursed into nested object schemas with no depth cap, unlike `flattenSchema()`/`schemaToTreeNodes()` which both already had one. A genuinely recursive DTO (the same case `capDepth()` exists to handle) crashed "Copy for AI" with a stack overflow. Originally fixed with a numeric depth cap; later replaced (see Phase 4.5 below) with identity-based ancestor tracking, the same pattern the other two functions already used correctly — a numeric cap just unrolls a cycle N times instead of recognizing the repeat.

**Test-writing gotcha worth remembering**: `userEvent.setup()` installs its own clipboard stub on `navigator.clipboard`. Mocking `navigator.clipboard` *before* calling `userEvent.setup()` gets silently clobbered — it must be mocked *after*.

## Phase 4.5 — Visual polish, circular-schema fix, mobile responsiveness

- **Visual depth pass**: shadows, a darker dark-mode palette, fixed-height scrollable panels (`RequestPanel`/`ResponseViewer`, `themed-scroll`), and Tailwind-driven enter animations (`animate-fade-in`, `animate-collapse-in`) for tab/panel transitions.
- **Circular-schema fix**: all three schema-walking functions (`flattenSchema` in `example.ts`, `schemaToTreeNodes` in `schema-tree.ts`, `extractValidationRules` in `copy-for-ai.ts`) now track an `ancestors: Set<JSONSchemaLike>` by object identity (add before recursing into a branch, delete after) instead of a numeric depth cap. A numeric cap unrolls a recursive DTO N times before giving up, producing duplicated lines/nodes and mislabeled leaves; identity tracking recognizes the exact repeat and renders a single `(circular reference)` marker. `SchemaTree.tsx` renders a `↩ circular` label for these nodes.
- **Mobile responsiveness**: found via an actual Playwright + real-Chrome screenshot audit at 375/390/768px, not by guesswork — (1) the off-canvas sidebar drawer didn't close after tapping an endpoint link (fixed with a `Sidebar` `onNavigate` callback wired from `Shell`); (2) horizontal page overflow below ~620px caused by CSS Grid/Flex items' default `min-width: auto` letting a long unbroken curl snippet string force its track wider than the viewport (fixed with `min-w-0` down the `EndpointDetail` → `RequestPanel`/`ResponseViewer` chain).

## Phase 5 — Polish and acceptance audit

End-to-end audit of the spec's section 5 acceptance checklist against real OpenAPI 3.0 **and** 3.1 documents (`public/sample-spec.json` and `public/sample-spec-31.json`, the latter added specifically for this audit to exercise `oneOf`/`anyOf`, a no-`requestBody` endpoint, an endpoint with no declared error responses, an unconstrained schema, and a long multi-sentence description), driven by Playwright + real Chrome. All 7 acceptance criteria verified, both specs, no regressions:

1. Sidebar shows all tags with their routes, grouped and in spec-declared order.
2. Search filters in real time, no Enter key needed.
3. Dark/light toggle applies tokens with no page reload.
4. "Copy OpenAPI" copies valid JSON for the selected endpoint.
5. "Copy for AI" copies text matching the section 3.3 structure, with every section 3.4 edge case applied correctly: no `requestBody` → no Request section; no declared 4xx/5xx → no Error Responses section; `oneOf`/`anyOf` → `(one of N possible shapes)` annotation; schema with no constraints → no Validation section; long description with no `summary` → truncated to 2 sentences for Purpose.
6. "Copy for AI" generation is consistently well under 100ms (measured ~30–45ms), no spinner ever renders.
7. UI functions identically for 3.0 and 3.1 specs.

## Setup — serving the spec

The UI fetches an OpenAPI document client-side and has no other dependency on a backend. Two ways to point it at one:

1. **Default convention** — same-origin `GET /api-json`, matching what `@nestjs/swagger`'s `SwaggerModule.setup()` exposes alongside the HTML Swagger UI by default.
2. **Explicit override** — `?spec=<url>` query param, e.g. `https://docs.example.com/?spec=https://api.example.com/api-json`. Takes precedence over the default when present.

### Serving docfy-ui from the same NestJS app as the API

Build the UI (`npm run build`, output in `dist/`) and serve it as static assets from the same Nest app that exposes `/api-json`, so both are same-origin and CORS never enters the picture:

```ts
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'docfy-ui-dist'),
      serveRoot: '/docs',
    }),
  ],
})
export class AppModule {}
```

With `SwaggerModule.setup('api', app, document)` (JSON at `/api-json` by default) and the UI mounted at `/docs`, visiting `/docs` resolves the spec automatically — no `?spec=` needed, since both are served by the same origin.

If the UI is deployed on a different origin than the API, use the `?spec=` override and make sure the API's CORS config allows that origin to `GET` the JSON document.

## Scripts

```bash
npm run dev        # start the Vite dev server
npm run build       # typecheck + production build
npm run preview     # preview the production build
npm test            # run the test suite (vitest)
npm run typecheck
```
