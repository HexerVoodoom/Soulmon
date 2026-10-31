// @vitest-environment jsdom
/**
 * Regressão (QA, 31/10/2026): o fim de um lote não disparava o próximo.
 * `setGenerating([])` não muda nenhuma dependência do efeito "O lote", então o
 * 2º lote devendo só saía quando outra coisa mudava (ex.: reabrir o app).
 *
 * Contrato: lote limpo → reavalia na hora; lote com falha → só depois de
 * `SPRITE_REEVALUATE_AFTER_FAILURE_MS` (5 min), nunca em laço imediato.
 * O runner é mockado sem gravar no acervo — é exatamente a condição do bug
 * (nada nas dependências muda quando o lote acaba).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const runSpriteBatch = vi.fn();
const spriteBatch = vi.fn();
vi.mock('../utils/spriteRunner', () => ({ runSpriteBatch: (...a: unknown[]) => runSpriteBatch(...a) }));
vi.mock('../utils/spriteTrigger', () => ({
  spriteBatch: (...a: unknown[]) => spriteBatch(...a),
  birthBatch: () => null,
}));

import { useSpriteGeneration, SPRITE_REEVALUATE_AFTER_FAILURE_MS } from './useSpriteGeneration';
import { emptySpriteLibrary } from '../utils/spriteLibrary';
import type { CreatureStage } from '../utils/oracle';

// Referências ESTÁVEIS: um acervo novo a cada render mudaria `library` nas
// dependências e mascararia o bug (o efeito rodaria de novo por acidente).
const library = emptySpriteLibrary();
const trigger = { evolutionStage: 'rookie', evolutionPoints: 0 } as never;
const updateLibrary = () => {};
const stages = [{ stage: 'rookie' }, { stage: 'ultra' }] as unknown as CreatureStage[];

function montar() {
  return renderHook(() => useSpriteGeneration({
    trigger,
    library,
    updateLibrary,
    stages,
    dayKey: '2026-10-31',
    busy: false,
    enabled: true,
  }));
}

/** Passa o `whenIdle` (setTimeout de 2 s no jsdom) e drena as promessas do lote. */
async function avancar(ms: number) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
}

describe('useSpriteGeneration — reavaliação no fim do lote', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    runSpriteBatch.mockReset();
    spriteBatch.mockReset();
    spriteBatch
      .mockReturnValueOnce({ occasion: 'B', formIds: ['rookie'] })
      .mockReturnValueOnce({ occasion: 'B', formIds: ['ultra'] })
      .mockReturnValue(null);
  });
  afterEach(() => { vi.useRealTimers(); });

  it('lote limpo: o 2º lote parte em seguida, sem nada mais mudar', async () => {
    runSpriteBatch.mockResolvedValue({ done: ['x'], failed: [], aborted: false });
    const h = montar();
    await avancar(2500);
    expect(runSpriteBatch).toHaveBeenCalledTimes(1);
    expect(runSpriteBatch.mock.calls[0][0]).toEqual(['rookie']);
    await avancar(2500);
    expect(runSpriteBatch).toHaveBeenCalledTimes(2);
    expect(runSpriteBatch.mock.calls[1][0]).toEqual(['ultra']);
    h.unmount();
  });

  it('lote com falha: o 2º lote só parte depois de 5 min', async () => {
    runSpriteBatch.mockResolvedValueOnce({ done: [], failed: [{ formId: 'rookie', kind: 'error' }], aborted: false });
    runSpriteBatch.mockResolvedValue({ done: ['x'], failed: [], aborted: false });
    const h = montar();
    await avancar(2500);
    expect(runSpriteBatch).toHaveBeenCalledTimes(1);
    // Nada de laço imediato: logo antes dos 5 min, segue um lote só.
    await avancar(SPRITE_REEVALUATE_AFTER_FAILURE_MS - 3000);
    expect(runSpriteBatch).toHaveBeenCalledTimes(1);
    // Cruza os 5 min (o `act` só aplica o re-render ao sair) e passa o `whenIdle`.
    await avancar(3000);
    await avancar(2500);
    expect(runSpriteBatch).toHaveBeenCalledTimes(2);
    expect(runSpriteBatch.mock.calls[1][0]).toEqual(['ultra']);
    h.unmount();
  });

  it('desmontar limpa o timer da reavaliação adiada', async () => {
    runSpriteBatch.mockResolvedValue({ done: [], failed: [{ formId: 'rookie', kind: 'error' }], aborted: false });
    const h = montar();
    await avancar(2500);
    h.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
