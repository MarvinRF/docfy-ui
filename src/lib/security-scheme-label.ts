import type { SecuritySchemeInfo } from '../document-model/types';

export function schemeLabel(name: string, scheme: SecuritySchemeInfo): string {
  if (scheme.type === 'apiKey') return `${name} (API key, ${scheme.in ?? 'header'}: ${scheme.name ?? name})`;
  if (scheme.type === 'http' && scheme.scheme === 'basic') return `${name} (Basic auth, user:pass)`;
  if (scheme.type === 'http') return `${name} (Bearer token)`;
  return `${name} (paste an already-issued access token)`;
}
