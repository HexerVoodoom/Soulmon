// @vitest-environment jsdom
/**
 * Bug do dono (15/11/2026): "tá gerando duas imagens quando evolui". Causa: a chave de acervo da forma-destino do cristal era recalculada a cada
 * render contra o acervo — e a PRÓPRIA imagem recém-chegada (`champion-power`) mudava a resposta de `altSpriteKey` para `champion-power@elemento`,
 * que pede arte nova. O lote da forma-destino partia uma segunda vez (REGISTRO §404).
 *
 * Aqui a fiação do App (cristal → `crystalSpriteKey` → gatilho → hook) roda inteira com `requestSprite` mockado e CONTA os pedidos.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useState, useCallback } from 'react';

const requestSprite = vi.fn();
vi.mock('../utils/spriteGen', async orig => ({ ...(await orig<typeof import('../utils/spriteGen')>()), requestSprite: (...a: unknown[]) => requestSprite(...a) }));

import { useSpriteGeneration } from './useSpriteGeneration';
import { emptySpriteLibrary, type SpriteLibrary } from '../utils/spriteLibrary';
import { crystalSpriteKey, startCrystalFrozen, type EvolutionCrystal } from '../utils/evolutionCrystal';
import { registrarFormaAoEvoluir, chaveDaFormaEquipada } from '../utils/formasAlternativas';
import type { CreatureStage } from '../utils/oracle';
import type { ElementoJornada } from '../utils/elementoJornada';

const stages = [
  { stage: 'rookie', imagePrompt: 'rookie', imagePromptFallback: 'rookie fb' },
  { stage: 'champion', branch: 'poder', imagePrompt: 'champion', imagePromptFallback: 'champion fb' },
] as unknown as CreatureStage[];
const jornada: ElementoJornada = { v: 1, u: 0.5, estagios: { champion: { id: 'fogo', base: 'fogo' } } };

function acervoInicial(): SpriteLibrary {
  return { ...emptySpriteLibrary(), sprites: { rookie: { url: 'https://img.test/rookie.png', formId: 'rookie', provider: 'p', at: 1 } as never } };
}

/** O que o App faz entre o toque no cristal e o commit da evolução, com o acervo vivo. */
/** O toque no cristal, como o App o faz (`startCrystalFrozen`): a chave da arte nasce aqui, com o acervo de antes da geração. */
const tocar = (library: SpriteLibrary, formasAlt?: Record<string, string[]>) =>
  startCrystalFrozen({ evolutionStage: 'rookie', elementoJornada: jornada, formasAlt }, library, 'champion-power', 'power', new Date());

function useFiacao(opts: { crystal: EvolutionCrystal; formasAlt?: Record<string, string[]>; library?: SpriteLibrary }) {
  const [lib, setLib] = useState<SpriteLibrary>(opts.library ?? acervoInicial());
  const state = { evolutionStage: 'rookie', evolutionCrystal: opts.crystal, elementoJornada: jornada, formasAlt: opts.formasAlt };
  const cristalKey = crystalSpriteKey(state, lib);
  const updateLibrary = useCallback((fn: (l: SpriteLibrary) => SpriteLibrary) => setLib(prev => fn(prev)), []);
  useSpriteGeneration({
    trigger: {
      evolutionStage: 'rookie', currentBranch: 'harmony', unlockedEvolutions: ['rookie'], evolutionPoints: 999,
      points: { power: 5, harmony: 0, benevolence: 0 }, reading: { tied: false } as never,
      crystalFormId: cristalKey, currentKey: 'rookie',
    },
    library: lib, updateLibrary, stages, dayKey: '2026-11-15', busy: false, enabled: true,
  });
  return { lib, cristalKey };
}

beforeEach(() => {
  requestSprite.mockReset();
  requestSprite.mockImplementation(async (_p: string, o: { formId: string }) => ({ image: `https://img.test/${o.formId}.png`, provider: 'p' }));
  (window as unknown as { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback = cb => window.setTimeout(cb, 0);
});
afterEach(() => { delete (window as unknown as { requestIdleCallback?: unknown }).requestIdleCallback; });

const esperaAssentar = () => act(async () => { await new Promise(r => setTimeout(r, 250)); });

describe('cristal: UMA imagem por evolução', () => {
  it('primeira ida ao estágio (sem formas alternativas): um único pedido, na chave do estágio', async () => {
    const crystal = tocar(acervoInicial());
    const { result } = renderHook(() => useFiacao({ crystal }));
    await waitFor(() => expect(requestSprite).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.lib.sprites['champion-power']).toBeTruthy());
    await esperaAssentar();
    expect(requestSprite).toHaveBeenCalledTimes(1);
    expect(requestSprite.mock.calls[0][1].formId).toBe('champion-power');
    expect(Object.keys(result.current.lib.sprites).sort()).toEqual(['champion-power', 'rookie']);
    expect(result.current.cristalKey).toBe('champion-power');
  });

  it('o commit da evolução cai na MESMA chave da arte do cristal (nada a recuperar depois)', async () => {
    const crystal = tocar(acervoInicial());
    const { result } = renderHook(() => useFiacao({ crystal }));
    await waitFor(() => expect(result.current.lib.sprites['champion-power']).toBeTruthy());
    await esperaAssentar();
    const reg = registrarFormaAoEvoluir(undefined, undefined, 'champion-power', 'fogo', result.current.lib);
    expect(chaveDaFormaEquipada('champion-power', reg.formasAlt, reg.formaAltEquipada)).toBe(result.current.cristalKey);
    expect(requestSprite).toHaveBeenCalledTimes(1);
  });

  it('volta ao estágio com OUTRO elemento (a forma antiga já tem lista): continua sendo um pedido, na chave alternativa', async () => {
    const lib0 = acervoInicial();
    lib0.sprites['champion-power'] = { url: 'https://img.test/velha.png', formId: 'champion-power', provider: 'p', at: 1 } as never;
    const crystal = tocar(lib0, { 'champion-power': ['agua'] });
    const { result } = renderHook(() => useFiacao({ crystal, library: lib0, formasAlt: { 'champion-power': ['agua'] } }));
    await waitFor(() => expect(requestSprite).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.lib.sprites['champion-power@fogo']).toBeTruthy());
    await esperaAssentar();
    expect(requestSprite).toHaveBeenCalledTimes(1);
    expect(requestSprite.mock.calls[0][1].formId).toBe('champion-power@fogo');
  });
});
