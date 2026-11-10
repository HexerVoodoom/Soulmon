// @vitest-environment jsdom
/**
 * "Gerar Soulmon" (Configurações › Sua conta, 10/11/2026): o request FINAL ao Higgsfield (`requestSprite`, mockado) leva as palavras-chave do
 * elemento EFETIVO da forma equipada e a sprite é gravada na chave da forma equipada — `estágio` (original) ou `estágio@elemento`
 * (poção) — sem sobrescrever a outra. 3 bases. Conta sem poção: prompt idêntico ao de antes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const requestSprite = vi.fn();
vi.mock('../utils/spriteGen', async orig => ({ ...(await orig<typeof import('../utils/spriteGen')>()), requestSprite: (...a: unknown[]) => requestSprite(...a) }));

import { useSpriteGeneration } from './useSpriteGeneration';
import { emptySpriteLibrary, type SpriteLibrary } from '../utils/spriteLibrary';
import { pocoesDoEstado, stagesComElemento } from '../utils/elementoCombinado';
import { altSpriteKey } from '../utils/formasAlternativas';
import { elementoNomeDe } from '../utils/soulProfile/ficha/elementoNome';
import type { CreatureStage } from '../utils/oracle';

const RAW = 'A tall creature, ultimate form of the power line.';
const stagesCruos = [{ stage: 'perfeito', branch: 'poder', imagePrompt: RAW, imagePromptFallback: RAW + ' (fallback)' }] as unknown as CreatureStage[];

async function gerar(estado: Record<string, unknown>, jornadaBase: string) {
  const stagesDoPedido = stagesComElemento(stagesCruos as never, { v: 1, u: 0.5, estagios: { ultimate: { id: jornadaBase, base: jornadaBase } } }, pocoesDoEstado(estado as never)) as unknown as CreatureStage[];
  let lib: SpriteLibrary = { ...emptySpriteLibrary(), sprites: { 'ultimate-power': { url: 'https://img.test/orig1.png', formId: 'ultimate-power', provider: 'p', at: 1 } as never } };
  const updateLibrary = vi.fn((fn: (l: SpriteLibrary) => SpriteLibrary) => { lib = fn(lib); });
  const chave = altSpriteKey('ultimate-power', (estado.formaAltEquipada as Record<string, string>)?.['ultimate-power'], estado.formasAlt as never);
  const { result } = renderHook(() => useSpriteGeneration({
    trigger: { evolutionStage: 'ultimate-power', evolutionPoints: 0 } as never, library: lib, updateLibrary, stages: stagesDoPedido, dayKey: '2026-11-10', busy: true, enabled: false,
  }));
  let ok = false;
  act(() => { ok = result.current.force(chave, stagesDoPedido); });
  expect(ok).toBe(true);
  await waitFor(() => expect(requestSprite).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(JSON.stringify(lib.sprites)).toContain('nova1.png'));
  return { chave, prompt: requestSprite.mock.calls[0][0] as string, opts: requestSprite.mock.calls[0][1] as { formId: string }, lib };
}

beforeEach(() => { requestSprite.mockReset(); requestSprite.mockResolvedValue({ image: 'https://img.test/nova1.png', provider: 'p' }); });

describe('Gerar Soulmon: prompt final e chave da sprite', () => {
  for (const base of ['sombra', 'terra', 'fogo']) {
    it(`base ${base}, original sem poção: prompt natural = cru + pistas do ELEMENTO BASE (sem tema) e grava em 'ultimate-power'`, async () => {
      const r = await gerar({ evolutionStage: 'ultimate-power', formasAlt: { 'ultimate-power': ['original', 'ar'] }, formaAltEquipada: { 'ultimate-power': 'original' } }, base);
      expect(r.prompt.startsWith(RAW)).toBe(true);
      expect(r.prompt).toContain('Visual cues of this element:');
      expect(r.prompt).not.toContain('Elemental theme');
      expect(r.chave).toBe('ultimate-power');
      expect(r.opts.formId).toBe('ultimate-power');
      expect(r.lib.sprites['ultimate-power'].url).toBe('https://img.test/nova1.png');
    });
    it(`base ${base} + poção ar, forma de poção equipada: prompt com o tema da poção e grava em 'ultimate-power@ar' SEM tocar a original`, async () => {
      const r = await gerar({ evolutionStage: 'ultimate-power', potionElement: 'ar', formasAlt: { 'ultimate-power': ['original', 'ar'] }, formaAltEquipada: { 'ultimate-power': 'ar' } }, base);
      expect(r.prompt).toContain('Elemental theme of this form:');
      expect(r.prompt).toContain(elementoNomeDe('ar').en);
      expect(r.chave).toBe('ultimate-power@ar');
      expect(r.opts.formId).toBe('ultimate-power@ar');
      expect(r.lib.sprites['ultimate-power@ar'].url).toBe('https://img.test/nova1.png');
      expect(r.lib.sprites['ultimate-power'].url).toBe('https://img.test/orig1.png'); // a original ficou intacta
    });
  }
  it('original com poção (base forçada) leva o elemento BASE, não o da poção de outra forma', async () => {
    // a original equipada assume o base como elemento (`forcarOriginal`): potionElement = base
    const r = await gerar({ evolutionStage: 'ultimate-power', potionElement: 'terra', formasAlt: { 'ultimate-power': ['original', 'ar'] }, formaAltEquipada: { 'ultimate-power': 'original' } }, 'terra');
    expect(r.prompt).toContain(elementoNomeDe('terra').en);
    expect(r.prompt).not.toContain(elementoNomeDe('ar').en);
    expect(r.chave).toBe('ultimate-power');
  });
});
