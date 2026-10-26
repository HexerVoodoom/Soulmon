// @vitest-environment jsdom
/** BATTLE STAGE — ícone do ELEMENTO ao lado do bloco de barras (dono, 26/10/2026): fora do bloco, pelado, EN/PT, id sem arte = nada. */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { BattleStage, type StageFighter } from './BattleStage';

afterEach(cleanup);
const me: StageFighter = { key: 'me', sprite: 'me.png', name: 'Eu', hp: 40, maxHp: 80, element: 'fogo' };
const foe = (element: string): StageFighter => ({ key: 0, sprite: 'foe.png', name: 'Rival', hp: 30, maxHp: 60, element });
const base = { scene: 'url(x.png) center/cover #123', title: 'Duelo', closeLabel: 'Sair', onClose: () => {} };

describe('ícone de elemento no painel do combatente', () => {
  it('jogador e oponente têm o ícone FORA do bloco, com nome em EN e PT', () => {
    for (const [isPt, fogo, agua] of [[false, 'Fire', 'Water'], [true, 'Fogo', 'Água']] as const) {
      const { unmount } = render(<BattleStage {...base} isPt={isPt} me={me} foes={[foe('agua')]} />);
      const icons = [...document.querySelectorAll('[data-stage-element]')];
      expect(icons.map(i => i.getAttribute('aria-label'))).toEqual([agua, fogo]);
      for (const i of icons) {
        expect(i.closest('[data-stage-plate]')).toBeNull();
        expect(i.parentElement?.hasAttribute('data-stage-bars-row')).toBe(true);
      }
      unmount();
    }
  });
  it('elemento desconhecido: sem ícone e o bloco continua', () => {
    render(<BattleStage {...base} me={me} foes={[foe('nao-existe')]} />);
    expect(document.querySelectorAll('[data-stage-element]').length).toBe(1);
    expect(document.querySelectorAll('[data-stage-plate]').length).toBe(2);
  });
});
