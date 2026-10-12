import { describe, it, expect } from 'vitest';
import { isEmbedPath, isEmbedMode } from './embedMode';

describe('embedMode', () => {
  it('só /embed e /embed/ são embed', () => {
    expect(isEmbedPath('/embed')).toBe(true);
    for (const p of ['/embed/', '/', '/embedded', '/embed/x', '/x/embed', '/index.html']) expect(isEmbedPath(p)).toBe(false);
  });
  it('fora do navegador não é embed', () => {
    expect(isEmbedMode()).toBe(false);
  });
});
