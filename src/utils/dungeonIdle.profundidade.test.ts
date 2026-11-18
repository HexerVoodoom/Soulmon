/**
 * A masmorra como recurso IDLE de retorno (decisão do dono, 11/10/2026 — REGISTRO §31): energia por camada,
 * profundidade até 999 com a zona de conforto do Lv, teto de camadas por Lv/Vínculo, ponto de retorno, recorde e
 * marcos de profundidade, e o Level Up que restaura energia e HP. Tudo puro; a parede é medida no núcleo REAL.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  DUNGEON_ENERGY_PER_LAYER, DUNGEON_MAX_LAYER, DUNGEON_MILESTONE_FLOOR, DUNGEON_DEPTH_MARKS,
  comfortLayers, effectiveFloor, startLayerFor, isMilestoneLayer, canPayLayer, layersAffordable,
  spendLayer, sanitizeDepthRecord, depthMarksCrossed, recordLayerCleared,
} from './dungeonIdle';
import { STAGE_LEVEL_CAPS, getMaxEnergyForStage, FORM_REQUIREMENTS } from '../types/progression';
import { simulateDungeonRunV3 } from './dungeonFight';
import { REFERENCE_BUILD_NAMES, REFERENCE_BUILDS } from './combate/level';
import { SPECIAL_FAMILIES } from './combate/specials';
import { applyLevelUpCelebrated } from './levelUp';
import { buildDungeonWave } from './dungeon';
import { clearBonus } from '../components/DungeonGame';

vi.setConfig({ testTimeout: 180_000 });

const TOP = STAGE_LEVEL_CAPS[STAGE_LEVEL_CAPS.length - 1];

describe('constantes', () => {
  it('1 de energia por camada, 999 camadas, margem de 6, marco a cada 5', () => {
    expect(DUNGEON_ENERGY_PER_LAYER).toBe(1);
    expect(DUNGEON_MAX_LAYER).toBe(999);
    expect(DUNGEON_MILESTONE_FLOOR).toBe(5);
  });
  it('orçamento (REGISTRO §30): o leve (~2 de energia/dia) faz 2 camadas; o máximo do estágio paga 8–12, sem comer além do que as tarefas dão', () => {
    expect(layersAffordable(2)).toBe(2);
    expect(layersAffordable(4)).toBe(4);
    for (const st of Object.keys(FORM_REQUIREMENTS)) expect(layersAffordable(getMaxEnergyForStage(st))).toBeLessThanOrEqual(12);
  });
});

describe('zona de conforto, andar efetivo e teto', () => {
  it('a tabela por Lv (os tetos de estágio): 0 / 16 / 95 / 263 / 552 / 999', () => {
    expect(STAGE_LEVEL_CAPS.map(comfortLayers)).toEqual([16, 95, 263, 552, 999]);
    expect(comfortLayers(1)).toBe(0);
    expect(comfortLayers(TOP)).toBe(DUNGEON_MAX_LAYER);
  });
  it('é monótona no Lv e aceita lixo', () => {
    for (let L = 1; L < TOP; L++) expect(comfortLayers(L + 1)).toBeGreaterThanOrEqual(comfortLayers(L));
    expect(comfortLayers(Number.NaN)).toBe(0);
    expect(comfortLayers(-5)).toBe(0);
    expect(comfortLayers(1e9)).toBe(DUNGEON_MAX_LAYER);
  });
  it('Lv 1: o andar efetivo É a camada (a calibração 1–6 do combate v3 fica intacta)', () => {
    for (let c = 1; c <= 6; c++) expect(effectiveFloor(c, 1)).toBe(c);
  });
  it('dentro da zona luta-se no andar 1; depois dela a dificuldade sobe camada a camada', () => {
    const z = comfortLayers(13);
    expect(effectiveFloor(1, 13)).toBe(1);
    expect(effectiveFloor(z, 13)).toBe(1);
    expect(effectiveFloor(z + 1, 13)).toBe(1);
    expect(effectiveFloor(z + 4, 13)).toBe(4);
  });
  it('SEM teto de profundidade por Lv nem por Vínculo (16/11/2026): `dungeonLayerCap` saiu; quem limita é energia e o limite diário', async () => {
    const mod = await import('./dungeonIdle') as Record<string, unknown>;
    expect(mod.dungeonLayerCap).toBeUndefined();
    expect(mod.DUNGEON_CAP_MARGIN).toBeUndefined();
    expect(startLayerFor(DUNGEON_MAX_LAYER)).toBe(DUNGEON_MAX_LAYER); // o recorde fundo continua valendo como ponto de retorno
  });
});

describe('ponto de retorno, marcos e recorde', () => {
  it('começa logo DEPOIS do andar mais fundo limpo (a derrota nunca rebaixa o andar, §477), nunca acima do teto', () => {
    expect(startLayerFor(0, 100)).toBe(1); // save antigo / sem recorde: andar 1, como sempre
    expect(startLayerFor(1, 100)).toBe(2);
    expect(startLayerFor(2, 100)).toBe(3);
    expect(startLayerFor(3, 100)).toBe(4); // limpou o 1º andar do elemento (3) e caiu no 2º (4): volta ao 4, combate 1
    expect(startLayerFor(4, 100)).toBe(5);
    expect(startLayerFor(37, 100)).toBe(38);
    expect(startLayerFor(37, 10)).toBe(10); // teto 10: começa no 10
    expect(startLayerFor(999, 999)).toBe(999);
    expect(startLayerFor(50, 3)).toBe(3);
  });
  it('elementos independentes: cada recorde vira o seu andar de largada e a derrota no andar 1 reentra no andar 1', () => {
    // 1º andar de um elemento (ímpar) cai no 1º: recorde = andar anterior limpo → largada = esse 1º andar, combate 1
    expect(startLayerFor(4, 100)).toBe(5);
    // 2º andar do elemento seguinte: vencer os 6 do 5 e cair no 6 → recorde 5 → reentra no 6
    expect(startLayerFor(5, 100)).toBe(6);
    // vencer o 6 (completa o elemento) → recorde 6 → próximo elemento, andar 7
    expect(startLayerFor(6, 100)).toBe(7);
  });
  it('marco = múltiplo de 5', () => {
    expect([4, 5, 6, 10, 0].map(isMilestoneLayer)).toEqual([false, true, false, true, false]);
  });
  it('recorde só sobe, é idempotente e cruza cada marco de profundidade UMA vez', () => {
    const s0 = { dungeonDepthRecord: 3 };
    const a = recordLayerCleared(s0, 12);
    expect(a.next.dungeonDepthRecord).toBe(12);
    expect(a.marks.map(m => m.layer)).toEqual([5, 10]);
    const b = recordLayerCleared(a.next, 12);
    expect(b.next).toBe(a.next);
    expect(b.marks).toEqual([]);
    const c = recordLayerCleared(a.next, 7);
    expect(c.next).toBe(a.next); // camada mais rasa não rebaixa
    expect(depthMarksCrossed(0, 999).length).toBe(DUNGEON_DEPTH_MARKS.length);
  });
  it('marcos rendem material (fragmentos), nunca Bits, crescendo com a profundidade', () => {
    for (const m of DUNGEON_DEPTH_MARKS) expect(Object.keys(m).sort()).toEqual(['fragments', 'layer']);
    for (let i = 1; i < DUNGEON_DEPTH_MARKS.length; i++) expect(DUNGEON_DEPTH_MARKS[i].fragments).toBeGreaterThan(DUNGEON_DEPTH_MARKS[i - 1].fragments);
  });
  it('sanitizeDepthRecord: lixo vira 0 e tudo cabe em [0, 999]', () => {
    expect([undefined, 'x', Number.NaN, -3, 4.7, 5000].map(sanitizeDepthRecord)).toEqual([0, 0, 0, 0, 4, 999]);
  });
});

describe('energia por camada', () => {
  it('gasta 1 e não muta; sem energia devolve a MESMA referência (nada de negativo)', () => {
    const T = Date.UTC(2026, 9, 13, 15, 0, 0);
    const s = Object.freeze({ energyPoints: 2, evolutionStage: 'rookie', hunger: { v: 0, at: T }, x: 1 });
    const a = spendLayer(s, T);
    expect(a.energyPoints).toBe(1);
    expect(s.energyPoints).toBe(2);
    const z = { energyPoints: 0, evolutionStage: 'rookie', hunger: { v: 0, at: T } };
    expect(spendLayer(z, T)).toBe(z);
    expect(canPayLayer(0)).toBe(false);
    expect(canPayLayer('9')).toBe(false);
    expect(canPayLayer(1)).toBe(true);
  });
});

describe('Level Up restaura energia e HP da masmorra — uma vez por celebração', () => {
  const base = { lastCelebratedLevel: 4, energyPoints: 1, evolutionStage: 'rookie', dungeonHp: { frac: 0.1, at: 5 } };
  it('sobe → energia no máximo do estágio (nunca acima) e HP cheio', () => {
    const r = applyLevelUpCelebrated(base, 6);
    expect(r.lastCelebratedLevel).toBe(6);
    expect(r.energyPoints).toBe(getMaxEnergyForStage('rookie'));
    expect(r.dungeonHp).toBeUndefined();
  });
  it('idempotente: a 2ª chamada com o mesmo nível é a mesma referência; nível menor não restaura', () => {
    const r = applyLevelUpCelebrated(base, 6);
    expect(applyLevelUpCelebrated(r, 6)).toBe(r);
    expect(applyLevelUpCelebrated(r, 3)).toBe(r);
  });
  it('a linha de base (campo ausente) NÃO é level up: registra sem restaurar', () => {
    const r = applyLevelUpCelebrated({ ...base, lastCelebratedLevel: undefined }, 6);
    expect(r.lastCelebratedLevel).toBe(6);
    expect(r.energyPoints).toBe(1);
    expect(r.dungeonHp).toEqual(base.dungeonHp);
  });
});

const MARGEM_PAREDE = 5; // a antiga margem do teto: a parede medida cai +3 a +4 além da zona

describe('a PAREDE por Lv, medida no núcleo real (simulação)', () => {
  // O jogador de cada Lv parte da borda da zona de conforto (andar efetivo 1) e desce até o HP acabar.
  const N = 48;
  const parede = (L: number) => {
    let soma = 0, max = 0;
    for (let s = 0; s < N; s++) {
      const cfg = { level: L, build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[s % 4]], family: SPECIAL_FAMILIES[(s >> 2) % 7] };
      const r = simulateDungeonRunV3(cfg, s, 'media', 40, 1);
      soma += r.floorsCleared; max = Math.max(max, r.floorsCleared);
    }
    return { media: comfortLayers(L) + soma / N, max: comfortLayers(L) + max };
  };
  it('cada estágio para numa profundidade própria, e a parede fica poucas camadas além da zona de conforto', () => {
    const tabela = [1, ...STAGE_LEVEL_CAPS].map(L => ({ L, ...parede(L) }));
    console.log('[parede] ' + tabela.map(t => `Lv${t.L}: média ${t.media.toFixed(1)} · máx ${t.max}`).join(' | '));
    for (let i = 1; i < tabela.length; i++) expect(tabela[i].media).toBeGreaterThan(tabela[i - 1].media);
    for (const t of tabela) {
      expect(t.media - comfortLayers(t.L)).toBeGreaterThan(2.5); // além da zona, ainda há algumas camadas de luta de verdade
      expect(t.media - comfortLayers(t.L)).toBeLessThan(MARGEM_PAREDE + 1);
    }
  });
  it('Bits por camada seguem o andar EFETIVO: fundo não paga mais que a parede (o funil diário segue valendo)', () => {
    const porCamada = (layer: number, L: number) => {
      const f = effectiveFloor(layer, L);
      return buildDungeonWave(f, 'rookie').reduce((a, e) => a + e.points, 0) + clearBonus(f);
    };
    const maxNaParede = porCamada(MARGEM_PAREDE, 1);
    expect(porCamada(500, TOP)).toBeLessThanOrEqual(maxNaParede);
    expect(porCamada(comfortLayers(21) + MARGEM_PAREDE, 21)).toBe(maxNaParede);
  });
});

describe('REGISTRO §477: a derrota nunca rebaixa o andar', () => {
  // elemento = 2 andares (1º ímpar, 2º par); recorde = andar mais fundo LIMPO; largada = recorde + 1 (combate 1 do andar)
  it('vence os 6 do andar 1 → derrota no andar 2 → reentra no andar 2, combate 1', () => {
    expect(startLayerFor(1)).toBe(2);
    expect(startLayerFor(7)).toBe(8); // idem num elemento mais fundo (andares 7-8)
  });
  it('derrota no andar 1 (recorde = fim do elemento anterior) → reentra no andar 1 do mesmo elemento', () => {
    expect(startLayerFor(0)).toBe(1);
    expect(startLayerFor(6)).toBe(7);
  });
  it('vencer o andar 2 completa o elemento: o próximo largo é o andar 1 do elemento seguinte', () => {
    expect(startLayerFor(2)).toBe(3);
    expect(startLayerFor(8)).toBe(9);
  });
  it('save antigo (recorde ausente/lixo) comporta como sempre: andar 1; e o recorde só sobe, logo nunca rebaixa', () => {
    expect(startLayerFor(Number.NaN)).toBe(1);
    expect(startLayerFor(-5)).toBe(1);
    for (let r = 0; r < 998; r++) expect(startLayerFor(r + 1)).toBeGreaterThanOrEqual(startLayerFor(r));
  });
});
