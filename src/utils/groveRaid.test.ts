/** §204: a luta do Bosque — formação, determinismo, desfecho, elementos e arte com placeholder. */
import { describe, expect, it } from 'vitest';
import { GROVE_RAID_FOES, groveRaidLineup, groveRaidOutcome, groveRaidRound, simulateGroveRaid } from './groveRaid';
import { GROVE_RAIDERS, BARRAGE_ROSTER, TEMA_INIMIGOS } from './temaInimigos';
import { ENEMY_ROSTER } from './enemyRoster';
import { SPRITE_ELEMENT } from './spriteElement';
import { NOVOS_DATA } from './novosSoulmonData';
import { placeholderOf, temaSpriteOf } from './temaInimigosArt';
import { combatantAt, REFERENCE_BUILDS } from './combate/level';
import { playSequence } from './dungeonFight';

const cfg = (level: number) => ({ combatant: combatantAt(level, REFERENCE_BUILDS.balanced), family: 'direct' as const });

describe('groveRaid', () => {
  it('formação: 3 pragas distintas do Bosque, a 3ª é champion, determinística pela semente', () => {
    for (let s = 1; s < 50; s++) {
      const l = groveRaidLineup(s);
      expect(l).toHaveLength(GROVE_RAID_FOES);
      expect(new Set(l.map(e => e.id)).size).toBe(3);
      expect(l.every(e => GROVE_RAIDERS.includes(e))).toBe(true);
      expect(l[2].stage).toBe('champion');
      expect(groveRaidLineup(s)).toEqual(l);
    }
  });

  it('a rodada tem 3 inimigos e a luta é determinística (mesma semente = mesmo resultado)', () => {
    expect(groveRaidRound(cfg(10), 7).foes).toHaveLength(3);
    for (const s of [1, 2, 99, 12345]) expect(simulateGroveRaid(cfg(10), s)).toEqual(simulateGroveRaid(cfg(10), s));
  });

  it('é uma luta FÁCIL: com anel bom, o jogador vence a grande maioria em todo level', () => {
    for (const L of [1, 10, 25]) {
      let w = 0;
      for (let s = 0; s < 60; s++) if (simulateGroveRaid(cfg(L), s * 31 + 1).winner === 'player') w++;
      expect(w / 60, `level ${L}`).toBeGreaterThan(0.6);
    }
  });

  it('não é mais fácil que a defesa antiga jogada em sequência a ponto de nunca perder com anel ruim e sem esquiva', () => {
    const old = playSequence({ level: 10, build: REFERENCE_BUILDS.balanced, family: 'direct' }, [0, 1, 2].map(slot => ({ slot, floor: 1 })), 3);
    expect(typeof old.won).toBe('boolean');
    const r = simulateGroveRaid(cfg(10), 3, 'ruim', 'nada');
    expect(['player', 'foes', 'draw']).toContain(r.winner);
  });

  it('desfecho: só vitória protege; perder custa zero', () => {
    expect(groveRaidOutcome({ winner: 'player' })).toEqual({ protects: true, cost: 0 });
    expect(groveRaidOutcome({ winner: 'foes' } as never)).toEqual({ protects: false, cost: 0 });
  });
});

describe('inimigos temáticos', () => {
  it('cada criatura tem UM elemento base, golpes próprios e chave tema: no SPRITE_ELEMENT', () => {
    const bases = new Set(NOVOS_DATA.map(n => n.element));
    for (const e of TEMA_INIMIGOS) {
      expect(bases.has(e.element), e.id).toBe(true);
      expect(SPRITE_ELEMENT[`tema:${e.id}`]).toBe(e.element);
      expect(e.basico.en && e.especial.en && e.basico.pt && e.especial.pt).toBeTruthy();
    }
    expect(new Set(TEMA_INIMIGOS.map(e => e.id)).size).toBe(TEMA_INIMIGOS.length);
  });

  it('a Barrage renovada é só espaço, com rookie/champion/ultimate; nenhum temático entra no ENEMY_ROSTER', () => {
    expect(BARRAGE_ROSTER.every(e => e.element === 'espaco')).toBe(true);
    expect(new Set(BARRAGE_ROSTER.map(e => e.stage))).toEqual(new Set(['rookie', 'champion', 'ultimate']));
    const keys = new Set(ENEMY_ROSTER.map(e => e.key));
    expect(TEMA_INIMIGOS.some(e => keys.has(e.key))).toBe(false);
  });

  it('sem arte própria, o sprite é o placeholder da base do MESMO elemento', () => {
    for (const e of TEMA_INIMIGOS) {
      const src = temaSpriteOf(e);
      expect(src, e.id).toBeTruthy();
      expect(placeholderOf(e)).toBeTruthy();
    }
  });
});
