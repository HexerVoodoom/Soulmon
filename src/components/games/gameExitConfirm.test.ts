import { describe, it, expect } from 'vitest';
import { gameExitConfirm } from './GameKit';

describe('gameExitConfirm — bilíngue (QA R7: EN lia "Leave do jogo?")', () => {
  it('traduz o complemento em PT dos 9 jogos para o EN', () => {
    for (const what of ['do jogo', 'da rodada', 'da corrida', 'da partida', 'do desenho']) {
      const en = gameExitConfirm(false, what).title;
      expect(en, what).toMatch(/^Leave (the game|this round|this run|this match|this puzzle)\? /);
      expect(en).not.toMatch(/\b(do|da|de)\b/);
      expect(gameExitConfirm(true, what).title).toBe(`Sair ${what}? O progresso desta partida se perde.`);
    }
  });
  it('sem complemento e com complemento já em inglês', () => {
    expect(gameExitConfirm(false).title).toBe("Leave? This game's progress will be lost.");
    expect(gameExitConfirm(false, 'this run').title).toBe("Leave this run? This game's progress will be lost.");
  });
});
