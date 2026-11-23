// @vitest-environment jsdom
/**
 * Bug do dono (10/11/2026): "gerar de novo" a forma Ultimate SABÁ trocou a imagem da ORIGINAL. As ações de arte do App (tentar de novo,
 * sintonizar, voltar ao traço antigo) recebiam o id do ESTÁGIO e agiam na chave da original; agora agem na chave da forma EQUIPADA
 * (`chaveDaFormaEquipada`: `ultimate-power` = original, `ultimate-power@sabbat` = forma de poção).
 * Só a chave da forma equipada muda; a outra fica byte a byte igual.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const requestSprite = vi.fn();
vi.mock('../utils/spriteGen', async orig => ({ ...(await orig<typeof import('../utils/spriteGen')>()), requestSprite: (...a: unknown[]) => requestSprite(...a) }));

import { useSpriteGeneration } from './useSpriteGeneration';
import { emptySpriteLibrary, revertVisor, tuneVisor, type SpriteLibrary } from '../utils/spriteLibrary';
import { chaveDaFormaEquipada } from '../utils/formasAlternativas';
import type { CreatureStage } from '../utils/oracle';

const ORIG = { url: 'https://img.test/original.png', formId: 'ultimate-power', provider: 'p', at: 1 };
const SABA = { url: 'https://img.test/saba.png', formId: 'ultimate-power@sabbat', provider: 'p', at: 2 };
const NOVA = 'https://img.test/nova.png';
const formas = { 'ultimate-power': ['original', 'sabbat'] };
const stages = [{ stage: 'perfeito', branch: 'poder', imagePrompt: 'p', imagePromptFallback: 'f' }] as unknown as CreatureStage[];

const biblioteca = (): SpriteLibrary => ({
  ...emptySpriteLibrary(), sprites: { 'ultimate-power': ORIG as never, 'ultimate-power@sabbat': SABA as never },
  // falha manual registrada na forma, para o "Tentar de novo" estar liberado
  failures: { 'ultimate-power': { attempts: 1, manual: 0, kind: 'error', lastAt: 0 }, 'ultimate-power@sabbat': { attempts: 1, manual: 0, kind: 'error', lastAt: 0 } } as never,
});

vi.mock('../utils/entitlements', () => ({ fetchEntitlement: async () => null }));
import { useRegenAparencia } from './useRegenAparencia';

/** "Desenhar este visual de novo" (Vesca) com a forma equipada: o App passa `formId = chaveDaFormaEquipada(...)`. */
async function desenharDeNovo(equipada: 'original' | 'sabbat') {
  let lib = biblioteca();
  const updateLibrary = vi.fn((fn: (l: SpriteLibrary) => SpriteLibrary) => { lib = fn(lib); });
  const chave = chaveDaFormaEquipada('ultimate-power', formas, { 'ultimate-power': equipada });
  const { result } = renderHook(() => useRegenAparencia({
    library: lib, updateLibrary, stages, formId: chave, accountTier: 'paid', credits: 999, onCredits: () => {}, onNeedCredits: () => {}, dayKey: '2026-11-10', generatingOther: false,
  }));
  act(() => { result.current.ask(); });
  await waitFor(() => expect(result.current.confirming).toBe(true));
  act(() => { result.current.confirm(); });
  await waitFor(() => expect(requestSprite).toHaveBeenCalledTimes(1), { timeout: 5000 });
  await waitFor(() => expect(JSON.stringify(lib.sprites)).toContain('nova.png'), { timeout: 5000 });
  return { chave, lib, formIdPedido: (requestSprite.mock.calls[0][1] as { formId: string }).formId };
}

beforeEach(() => { requestSprite.mockReset(); requestSprite.mockResolvedValue({ image: NOVA, provider: 'p' }); });

describe('regenerar a forma EQUIPADA muda só a chave dela', () => {
  it('forma Sabá equipada: só `ultimate-power@sabbat` muda; a original fica igual', async () => {
    const r = await desenharDeNovo('sabbat');
    expect(r.chave).toBe('ultimate-power@sabbat');
    expect(r.formIdPedido).toBe('ultimate-power@sabbat');
    expect(r.lib.sprites['ultimate-power@sabbat'].url).toBe(NOVA);
    expect(r.lib.sprites['ultimate-power']).toEqual(ORIG);
  });
  it('original equipada: só `ultimate-power` muda; a Sabá fica igual', async () => {
    const r = await desenharDeNovo('original');
    expect(r.chave).toBe('ultimate-power');
    expect(r.lib.sprites['ultimate-power'].url).toBe(NOVA);
    expect(r.lib.sprites['ultimate-power@sabbat']).toEqual(SABA);
  });
  it('o bug: com o id do estágio (sem a chave equipada) a Sabá equipada agiria na ORIGINAL', () => {
    expect('ultimate-power').not.toBe(chaveDaFormaEquipada('ultimate-power', formas, { 'ultimate-power': 'sabbat' }));
  });
});

describe('sintonizar e voltar ao traço antigo agem na chave equipada', () => {
  it('reverter a Sabá equipada marca só a chave da Sabá (a original não entra em `reverted`)', () => {
    const chave = chaveDaFormaEquipada('ultimate-power', formas, { 'ultimate-power': 'sabbat' });
    const lib = revertVisor(biblioteca(), chave);
    expect(lib.reverted).toEqual(['ultimate-power@sabbat']);
    expect(tuneVisor(lib, chave).reverted).toEqual([]);
  });
  it('chave: estágio sem forma alternativa equipada = o próprio estágio', () => {
    expect(chaveDaFormaEquipada('champion-power', undefined, undefined)).toBe('champion-power');
    expect(chaveDaFormaEquipada('ultimate-power', formas, { 'ultimate-power': 'original' })).toBe('ultimate-power');
  });
});
