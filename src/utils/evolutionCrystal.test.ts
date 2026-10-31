import { describe, it, expect } from 'vitest';
import {
  activeCrystal, crystalBlocksLot, crystalPhase, crystalRefusalText, sanitizeCrystal, startCrystal,
  CRYSTAL_BLOCKED_LOTS, CRYSTAL_STUCK_MS,
} from './evolutionCrystal';
import { emptySpriteLibrary, recordFailure, recordSprite } from './spriteLibrary';
import { spriteBatch } from './spriteTrigger';

const NOW = new Date('2026-10-31T12:00:00Z');
const c = startCrystal('rookie', 'champion-power', 'power', NOW);

describe('cristal da evolução — estado', () => {
  it('nasce com o destino decidido no toque e sobrevive ao save (sanitize)', () => {
    expect(c).toEqual({ v: 1, from: 'rookie', to: 'champion-power', branch: 'power', since: NOW.toISOString() });
    expect(sanitizeCrystal(JSON.parse(JSON.stringify(c)))).toEqual(c);
  });
  it('save corrompido não vira cristal', () => {
    expect(sanitizeCrystal(null)).toBeUndefined();
    expect(sanitizeCrystal({ from: 'rookie' })).toBeUndefined();
    expect(sanitizeCrystal({ from: 'a', to: 'a', since: 'x' })).toBeUndefined();
    expect(sanitizeCrystal({ ...c, branch: 'xx' })?.branch).toBe('harmony');
  });
  it('só vale enquanto o estágio é o de partida (queda/renascer desfazem)', () => {
    expect(activeCrystal({ evolutionCrystal: c, evolutionStage: 'rookie' })).toBe(c);
    expect(activeCrystal({ evolutionCrystal: c, evolutionStage: 'baby' })).toBeNull();
    expect(activeCrystal({ evolutionStage: 'rookie' })).toBeNull();
  });
});

describe('cristal — bloqueios (decisão do dono: Masmorra, Fenda, Feira, Grove, Arena)', () => {
  it('fecha exatamente os seis prédios', () => {
    expect([...CRYSTAL_BLOCKED_LOTS].sort()).toEqual(
      ['arena.duelo', 'arena.torneio', 'exploracao.dungeon', 'exploracao.fenda', 'hall.feira', 'hall.grove'].sort(),
    );
    expect(crystalBlocksLot('arena', 'torneio')).toBe(true);
    expect(crystalBlocksLot('exploracao', 'fenda')).toBe(true);
    expect(crystalBlocksLot('hall', 'grove')).toBe(true);
  });
  it('o resto segue aberto (passeio, minijogos, mercado, laboratório, clã)', () => {
    expect(crystalBlocksLot('exploracao', 'passeio')).toBe(false);
    expect(crystalBlocksLot('jogos', 'pedra')).toBe(false);
    expect(crystalBlocksLot('laboratorio', 'evolucao')).toBe(false);
    expect(crystalBlocksLot('hall', 'guilda')).toBe(false);
    expect(crystalBlocksLot('arena', null)).toBe(false);
  });
  it('a mensagem é curta e clara, PT e EN', () => {
    expect(crystalRefusalText(true)).toMatch(/^Seu Soulmon está no cristal, evoluindo/);
    expect(crystalRefusalText(false)).toMatch(/^Your Soulmon is in the crystal, evolving/);
  });
});

describe('cristal — fase (gerando · falhou · pronto)', () => {
  const base = { crystal: c, library: emptySpriteLibrary(), canGenerate: true, generating: [] as string[], now: NOW.getTime() };
  it('sem arte ainda: gerando', () => {
    expect(crystalPhase(base)).toBe('gerando');
    expect(crystalPhase({ ...base, generating: ['champion-power'] })).toBe('gerando');
  });
  it('arte da forma-destino chegou: pronto', () => {
    const lib = recordSprite(emptySpriteLibrary(), { url: 'https://example.com/a.png', formId: 'champion-power', at: 1 }, { adopt: 'now' });
    expect(crystalPhase({ ...base, library: lib })).toBe('pronto');
  });
  it('quem não gera arte própria (demo, sem árvore) evolui direto com a reserva', () => {
    expect(crystalPhase({ ...base, canGenerate: false })).toBe('pronto');
  });
  it('falha: oferece tentar de novo / seguir, nunca prende', () => {
    const lib = recordFailure(emptySpriteLibrary(), 'champion-power', 'error');
    expect(crystalPhase({ ...base, library: lib })).toBe('falhou');
    expect(crystalPhase({ ...base, library: lib, skipped: true })).toBe('pronto');
  });
  it('teto da forma ou da conta: segue com a reserva', () => {
    expect(crystalPhase({ ...base, library: recordFailure(emptySpriteLibrary(), 'champion-power', 'form-cap') })).toBe('pronto');
    expect(crystalPhase({ ...base, library: recordFailure(emptySpriteLibrary(), 'outra', 'lifetime-cap') })).toBe('pronto');
  });
  it('nada chegou depois de muito tempo: falhou (a saída aparece)', () => {
    expect(crystalPhase({ ...base, now: NOW.getTime() + CRYSTAL_STUCK_MS })).toBe('falhou');
  });
});

describe('cristal — o lote da próxima forma só parte NO cristal', () => {
  const input = {
    evolutionStage: 'rookie', currentBranch: 'power' as const, unlockedEvolutions: ['egg', 'baby', 'rookie'],
    evolutionPoints: 9999, points: { power: 10, harmony: 0, benevolence: 0 },
    reading: { confident: false, pattern: null } as never, library: emptySpriteLibrary(),
  };
  it('barra cheia, fora do cristal: não gera', () => {
    expect(spriteBatch({ ...input, crystalFormId: null })).toBeNull();
  });
  it('no cristal: gera só a forma que o toque decidiu', () => {
    expect(spriteBatch({ ...input, crystalFormId: 'champion-harmony' })).toEqual({ occasion: 'C', formIds: ['champion-harmony'] });
  });
});
