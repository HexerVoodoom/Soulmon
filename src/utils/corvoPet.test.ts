import { describe, it, expect } from 'vitest';
import {
  CORVO_FORM_IDS, CORVO_SPRITES, CORVO_SPRITES_256, CORVO_STAGES, CORVO_LINE,
  adoptCorvo, isCorvo, spriteLineOf, corvoFormName,
} from './corvoPet';
import { getSpriteForStage, resolveLineForStage } from './sprites';
import { creatureFormId } from './oracle';

const saveNormal = () => ({
  evolutionStage: 'mega-harmony',
  currentBranch: 'harmony' as const,
  perfectDays: 40,
  totalPerfectDays: 55,
  gamePoints: 321,
  unlockedEvolutions: ['rookie', 'champion-harmony', 'ultimate-harmony', 'mega-harmony'],
  tasks: [{ id: 't1' }],
  spriteLibrary: { forms: { rookie: { url: 'https://x/y.png' } } },
  soulmonStages: [{ stage: 'rookie', name: 'Outro', stageName: { pt: '', en: '' }, description: { pt: '', en: '' }, imagePrompt: 'p', imagePromptFallback: 'p' }],
  soulmonMeta: { baseName: 'Outro', petName: 'Bidu', seed: 7 },
} as const);

describe('corvoPet — o corvinho do administrador', () => {
  it('11 formas → 11 sprites distintos (512 e 256), todos do próprio bundle', () => {
    expect(CORVO_FORM_IDS).toHaveLength(11);
    const a = CORVO_FORM_IDS.map(id => CORVO_SPRITES[id]);
    const b = CORVO_FORM_IDS.map(id => CORVO_SPRITES_256[id]);
    expect(new Set(a).size).toBe(11);
    expect(new Set(b).size).toBe(11);
    // Asset do próprio bundle: caminho relativo à origem do app, nunca URL de
    // terceiro — por isso não passa (nem precisa passar) por `isSafeSpriteUrl`,
    // que é a guarda de URL VINDA DE FORA (acervo).
    for (const u of [...a, ...b]) {
      expect(u).toMatch(/^\/(?!\/)/);
      expect(u).toMatch(/corvo-/);
    }
  });

  it('CORVO_STAGES: 11 formas, ids batem com a escada, nomes/descrições PT+EN', () => {
    expect(CORVO_STAGES.map(creatureFormId)).toEqual([...CORVO_FORM_IDS]);
    for (const st of CORVO_STAGES) {
      expect(st.description.pt.length).toBeGreaterThan(10);
      expect(st.description.en.length).toBeGreaterThan(10);
      expect(st.name).not.toMatch(/mon$/i);
    }
    expect(corvoFormName('rookie', 'pt-BR')).toBe('Corvinho');
    expect(corvoFormName('rookie', 'en')).toBe('Little Raven');
    expect(new Set(CORVO_FORM_IDS.map(id => corvoFormName(id, 'en'))).size).toBe(11);
  });

  it('isCorvo é false para todo save normal (e para lixo)', () => {
    expect(isCorvo(saveNormal())).toBe(false);
    expect(isCorvo(undefined)).toBe(false);
    expect(isCorvo({ soulmonMeta: { baseName: 'x', creature: 'CORVO' } })).toBe(false);
    expect(isCorvo({ demoCharacterId: 'corvo' })).toBe(false);
    expect(spriteLineOf({ demoCharacterId: 'kaelen' })).toBe('kaelen');
  });

  it('adoptCorvo: só troca a criatura, preserva progresso e é idempotente (mesma referência)', () => {
    const prev = saveNormal();
    const next = adoptCorvo({ ...prev, demoCharacterId: undefined } as never) as ReturnType<typeof saveNormal> & { soulmonMeta: { creature?: string; petName?: string; baseName: string } };
    expect(isCorvo(next)).toBe(true);
    expect(next.evolutionStage).toBe(prev.evolutionStage);
    expect(next.perfectDays).toBe(40);
    expect(next.totalPerfectDays).toBe(55);
    expect(next.gamePoints).toBe(321);
    expect(next.unlockedEvolutions).toBe(prev.unlockedEvolutions);
    expect(next.tasks).toBe(prev.tasks);
    expect(next.spriteLibrary).toBe(prev.spriteLibrary);
    expect(next.soulmonMeta.petName).toBe('Bidu');
    expect(next.soulmonMeta.baseName).toBe('Corvinho');
    expect(next.soulmonStages).toBe(CORVO_STAGES);
    expect(adoptCorvo(next as never)).toBe(next);
  });

  it('resolução de arte: com a linha do corvo, cada forma dá o sprite do corvo', () => {
    for (const id of CORVO_FORM_IDS) {
      expect(getSpriteForStage(id, CORVO_LINE)).toBe(CORVO_SPRITES[id]);
      expect(getSpriteForStage(id, CORVO_LINE, 256)).toBe(CORVO_SPRITES_256[id]);
      expect(getSpriteForStage(id)).not.toBe(CORVO_SPRITES[id]);
      expect(resolveLineForStage(id, CORVO_LINE)).toBeNull();
    }
    const corvo = adoptCorvo(saveNormal() as never);
    expect(getSpriteForStage('ultra', spriteLineOf(corvo))).toBe(CORVO_SPRITES.ultra);
  });
});
