// @vitest-environment jsdom
/** Falha de medição do alfa (sprite gerado/externo) → fallback conservador. */
import { describe, it, expect, vi } from 'vitest';

describe('medição falha → fallback conservador (nunca enorme)', () => {
  it('canvas tainted resolve FAILED_FILL e o fator vira o próprio alvo', async () => {
    const { measureVisibleFill, FAILED_FILL, petScaleFor, STAGE_TARGET, visibleFillOf } = await import('./spriteScale');
    const created: { crossOrigin?: string }[] = [];
    const RealImage = globalThis.Image;
    // @ts-expect-error stub mínimo de Image
    globalThis.Image = class { crossOrigin?: string; onload?: () => void; onerror?: () => void; set src(_v: string) { created.push(this as never); queueMicrotask(() => this.onload?.()); } };
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => tag === 'canvas'
      ? ({ getContext: () => ({ drawImage() {}, getImageData() { throw new Error('tainted'); } }) } as unknown as HTMLCanvasElement)
      : realCreate(tag)) as typeof document.createElement);
    try {
      const url = 'https://externo.example/sprite-tainted.png';
      expect(await measureVisibleFill(url)).toBe(FAILED_FILL);
      expect(created[0].crossOrigin).toBe('anonymous');
      expect(visibleFillOf(url)).toBe(FAILED_FILL);
      expect(petScaleFor('rookie', 'semente-padrao-x', FAILED_FILL)).toBeLessThanOrEqual(Math.max(STAGE_TARGET.rookie, 0.84));
      expect(petScaleFor('rookie', '', FAILED_FILL)).toBeCloseTo(STAGE_TARGET.rookie, 5);
    } finally {
      globalThis.Image = RealImage;
      vi.restoreAllMocks();
    }
  });
});
