/**
 * O PESADELO, REGRAS DE 15/10/2026 (pedido do dono): o dano que faltava (regressão), UMA fase, a regra de vitória
 * (cheer + especial parcial), os textos de fim PT/EN, os sprites do pesadelo, o elemento exclusivo, o SONHO BOM a cada
 * 6 dias e o determinismo. A tela está em `components/NightmareBattle.render.test.tsx`; o save em `functions/api/save.nightmares.test.js`.
 */
import { describe, expect, it } from 'vitest';
import { LADDER_TIERS, dungeonFoe } from './dungeon';
import {
  GOOD_DREAM_HONOR, NIGHTMARE_CYCLE_DAYS, NIGHTMARE_END_TEXT, NIGHTMARE_HINT, NIGHTMARE_MEGA_EASE, NIGHTMARE_POWER, NIGHTMARE_WAVE_SIZE,
  buildNightmareWave, claimGoodDream, countNightmareDay, createNightmareState, hasPendingGoodDream, markFought, nightmareEndText,
  nightmareFoe, sanitizeNightmareState, specialLanded, type NightmareState,
} from './nightmares';
import { nightmareRefs, playSequence, simulateNightmareScenario, SCENARIO_FULL, SCENARIO_NONE, type NightmareScenario } from './dungeonFight';
import { createRestState, recordNight, type RestState } from './restWindow';
import { REFERENCE_BUILDS } from './combate/level';
import type { SequenceConfig } from './dungeonFight';
import { SHADOW_SLOTS, nightmareShadowSprite, shadowSource } from './nightmareShadows';
import { DUNGEON_LINE_SPRITES } from './sprites';
import { VISUAL_ELEMENTS, fxElementId, fxFrame, FX_FALLBACK_ELEMENT, elementStrikeForm } from './combatFx';
import { NIGHTMARE_ELEMENT, hasNightmareFx, nightmareMatchup } from './nightmareElement';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { EMBLEMS_PER_WIN } from './currencies';

const at = (y: number, m: number, d: number, h: number) => new Date(y, m, d, h, 0);
function withNights(count: number, lastMorning: Date): RestState {
  let state = createRestState();
  for (let i = count - 1; i >= 0; i--) {
    const morning = new Date(lastMorning.getTime());
    morning.setDate(morning.getDate() - i);
    const slept = new Date(morning.getTime());
    slept.setDate(slept.getDate() - 1);
    slept.setHours(23, 30, 0, 0);
    state = recordNight(state, slept, new Date(slept.getTime() + 8 * 3600_000));
  }
  return state;
}
const cfg = { level: 20, build: REFERENCE_BUILDS.balanced, family: 'direct' as const };
const meanHpLeft = (run: (s: number) => number, n = 40) => Array.from({ length: n }, (_, s) => run(s + 1)).reduce((a, b) => a + b, 0) / n;

describe('REGRESSÃO — o pesadelo CAUSA dano', () => {
  it('RED (a causa): a onda antiga (dungeonFoe do andar 1, força 0,03-0,10) deixava o Soulmon quase intacto (>= 88% do HP)', () => {
    for (const top of [2, 3, 4, 5]) {
      const antigo = meanHpLeft((s) => playSequence(cfg, [{ slot: top, floor: 1 }], s).hpLeft);
      expect(antigo, `top ${top}`).toBeGreaterThan(0.88);
    }
  });
  it('GREEN: o pesadelo derruba o Soulmon de verdade (HP chega a zero) quando o jogador não ajuda; e com ajuda ele machuca sem matar', () => {
    for (const top of [1, 2, 3, 4, 5]) {
      const sem = Array.from({ length: 40 }, (_, s) => simulateNightmareScenario(cfg, top, s + 1, SCENARIO_NONE));
      expect(sem.filter((x) => !x.won).length / sem.length, `top ${top}`).toBeGreaterThanOrEqual(0.9); // o Soulmon cai
      const com = Array.from({ length: 40 }, (_, s) => simulateNightmareScenario(cfg, top, s + 1, SCENARIO_FULL));
      expect(com.some((x) => x.won && x.hpLeft < 0.95), `top ${top}`).toBe(true); // há dano real mesmo vencendo
    }
  });
  it('o corpo do inimigo (HP) é o da Masmorra; só a força muda — e a Masmorra continua intocada', () => {
    for (let slot = 0; slot < 6; slot++) {
      const n = nightmareFoe(20, slot);
      const d = dungeonFoe(20, slot, 1);
      expect(n.combatant.hp).toBe(d.combatant.hp);
      expect(n.combatant.bonus).toBe(NIGHTMARE_POWER * (slot >= 5 ? NIGHTMARE_MEGA_EASE : 1) - 1);
      expect(n.special).toEqual(d.special);
      expect(d.combatant.bonus).toBeLessThan(-0.9); // a Masmorra segue com a força dela
    }
  });
});

describe('UMA fase, sempre', () => {
  it('NIGHTMARE_WAVE_SIZE = 1 e a onda tem um único inimigo em qualquer estágio, raridade e level', () => {
    expect(NIGHTMARE_WAVE_SIZE).toBe(1);
    for (const n of [1, 4, 7]) {
      const now = at(2026, 9, 15, 8);
      const rest = withNights(n, now);
      for (const stage of ['rookie', 'champion-power', 'ultimate-power', 'mega-power', 'ultra']) {
        for (const L of [1, 15, 40]) expect(buildNightmareWave(rest, stage, now, L).length).toBeLessThanOrEqual(1);
      }
    }
    const now = at(2026, 9, 15, 8);
    expect(buildNightmareWave(withNights(7, now), 'champion-power', now, 10)).toHaveLength(1);
    expect(nightmareRefs(3)).toHaveLength(1);
  });
});

describe('CALIBRAGEM — a vitória é o HP; a dificuldade é o pesadelo derrubar o Soulmon primeiro (dono, 15/10/2026)', () => {
  const cfgs: SequenceConfig[] = [5, 20, 40].flatMap((level) => (['balanced', 'atk'] as const).map((b) => ({ level, build: REFERENCE_BUILDS[b], family: 'direct' as const })));
  /** Taxa de vitória do Soulmon: 6 fichas x 40 sementes = 240 lutas por tier. */
  const taxa = (top: number, sc: NightmareScenario): number => {
    let w = 0;
    let n = 0;
    for (const c of cfgs) for (let s = 1; s <= 40; s++) { w += +simulateNightmareScenario(c, top, s, sc).won; n++; }
    return w / n;
  };
  const tiers = [1, 2, 3, 4, 5];
  const medido = tiers.map((top) => ({
    top,
    A: taxa(top, SCENARIO_NONE), // sem torcida e sem especial certeiro (anel ruim)
    B: taxa(top, SCENARIO_FULL), // torcida ativa + especiais com anel bom
    C1: taxa(top, { cheerEvery: 6, ring: 'ruim' }), // torcida sem acertar especial
    C2: taxa(top, { cheerEvery: null, ring: 'bom' }), // especial sem torcida
  }));
  it('valores finais e números medidos (registrados no REGISTRO §65)', () => {
    console.log(`[CALIBRAGEM] ${medido.map((m) => `t${m.top} A ${m.A.toFixed(2)} B ${m.B.toFixed(2)} C1 ${m.C1.toFixed(2)} C2 ${m.C2.toFixed(2)}`).join(' | ')}`);
    expect(NIGHTMARE_POWER).toBe(1.2);
    expect(NIGHTMARE_MEGA_EASE).toBe(0.8);
  });
  it('A: sem torcida e sem especiais certeiros o Soulmon perde em >= 90% das sementes', () => {
    for (const m of medido) expect(1 - m.A, `tier ${m.top}`).toBeGreaterThanOrEqual(0.9);
  });
  it('B: com torcida e especiais ao menos parciais o jogador vence em >= 75% (tiers 1-3) e >= 50% (tiers 4-5)', () => {
    for (const m of medido) expect(m.B, `tier ${m.top}`).toBeGreaterThanOrEqual(m.top <= 3 ? 0.75 : 0.5);
  });
  it('C: torcida sem acertar especiais, e especiais sem torcida: derrota na maioria (>= 70%)', () => {
    for (const m of medido) {
      expect(1 - m.C1, `C1 tier ${m.top}`).toBeGreaterThanOrEqual(0.7);
      expect(1 - m.C2, `C2 tier ${m.top}`).toBeGreaterThanOrEqual(0.7);
    }
  });
  it('determinístico: a mesma ficha, semente e cenário dão a mesma luta', () => {
    const a = simulateNightmareScenario(cfg, 3, 7, SCENARIO_FULL);
    expect(simulateNightmareScenario(cfg, 3, 7, SCENARIO_FULL)).toEqual(a);
  });
  it('o acerto parcial conta: bom e ótimo acertam, ruim erra', () => {
    expect(specialLanded('otimo')).toBe(true);
    expect(specialLanded('bom')).toBe(true);
    expect(specialLanded('ruim')).toBe(false);
    expect(specialLanded(null)).toBe(false);
  });
  it('a dica da luta (PT/EN) diz que só com a torcida e os especiais certeiros o Soulmon aguenta', () => {
    expect(NIGHTMARE_HINT.pt).toMatch(/torcida e os especiais certeiros/);
    expect(NIGHTMARE_HINT.en).toMatch(/cheer and well-aimed specials/);
  });
});

describe('TEXTOS de fim (PT e EN, exatamente)', () => {
  it('desvanece / extinto', () => {
    expect(nightmareEndText('faded', 'pt-BR')).toBe('O pesadelo desvaneceu, mas continua à espreita.');
    expect(nightmareEndText('faded', 'en-US')).toBe('The nightmare faded, but it still lurks.');
    expect(nightmareEndText('extinct', 'pt-BR')).toBe('As sombras se dissipam, o pesadelo foi extinto e dá espaço para os sonhos.');
    expect(nightmareEndText('extinct', 'en-US')).toBe('The shadows disperse, the nightmare is extinguished and makes room for dreams.');
    expect(Object.keys(NIGHTMARE_END_TEXT).sort()).toEqual(['extinct', 'faded']);
  });
});

describe('SPRITES — o pesadelo usa a sombra dele, não um Soulmon comum', () => {
  const now = at(2026, 9, 15, 8);
  const rest = withNights(7, now);
  const comuns = new Set(Object.values(DUNGEON_LINE_SPRITES).flatMap((l) => Object.values(l as Record<string, string>)));
  const sombras = new Set(SHADOW_SLOTS.flatMap((row, tier) => row.map((_, v) => shadowSource(tier, v).src)));
  it('todo inimigo da onda é uma sombra `dino-shadow-*` de arte real', () => {
    for (const stage of ['rookie', 'champion-power', 'ultimate-power', 'mega-power']) {
      const wave = buildNightmareWave(rest, stage, now, 10);
      expect(wave.length).toBe(1);
      for (const e of wave) {
        expect(sombras.has(e.sprite)).toBe(true);
        expect(comuns.has(e.sprite)).toBe(false);
        expect(shadowSource(0, 0).art).toBe(true);
      }
    }
  });
  it('o degrau acompanha o tier do inimigo e a mesma noite dá a mesma sombra', () => {
    expect([0, 1, 2, 3, 4, 5].map((s) => nightmareShadowSprite(s, 0).id)).toEqual(['1', '1', '1', '2', '3', '4']);
    expect(nightmareShadowSprite(4, 7).src).toBe(nightmareShadowSprite(4, 7).src);
    expect(nightmareShadowSprite(4, 1).id).toBe('3b');
    expect(buildNightmareWave(rest, 'champion-power', now, 10)).toEqual(buildNightmareWave(rest, 'champion-power', now, 10));
  });
});

describe('ELEMENTO PESADELO — exclusivo da mecânica', () => {
  it('não é elemento de jogador: fora dos elementos visuais e dos derivados', () => {
    expect(NIGHTMARE_ELEMENT).toBe('pesadelo');
    expect((VISUAL_ELEMENTS as readonly string[]).includes(NIGHTMARE_ELEMENT)).toBe(false);
    expect(JSON.stringify(DERIVED_ELEMENT_PAIRS)).not.toMatch(/pesadelo/);
  });
  it('matchup NEUTRO: nenhum elemento ganha ou perde vantagem por causa dele', () => {
    for (const el of [...VISUAL_ELEMENTS, 'neutro', undefined, null]) expect(nightmareMatchup(el)).toBe(0);
  });
  it('sem arte instalada cai no FX procedural (neutro) — nada quebra; o encaixe pronto aceita os PNG', () => {
    expect(hasNightmareFx()).toBe(false); // quando a arte entrar em src/assets/soulmon/pesadelo/, este teste vira "true" de propósito
    expect(fxElementId(NIGHTMARE_ELEMENT)).toBe(FX_FALLBACK_ELEMENT);
    for (const e of ['cast', 'aura', 'slash', 'impact', 'defended', 'orb'] as const) expect(fxFrame(NIGHTMARE_ELEMENT, e)).toBe(fxFrame('neutro', e));
    expect(elementStrikeForm(NIGHTMARE_ELEMENT, 'basica')).toBeTruthy();
  });
  it('os outros elementos continuam resolvendo como antes', () => {
    expect(fxElementId('fogo')).toBe('fogo');
    expect(fxElementId('planta')).toBe('vida');
  });
});

describe('SONHO BOM — a cada 6 dias de pesadelo', () => {
  const dia = (i: number) => `Day ${i}`;
  const lutar = (nm: NightmareState, n: number, from = 1) => { let s = nm; for (let i = from; i < from + n; i++) s = markFought(s, dia(i)); return s; };
  it('dias 1-5 contam, o 6º fecha o ciclo e arma o sonho bom', () => {
    const cinco = lutar(createNightmareState(), 5);
    expect(cinco.lurkDays).toHaveLength(5);
    expect(hasPendingGoodDream(cinco)).toBe(false);
    const seis = lutar(cinco, 1, 6);
    expect(NIGHTMARE_CYCLE_DAYS).toBe(6);
    expect(hasPendingGoodDream(seis)).toBe(true);
  });
  it('reabrir o mesmo dia não conta de novo; depois de pendente nada mais conta', () => {
    const a = markFought(createNightmareState(), 'd1');
    expect(markFought(a, 'd1')).toEqual(a);
    expect(countNightmareDay(a, 'd1')).toBe(a);
    const seis = lutar(createNightmareState(), 6);
    expect(lutar(seis, 3, 20).lurkDays).toEqual(seis.lurkDays);
    expect(hasPendingGoodDream(lutar(seis, 3, 20))).toBe(true);
  });
  it('colher paga a Honra UMA vez (idempotente), reinicia o ciclo e conta o sonho', () => {
    const seis = lutar(createNightmareState(), 6);
    const r = claimGoodDream(seis);
    expect(r.honor).toBe(GOOD_DREAM_HONOR);
    expect(GOOD_DREAM_HONOR).toBe(EMBLEMS_PER_WIN); // o equivalente a uma vitória no Torneio
    expect(r.state.goodDream).toBeUndefined();
    expect(r.state.lurkDays).toEqual([]);
    expect(r.state.goodDreams).toBe(1);
    const deNovo = claimGoodDream(r.state);
    expect(deNovo.honor).toBe(0);
    expect(deNovo.state).toBe(r.state);
    // novo ciclo: mais 6 dias, outro sonho
    const ciclo2 = claimGoodDream(lutar(r.state, 6, 50));
    expect(ciclo2.honor).toBe(GOOD_DREAM_HONOR);
    expect(ciclo2.state.goodDreams).toBe(2);
  });
  it('fechar pelo × sem lutar NÃO conta para os 6 dias (count=false), mas marca a noite; lutar depois no mesmo dia não é mais contado', () => {
    const a = markFought(createNightmareState(), 'd1', false);
    expect(a.fought).toEqual(['d1']);
    expect(a.lurkDays).toBeUndefined();
    let s = createNightmareState();
    for (let i = 1; i <= 6; i++) s = markFought(s, dia(i), false);
    expect(hasPendingGoodDream(s)).toBe(false);
  });
  it('SEM RETROATIVO: um save antigo (30 noites lutadas, sem o ciclo) começa em zero e não paga nada', () => {
    const antigo = sanitizeNightmareState({ fought: Array.from({ length: 30 }, (_, i) => `old${i}`) });
    expect(hasPendingGoodDream(antigo)).toBe(false);
    expect(antigo.lurkDays).toBeUndefined();
    expect(claimGoodDream(antigo).honor).toBe(0);
  });
  it('sem sonho pendente não há o que colher', () => {
    expect(claimGoodDream(createNightmareState())).toEqual({ state: createNightmareState(), honor: 0 });
  });
});

describe('sanitizeNightmareState (cliente)', () => {
  it('lixo vira estado vazio e o ciclo é saneado', () => {
    for (const lixo of [null, undefined, 1, 'x', [], { fought: {} }]) expect(sanitizeNightmareState(lixo)).toEqual({ fought: [] });
    const s = sanitizeNightmareState({ fought: ['a', 3, 'a', 'b'], pending: 'p', lurkDays: ['1', '2', '3', '4', '5', '6', '7', 9], goodDream: 'sim', goodDreams: 12.7 });
    expect(s).toEqual({ fought: ['a', 'b'], pending: 'p', lurkDays: ['2', '3', '4', '5', '6', '7'], goodDreams: 12 });
    expect(sanitizeNightmareState({ goodDream: true, goodDreams: -4 })).toEqual({ fought: [], goodDream: true });
  });
});

describe('LADDER', () => { it('a escada segue com 6 tiers', () => { expect(LADDER_TIERS).toHaveLength(6); }); });
