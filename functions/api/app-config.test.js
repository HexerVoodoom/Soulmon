import { describe, it, expect } from 'vitest';
import { onRequestGet, onRequestOptions } from './app-config.js';

const ler = async env => (await onRequestGet({ env })).json();

describe('/api/app-config', () => {
  it('padrão: não força ninguém (min 0) e recomenda 31', async () => {
    expect(await ler({})).toEqual({ minVersionCode: 0, recommendedVersionCode: 31 });
  });
  it('vars do Worker vencem a constante', async () => {
    expect(await ler({ APP_MIN_VERSION_CODE: '32', APP_RECOMMENDED_VERSION_CODE: ' 35 ' })).toEqual({ minVersionCode: 32, recommendedVersionCode: 35 });
  });
  it('var inválida cai no padrão (nunca trava por typo)', async () => {
    expect(await ler({ APP_MIN_VERSION_CODE: 'abc', APP_RECOMMENDED_VERSION_CODE: '-3' })).toEqual({ minVersionCode: 0, recommendedVersionCode: 31 });
  });
  it('é pública, cacheável e responde OPTIONS', async () => {
    const r = await onRequestGet({ env: {} });
    expect(r.headers.get('Cache-Control')).toContain('max-age=300');
    expect((await onRequestOptions()).headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
