// Masmorra: coerência estágio × HP (dono, 11/11/2026). A regra da Arena (`estagioPorHp.ts`) vale para o inimigo da Masmorra:
// a forma exibida nunca fica abaixo da faixa do HP que ele tem (a forma só sobe); o roster não tem arte de Ultra, então o teto é Mega.
import { describe, it, expect } from 'vitest';
import { buildDungeonWave } from './dungeon';
import { mulberry32 } from './combate/rng';
import { FOE_STAGES, stageForFoeHp } from './estagioPorHp';
import { hpPoints } from './combate/fight';

const rank = (e: { stage: string }) => FOE_STAGES.indexOf(e.stage.split('-').pop() as never);

describe('Masmorra: estágio acompanha o HP', () => {
  it('varredura levels × andares × slots: HP alto nunca aparece em estágio baixo', () => {
    for (let lv = 1; lv <= 70; lv++) for (const floor of [1, 3, 6]) {
      const wave = buildDungeonWave(floor, 'mega', mulberry32(lv * 31 + floor), lv);
      for (const e of wave) {
        if (e.stage.startsWith('corvo-')) continue; // portão do corvo (1/1000): o mascote só tem arte rookie, como na Arena
        const piso = Math.min(FOE_STAGES.indexOf('mega'), FOE_STAGES.indexOf(stageForFoeHp(e.foe.combatant.hp)));
        expect(rank(e), `lv ${lv} andar ${floor} slot ${e.slot} (${Math.round(hpPoints(e.foe.combatant.hp))} pts, ${e.stage})`).toBeGreaterThanOrEqual(piso);
      }
    }
  });
  it('o bug do dono: nível 30, slot 0, ~3.800 pts não é mais Rookie', () => {
    const e = buildDungeonWave(1, 'mega', mulberry32(5), 30)[0];
    expect(hpPoints(e.foe.combatant.hp)).toBeGreaterThan(3500);
    expect(e.stage.endsWith('-mega')).toBe(true);
  });
  it('a forma só sobe com o level (monotônica) e o HP em si não muda', () => {
    let prev = 0;
    for (let lv = 1; lv <= 70; lv++) { const r = rank(buildDungeonWave(2, 'mega', mulberry32(9), lv)[0]); expect(r).toBeGreaterThanOrEqual(prev); prev = r; }
  });
  it('level baixo continua rookie (nada muda onde a escada já era coerente)', () => {
    for (let seed = 1; seed <= 20; seed++) expect(buildDungeonWave(1, 'rookie', mulberry32(seed), 1).every(e => e.stage.endsWith('-rookie'))).toBe(true);
  });
});
