import { describe, it, expect, vi, afterEach } from 'vitest';
import { newUuid } from './uuid';

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
afterEach(() => vi.unstubAllGlobals());

describe('newUuid', () => {
  it('usa randomUUID quando existe', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' });
    expect(newUuid()).toBe('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee');
  });
  it('sem randomUUID (WebView antigo) devolve um v4 válido por getRandomValues', () => {
    vi.stubGlobal('crypto', { getRandomValues: (a: Uint8Array) => { a.fill(7); return a; } });
    expect(newUuid()).toMatch(V4);
  });
  it('sem crypto nenhum não lança e ainda devolve um v4 válido', () => {
    vi.stubGlobal('crypto', undefined);
    expect(newUuid()).toMatch(V4);
  });
  it('randomUUID que lança cai no fallback', () => {
    vi.stubGlobal('crypto', { randomUUID: () => { throw new Error('x'); } });
    expect(newUuid()).toMatch(V4);
  });
});
