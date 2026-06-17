import { Buffer } from 'buffer';

/**
 * `@apidevtools/json-schema-ref-parser` (a transitive dependency of
 * @apidevtools/swagger-parser) calls `Buffer.isBuffer(value)`
 * unconditionally in its parsing pipeline — even for plain JS objects,
 * with no `typeof Buffer !== 'undefined'` guard. Its `browser` package.json
 * field only stubs out `fs`, not `Buffer`, so this throws
 * "Buffer is not defined" in any real browser.
 *
 * This is a real bug in that dependency, not something specific to this
 * app — confirmed `@readme/openapi-parser` (the alternative considered in
 * the Phase 1 spike) depends on the exact same package and version range,
 * so switching libraries would not avoid it.
 *
 * Must be imported before anything that transitively imports
 * @apidevtools/swagger-parser (see main.tsx — imported first, above
 * everything else).
 */
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}
