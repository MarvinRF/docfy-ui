# [0.8.0](https://github.com/MarvinRF/docfy-ui/compare/v0.7.0...v0.8.0) (2026-08-01)


### Features

* **guides:** embed live Try it out via docfy-try fenced blocks ([ce44d67](https://github.com/MarvinRF/docfy-ui/commit/ce44d67e4733d3f659ebf33243611633ceb75e8f))

# [0.7.0](https://github.com/MarvinRF/docfy-ui/compare/v0.6.0...v0.7.0) (2026-07-31)


### Features

* add narrative markdown guide pages, listed in the sidebar ([c2203d0](https://github.com/MarvinRF/docfy-ui/commit/c2203d01282d5dfa6af83c5ac8b3c187046e878a))

# [0.6.0](https://github.com/MarvinRF/docfy-ui/compare/v0.5.1...v0.6.0) (2026-07-31)


### Features

* add "Copy as curl" and a live schema-match badge to Try it out ([a1a6b39](https://github.com/MarvinRF/docfy-ui/commit/a1a6b3971b48db461ea6b441fa8ebc717c085e24))

## [0.5.1](https://github.com/MarvinRF/docfy-ui/compare/v0.5.0...v0.5.1) (2026-07-30)


### Bug Fixes

* **ci:** add lint/format steps, narrow matrix to [20.x, 22.x] ([73d0d8e](https://github.com/MarvinRF/docfy-ui/commit/73d0d8e092ed4e6447bdf94418ce947d7357f304))

# [0.5.0](https://github.com/MarvinRF/docfy-ui/compare/v0.4.0...v0.5.0) (2026-07-29)


### Documentation

* document "Try it out", proxy support, and current feature set (Copy MCP Reference, Compare specs, multi-spec switcher) in README; fix banner image never rendering on the npm package page (missing repository field) ([a9943db](https://github.com/MarvinRF/docfy-ui/commit/a9943dbb3b1bdde9bba9f374f36e558166ca50d6))

# [0.4.0](https://github.com/MarvinRF/docfy-ui/compare/v0.3.0...v0.4.0) (2026-07-29)


### Features

* add "Try it out" request execution with a same-origin auth-aware client ([a98789d](https://github.com/MarvinRF/docfy-ui/commit/a98789d1a1bba0947429510dee7373365b303e5a))

# [0.3.0](https://github.com/MarvinRF/docfy-ui/compare/v0.2.1...v0.3.0) (2026-07-29)


### Features

* add "Copy MCP Reference" button to endpoint detail ([9478083](https://github.com/MarvinRF/docfy-ui/commit/9478083ecc20d85f9c9cef0ceb590621324da20d))

## [0.2.1](https://github.com/MarvinRF/docfy-ui/compare/v0.2.0...v0.2.1) (2026-07-29)


### Bug Fixes

* depend on docfy-core from npm instead of a file: sibling path ([0a56207](https://github.com/MarvinRF/docfy-ui/commit/0a56207b776f59c07a9963a27b3c845ae3fa6d7c))
* move docfy-core to devDependencies ([bba4fd7](https://github.com/MarvinRF/docfy-ui/commit/bba4fd794073c5efc8c4f603bfa1d2aa2e7df74b))

# [0.2.0](https://github.com/MarvinRF/docfy-ui/compare/v0.1.0...v0.2.0) (2026-07-26)


### Features

* diff two OpenAPI specs and flag breaking changes ([018f797](https://github.com/MarvinRF/docfy-ui/commit/018f7973c29d50c7001ba392d85a14c5a2eb543b))
* multi-spec switcher, reading window.__DOCFY_SPECS__ ([74cf584](https://github.com/MarvinRF/docfy-ui/commit/74cf58456e9794be09b2228b1543f8be9f730d56))

# 0.1.0 (2026-07-25)


### Bug Fixes

* add missing prepublish script and update base path in Vite config ([97ccf7a](https://github.com/MarvinRF/docfy-ui/commit/97ccf7a1ad85c85def9bd37f2149faeabdaaa20a))
* atualizar versão para 0.0.3 no package.json ([b1df479](https://github.com/MarvinRF/docfy-ui/commit/b1df47918cf6e6cfa246ef3d581343c7fdfb9b8d))
* atualizar versão para 0.0.4 no package.json ([7ffe8c5](https://github.com/MarvinRF/docfy-ui/commit/7ffe8c55afcf06b7b8795406cf86647caa9bf9e3))
* collapse circular schemas to a short marker instead of unrolling the cycle ([ea79499](https://github.com/MarvinRF/docfy-ui/commit/ea79499cab33c207b4c39026f119e3206998a205))
* empty-string response description fell through to blank instead of fallback ([891f0c7](https://github.com/MarvinRF/docfy-ui/commit/891f0c75cfb9cc04b0305de7e718d105bea85a21))
* remove private flag from package.json ([91a631b](https://github.com/MarvinRF/docfy-ui/commit/91a631b20854170a3cc25d785f19b679cd304a0a))
* two real mobile bugs found via screenshot audit at 375/390/768px ([190975b](https://github.com/MarvinRF/docfy-ui/commit/190975b5b5a678f2378c9897ac9386bd8c775649))


### Features

* atualizar versão para 0.0.5 e adicionar suporte a prefixo de montagem no App ([a97724d](https://github.com/MarvinRF/docfy-ui/commit/a97724d3a081d418be9b3a730727a87b06c91347))
* enhance response handling and UI components ([0136115](https://github.com/MarvinRF/docfy-ui/commit/013611508d162380463574c8da89697e3e6e0444))
* Phase 1 — Document Model ([ec65c8d](https://github.com/MarvinRF/docfy-ui/commit/ec65c8d4e637ee753bf02b4440f5772f9ceba34a))
* Phase 2 — Copy for AI transformer ([502c721](https://github.com/MarvinRF/docfy-ui/commit/502c721b19cbbe45587011273b2208abbe512f1b)), closes [#1](https://github.com/MarvinRF/docfy-ui/issues/1)
* Phase 3 — UI shell ([549835b](https://github.com/MarvinRF/docfy-ui/commit/549835bea9034c0d3bcafb069fd7d914342123ec))
* Phase 4 - Scalar-inspired two-column endpoint detail ([8d8e5ee](https://github.com/MarvinRF/docfy-ui/commit/8d8e5ee4da07e62aef2fdf28225283f4a02e736c))
* portar UI do figma mantendo funcionalidades existentes ([9d39cc7](https://github.com/MarvinRF/docfy-ui/commit/9d39cc743853cc4942237773bba7c240ab29deaf))
* rebranding para "Nest Docfy" com logo e nova paleta de tema ([ab9cf62](https://github.com/MarvinRF/docfy-ui/commit/ab9cf62148954c781c28a710e8006f6ddbba1e3f))
