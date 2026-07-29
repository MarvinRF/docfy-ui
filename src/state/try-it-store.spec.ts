import { describe, it, expect, beforeEach } from 'vitest';
import { useTryItStore, endpointKeyFor } from './try-it-store';

const key = endpointKeyFor({ method: 'GET', path: '/items/{id}' });

function reset() {
  useTryItStore.setState({ authValues: {}, requests: {} });
}

describe('useTryItStore', () => {
  beforeEach(reset);

  it('endpointKeyFor() joins method and path', () => {
    expect(key).toBe('GET /items/{id}');
  });

  it('setAuthValue() is global, not scoped to an endpoint', () => {
    useTryItStore.getState().setAuthValue('bearerAuth', 'token123');
    expect(useTryItStore.getState().authValues.bearerAuth).toBe('token123');
  });

  it('setParamValue() creates request state on first write and preserves other params', () => {
    useTryItStore.getState().setParamValue(key, 'id', '42');
    useTryItStore.getState().setParamValue(key, 'verbose', 'true');
    expect(useTryItStore.getState().requests[key].paramValues).toEqual({ id: '42', verbose: 'true' });
  });

  it('setBodyText/setBaseUrlOverride/setLoading/setResult update only their own field', () => {
    const { setBodyText, setBaseUrlOverride, setLoading, setResult } = useTryItStore.getState();
    setBodyText(key, '{"a":1}');
    setBaseUrlOverride(key, 'http://example.com');
    setLoading(key, true);
    setResult(key, { kind: 'network-error', message: 'boom' });

    const state = useTryItStore.getState().requests[key];
    expect(state.bodyText).toBe('{"a":1}');
    expect(state.baseUrlOverride).toBe('http://example.com');
    expect(state.loading).toBe(true);
    expect(state.result).toEqual({ kind: 'network-error', message: 'boom' });
  });

  it('requests for an untouched endpoint are undefined, not a shared default object', () => {
    expect(useTryItStore.getState().requests['POST /other']).toBeUndefined();
  });
});
