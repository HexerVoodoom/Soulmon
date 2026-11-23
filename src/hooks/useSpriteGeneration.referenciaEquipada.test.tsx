// @vitest-environment jsdom
/**
 * Evolução (22/11/2026): a próxima forma é desenhada tendo como referência visual a arte da forma EQUIPADA (`trigger.currentKey`),
 * não a da chave original. Sem arte na equipada, cai na original. Os dados originais do acervo ficam intactos e continua UMA imagem
 * por pedido, só com os campos que `ia.camposEnviados.contract.test.ts` já declara (REGISTRO §404).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const requestSprite = vi.fn();
vi.mock('../utils/spriteGen', async orig => ({ ...(await orig<typeof import('../utils/spriteGen')>()), requestSprite: (...a: unknown[]) => requestSprite(...a) }));

import { useSpriteGeneration } from './useSpriteGeneration';
import { emptySpriteLibrary, type SpriteLibrary } from '../utils/spriteLibrary';
import type { CreatureStage } from '../utils/oracle';

const stages = [{ stage: 'ultimate', branch: 'poder', imagePrompt: 'next', imagePromptFallback: 'next fb' }] as unknown as CreatureStage[];
const e = (url: string, formId: string) => ({ url, formId, provider: 'p', at: 1 }) as never;

async function pedir(sprites: Record<string, unknown>, currentKey?: string) {
  let lib: SpriteLibrary = { ...emptySpriteLibrary(), sprites: sprites as never };
  const antes = JSON.stringify(lib.sprites);
  const updateLibrary = vi.fn((fn: (l: SpriteLibrary) => SpriteLibrary) => { lib = fn(lib); });
  const { result } = renderHook(() => useSpriteGeneration({
    trigger: { evolutionStage: 'champion-power', evolutionPoints: 0, ...(currentKey ? { currentKey } : {}) } as never,
    library: lib, updateLibrary, stages, dayKey: '2026-11-22', busy: false, enabled: false,
  }));
  act(() => { result.current.retry('ultimate-power'); });
  await waitFor(() => expect(requestSprite).toHaveBeenCalledTimes(1));
  return { opts: requestSprite.mock.calls[0][1] as { referenceImageUrls?: string[] }, antes, lib };
}

beforeEach(() => {
  (window as unknown as { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback = cb => window.setTimeout(cb, 0);
  requestSprite.mockReset(); requestSprite.mockResolvedValue({ image: 'https://img.test/nova.png', provider: 'p' }); });

describe('referência visual da próxima evolução', () => {
  it('com a forma alternativa equipada, a referência é a arte DELA (uma só imagem)', async () => {
    const r = await pedir({ 'champion-power': e('https://img.test/original.png', 'champion-power'), 'champion-power@fogo': e('https://img.test/fogo.png', 'champion-power@fogo') }, 'champion-power@fogo');
    expect(r.opts.referenceImageUrls).toEqual(['https://img.test/fogo.png']);
    expect(JSON.stringify(r.lib.sprites)).toContain('https://img.test/original.png'); // a original segue no acervo
    expect(r.lib.sprites['champion-power'].url).toBe('https://img.test/original.png');
  });
  it('equipada sem arte no acervo: cai na original', async () => {
    const r = await pedir({ 'champion-power': e('https://img.test/original.png', 'champion-power') }, 'champion-power@fogo');
    expect(r.opts.referenceImageUrls).toEqual(['https://img.test/original.png']);
  });
  it('sem `currentKey`: comportamento de antes (original)', async () => {
    const r = await pedir({ 'champion-power': e('https://img.test/original.png', 'champion-power'), 'champion-power@fogo': e('https://img.test/fogo.png', 'champion-power@fogo') });
    expect(r.opts.referenceImageUrls).toEqual(['https://img.test/original.png']);
  });
});
