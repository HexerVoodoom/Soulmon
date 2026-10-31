/**
 * O CORVO NEUTRO (dono, 31/10/2026, REGISTRO §206): a ÚNICA criatura `neutro`, 1/1000 por sorteio de inimigo, pelo portão central
 * `withRaven`. E o bug do "Embrit de fogo com elemento neutro / fora da Biblioteca" (inimigo sem `element` com chave do roster).
 */
import { describe, expect, it } from 'vitest';
import { ENEMY_ROSTER, RAVEN_ENTRY, RAVEN_SPAWN_CHANCE, pickEnemy, withRaven } from './enemyRoster';
import { rosterEntryElement, SPRITE_ELEMENT } from './spriteElement';
import { dungeonEnemyElement, fxElementId } from './combatFx';
import { buildArenaRound, arenaFoeKey } from './arena';
import { mulberry32 } from './combate/rng';
import { strayForTournament } from './strayFoes';

describe('corvo neutro', () => {
  it('nenhuma entrada do roster nem sprite é neutra, exceto o corvo', () => {
    const neutros = ENEMY_ROSTER.filter(e => rosterEntryElement(e) === 'neutro' || fxElementId(rosterEntryElement(e)) === 'neutro');
    expect(neutros.map(e => e.key)).toEqual([RAVEN_ENTRY.key]);
    expect(Object.entries(SPRITE_ELEMENT).filter(([, el]) => el === 'neutro').map(([k]) => k)).toEqual(['mascote:corvo']);
  });

  it('bug 31/10: inimigo de masmorra sem `element` com chave do roster (Embrit) resolve fogo, não neutro', () => {
    expect(dungeonEnemyElement({ stage: 'embrit-rookie' })).toBe('fogo');
    expect(dungeonEnemyElement({ stage: 'corvo-rookie' })).toBe('neutro');
  });

  it('Arena: todo inimigo tem chave de bestiário (vai para a Biblioteca)', () => {
    for (let s = 1; s < 200; s++) for (let r = 1; r <= 5; r++) {
      for (const e of buildArenaRound(r, 1, mulberry32(s), undefined, false, false, 'fogo')) {
        if (e.form !== 'ultra') expect(arenaFoeKey(e)).toBeTruthy();
      }
    }
  });

  it('withRaven: ~0,1% com RNG semeado e não muda a sequência de sorteios', () => {
    const N = 400_000;
    const rng = mulberry32(12345);
    let hits = 0;
    for (let i = 0; i < N; i++) if (withRaven(rng, r => r(), () => -1) === -1) hits++;
    expect(hits / N).toBeGreaterThan(RAVEN_SPAWN_CHANCE * 0.85);
    expect(hits / N).toBeLessThan(RAVEN_SPAWN_CHANCE * 1.15);
    const a = mulberry32(7), b = mulberry32(7);
    withRaven(a, r => r() + r(), () => 0); b(); b();
    expect(a()).toBe(b());
  });

  it('pickEnemy (masmorra, Combina 3, PvP): o corvo é o único neutro e sai ~1/1000', () => {
    const rng = mulberry32(99);
    const N = 200_000;
    let corvo = 0;
    for (let i = 0; i < N; i++) {
      const e = pickEnemy(30, rng);
      const el = rosterEntryElement(e);
      if (e.key === RAVEN_ENTRY.key) corvo++;
      else expect(el).not.toBe('neutro');
    }
    expect(corvo / N).toBeGreaterThan(0.0007);
    expect(corvo / N).toBeLessThan(0.0013);
  });

  it('Arena: o corvo só aparece pelo portão, ~1/1000 por inimigo', () => {
    let n = 0, corvo = 0;
    for (let s = 1; s < 30_000; s++) for (const e of buildArenaRound(2, 1, mulberry32(s), undefined, false, false, 'agua')) {
      n++;
      if (e.element === 'neutro') { corvo++; expect(arenaFoeKey(e)).toBe(RAVEN_ENTRY.key); }
    }
    expect(corvo / n).toBeGreaterThan(0.0006);
    expect(corvo / n).toBeLessThan(0.0015);
  });

  it('Torneio (Desgarrado do dia) passa pelo portão', () => {
    let corvo = 0;
    for (let d = 0; d < 20_000; d++) if (strayForTournament(`s${d}`, '2026-10-31').key === RAVEN_ENTRY.key) corvo++;
    expect(corvo).toBeGreaterThan(5);
    expect(corvo).toBeLessThan(45);
  });
});
