import { describe, it, expect } from 'vitest';
import { onRequestPost } from './suggest-tasks.js';

describe('L07-02: suggest-tasks anônimo com goalText gigante', () => {
  it('80k caracteres respondem rápido', async () => {
    const req = new Request('https://x/api/suggest-tasks', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ goalText: 'a'.repeat(80000), language: 'pt-BR' }),
    });
    const t0 = performance.now();
    const res = await onRequestPost({ request: req, env: {} });
    const ms = performance.now() - t0;
    await res.text();
    expect(ms).toBeLessThan(500);
  });
});
