import { describe, it, expect } from 'vitest';
import { ENEMY_ROSTER, pickEnemy } from './enemyRoster';
import { FORMAS_ART } from './enemyRosterArt';
import { essenceComposition } from './elementDex';
import { rosterSpriteOf } from './novosSoulmon';
import { mulberry32 } from './combate/rng';

/** O roster sem os 15 ramos legados (§445), que vão no FIM de tudo (o pacote A fica logo antes deles). */
const ROSTER_SEM_LEGADO = ENEMY_ROSTER.slice(0, -15);

describe('formas do pacote A: 1 por combinação no estágio dela (dono, 16/11/2026)', () => {
  const pacote = ROSTER_SEM_LEGADO.slice(-205);
  const alvo: Record<number, string> = { 2: 'champion', 3: 'ultimate', 4: 'mega' };
  it('205 entradas no fim de tudo (o #N do Bestiário não muda), kind forma, com arte própria e nome único', () => {
    expect(pacote).toHaveLength(205);
    expect(pacote.every(e => e.kind === 'forma')).toBe(true);
    expect(new Set(pacote.map(e => e.name)).size).toBe(205);
    expect(new Set(pacote.map(e => rosterSpriteOf(e))).size).toBe(205);
    const nomes = ENEMY_ROSTER.map(e => e.name);
    for (const e of pacote) {
      expect(rosterSpriteOf(e), e.key).toBe(FORMAS_ART[e.artFile!]);
      expect(nomes.filter(n => n === e.name), e.name).toHaveLength(1);
    }
  });
  it('toda combinação de 2, 3 e 4 elementos tem ao menos uma forma no estágio-alvo (champion, ultimate, mega)', () => {
    for (const k of [2, 3, 4]) {
      const elementos = new Set(ENEMY_ROSTER.filter(e => e.kind === 'combinado' && essenceComposition(e.element)?.length === k).map(e => e.element));
      for (const el of elementos) {
        expect(ENEMY_ROSTER.some(e => e.element === el && e.stage === alvo[k] && e.kind !== 'mascote'), `${el} (${k}) sem ${alvo[k]}`).toBe(true);
      }
    }
  });
  it('fora do sorteio comum: só saem com o elemento pedido', () => {
    const chaves = new Set(pacote.map(e => e.key));
    for (let seed = 1; seed <= 1500; seed++) for (const st of ['champion', 'ultimate', 'mega'] as const) {
      expect(chaves.has(pickEnemy(40, mulberry32(seed), { stage: st }).key)).toBe(false);
    }
  });
});
