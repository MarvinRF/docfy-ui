<h1 align="center">
  docfy-ui
</h1>

[![NPM version](https://img.shields.io/npm/v/docfy-ui.svg)](https://www.npmjs.com/package/docfy-ui)
[![NPM downloads](https://img.shields.io/npm/dw/docfy-ui.svg)](https://www.npmjs.com/package/docfy-ui)
[![GitHub last commit](https://img.shields.io/github/last-commit/MarvinRF/docfy-ui)](https://github.com/MarvinRF/docfy-ui/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/MarvinRF/docfy-ui.svg)](https://github.com/MarvinRF/docfy-ui/issues)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/MarvinRF/docfy-ui/blob/main/LICENSE)

AI-first OpenAPI documentation UI — companion project to [nestjs-docfy](https://www.npmjs.com/package/nestjs-docfy). A lean, modern API reference UI with a **"Copy for AI"** button on every endpoint: a one-click, pre-formatted text representation optimized for pasting into an LLM prompt — instead of dumping raw OpenAPI JSON or full HTML.

## Table of contents

- [Motivation](#motivation)
- [Features](#features)
- [Installation](#installation)
- [Quick start](#quick-start)
  - [Serving from the same NestJS app as the API](#serving-from-the-same-nestjs-app-as-the-api)
  - [Pointing at a remote spec](#pointing-at-a-remote-spec)
- [Configuration](#configuration)
- [Copy for AI](#copy-for-ai)
- [Document Model](#document-model)
- [Theming](#theming)
- [Architecture notes](#architecture-notes)
- [Scripts](#scripts)
- [Testing](#testing)
- [License](#license)

## Motivation

Most OpenAPI UIs are built for humans skimming a page — they're the wrong shape for the other audience that reads documentation today: an LLM you're pasting context into. Copying an endpoint's details usually means grabbing raw JSON (verbose, full of `$ref`s and noise) or copy-pasting rendered HTML (loses structure entirely).

**Before** — feeding an LLM a copy of the raw OpenAPI fragment:

```json
{
  "post": {
    "operationId": "createUser",
    "requestBody": { "content": { "application/json": { "schema": { "$ref": "#/components/schemas/CreateUserDto" } } } },
    "responses": { "201": { "$ref": "#/components/responses/UserCreated" }, "400": { "description": "Bad Request" } }
  }
}
```

**After** — one click of "Copy for AI" on the same endpoint:

```text
## Create a user
POST /users

### Request
{
  "name": "string",
  "email": "string"
}

### Responses
201 Created — UserEntity
400 Bad Request

### Validation
- name: required, minLength 2
- email: required, format email
```

`docfy-ui` renders that text deterministically from the same OpenAPI document any Swagger UI already serves — no extra annotations, no backend changes.

## Features

- **Copy for AI** — every endpoint gets a one-click, LLM-ready plain-text summary (purpose, request, responses, validation rules) instead of raw JSON.
- **Copy OpenAPI** — copies the dereferenced, cycle-safe JSON fragment for just the selected endpoint.
- **Two-column endpoint view** — documentation on the left (parameters, responses, navigable schema tree), code snippets (curl, JavaScript, Python, Go) on the right.
- **Real-time search** — filters the sidebar by path/summary/operationId on every keystroke, no debounce, no Enter key.
- **Dark/light theme** — token-driven, switches instantly with no page reload and no flash on first paint.
- **Zero backend coupling** — fetches a plain OpenAPI 3.0/3.1 JSON document client-side; works with any server that exposes one, not just NestJS.
- **Mobile-responsive** — off-canvas sidebar drawer below the `lg` breakpoint, audited at 375/390/768px.

## Installation

```bash
npm install docfy-ui
```

This package ships a pre-built static bundle (`dist/`) — there is no server-side code to install on a Node backend. If you're using [`nestjs-docfy`](https://www.npmjs.com/package/nestjs-docfy), its `DocfyUiModule.setup()` already wraps this for you (see below); otherwise, serve the `dist/` folder with any static file server.

## Quick start

### Serving from the same NestJS app as the API

The simplest setup if your backend is NestJS: let `nestjs-docfy` mount this package for you.

```ts
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { DocfyUiModule } from "nestjs-docfy";

const app = await NestFactory.create(AppModule);

DocfyUiModule.setup("/docs", app); // before SwaggerModule.setup

const document = SwaggerModule.createDocument(app, new DocumentBuilder().build());
SwaggerModule.setup("api", app, document); // exposes /api-json, which docfy-ui fetches by default

await app.listen(3000);
```

Visit `/docs` — no further configuration needed, since `docfy-ui` fetches `/api-json` same-origin by default.

### Pointing at a remote spec

Without `nestjs-docfy`, build and serve the static assets yourself and point them at any OpenAPI document — same-origin convention or an explicit URL:

```bash
npm run build   # in this package, or use the prebuilt dist/ from npm
```

Serve `dist/` with any static host (NestJS's `ServeStaticModule`, Nginx, S3 + CloudFront, etc.) alongside or in front of the API that exposes the spec.

## Configuration

The UI has no build-time configuration — it resolves the spec to render entirely at runtime, via one rule with one override:

| Source | When | Example |
| --- | --- | --- |
| `GET /api-json` (same-origin) | Default — matches what `@nestjs/swagger`'s `SwaggerModule.setup()` exposes alongside Swagger UI | `https://api.example.com/docs` → fetches `https://api.example.com/api-json` |
| `?spec=<url>` query param | Takes precedence over the default when present | `https://docs.example.com/?spec=https://api.example.com/api-json` |

If the UI is deployed on a different origin than the API, use the `?spec=` override and make sure the API's CORS configuration allows that origin to `GET` the JSON document.

## Copy for AI

`operationToAiText(endpoint)` (`src/transformers/copy-for-ai.ts`) is a pure function — no I/O, no React — that turns a normalized endpoint into the plain-text block behind the "Copy for AI" button, structured as: Purpose → Request → Responses → Error Responses → Validation. Edge cases are handled explicitly rather than guessed at:

- No `requestBody` → no Request section.
- No declared `4xx`/`5xx` → no Error Responses section.
- `oneOf`/`anyOf` schemas → annotated as `(one of N possible shapes)` instead of picking one arbitrarily.
- A schema with no constraints → no Validation section.
- A long description with no `summary` → truncated to two sentences for Purpose.

Generation is consistently well under 100ms (no spinner is ever shown) and recursive/circular DTOs are handled safely — see [Document Model](#document-model).

## Document Model

Before anything reaches a component, the raw OpenAPI document is normalized into an in-memory model (`tagGroups → endpoints`), implemented as pure, independently tested TypeScript with no React dependency:

- `src/document-model/normalize.ts` — dereferences every `$ref` via `@apidevtools/swagger-parser` and groups endpoints by tag, preserving declared order.
- `src/document-model/cap-depth.ts` — makes a dereferenced (and possibly cyclic, for recursive DTOs) schema safe to `JSON.stringify` for the "Copy OpenAPI" button.
- `src/document-model/example.ts` / `schema-tree.ts` — build the type-token example payload and the navigable schema tree from the same schema, without fabricating fake data.
- `src/document-model/filter.ts` — the client-side search used by the sidebar.

All schema-walking functions (`flattenSchema`, `schemaToTreeNodes`, `extractValidationRules`) track visited nodes by object identity rather than a numeric depth cap, so a genuinely recursive DTO renders a single `(circular reference)` / `↩ circular` marker instead of unrolling N times or crashing.

## Theming

Dark/light theming is token-driven and reload-free:

- `src/styles/tokens.ts` — `getThemeTokens(theme)` / `deriveSurfaceTokens(bg, text)`: a small fixed set of base tokens (background, text, accent) plus derived surface/border tokens, obtained by mixing `bg` toward `text` — never introducing a new hue.
- `src/styles/apply-theme.ts` — writes the resulting CSS custom properties and `data-theme` onto `<html>`; switching themes only changes variable values, no re-render of the component tree is required.
- `src/state/theme-store.ts` — a Zustand store that persists the chosen theme to `localStorage` and applies it synchronously before first paint (no flash of the wrong theme).

## Architecture notes

- **Browser-only by design** — the document model and "Copy for AI"/"Copy OpenAPI" transformers run entirely client-side; the UI has no server component beyond the static bundle.
- **`@apidevtools/swagger-parser` over `@readme/openapi-parser`** — chosen for a smaller bundle, a working `browser` field, and equivalent OpenAPI 3.1 support (`src/__tests__/parser-spike.spec.ts` records this as a regression-protecting test). Its transitive dependency `@apidevtools/json-schema-ref-parser` calls `Buffer.isBuffer()` unconditionally, which throws in a real browser — worked around with a minimal `buffer` polyfill imported first in `src/main.tsx` (`src/polyfills.ts`).
- **Verified against real OpenAPI 3.0 and 3.1 documents** (`public/sample-spec.json`, `public/sample-spec-31.json`), exercising `oneOf`/`anyOf`, a no-`requestBody` endpoint, an endpoint with no declared error responses, an unconstrained schema, and a long multi-sentence description — driven by Playwright against real Chrome, at desktop and mobile (375/390/768px) widths.

## Scripts

```bash
npm run dev         # start the Vite dev server
npm run build        # typecheck + production build
npm run preview      # preview the production build
npm test             # run the test suite (vitest)
npm run typecheck
```

## Testing

```bash
npm test
```

The suite (Vitest + Testing Library) covers the document model, transformers, hooks, and every component, queried by role/text/label rather than implementation details, so visual changes don't require rewriting tests.

## License

[MIT](https://github.com/MarvinRF/docfy-ui/blob/main/LICENSE) © Marvin Rocha
