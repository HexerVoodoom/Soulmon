// @vitest-environment jsdom
/**
 * §197 e §200 (dono, 30/10/2026):
 *  - o selo de buff/DoT fica DE LADO, no canto de cima do Soulmon (ao lado da cabeça), pequeno — nunca centrado em cima dele;
 *  - com 3 inimigos em triângulo, o da ESQUERDA olha para a direita (espelhado em relação aos outros).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

vi.mock('../../utils/sounds', () => ({ playAttack: vi.fn(), playAttackRanged: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn(), playDefend: vi.fn(), playCharge: vi.fn(), playDefeat: vi.fn() }));

import { BattleStage, foeFacesRight, stageLayout, STAGE_STATUS_ICON, type StageFighter } from './BattleStage';

afterEach(() => cleanup());

const me: StageFighter = { key: 'me', sprite: 'me.png', name: 'Eu', hp: 40, maxHp: 80, element: 'fogo', energy: 0.3, status: [{ kind: 'buff', variant: 'atk', turns: 2 }] };
const foe = (k: number): StageFighter => ({ key: k, sprite: `foe${k}.png`, name: `R${k}`, hp: 30, maxHp: 60, element: 'agua', status: [{ kind: 'dot', turns: 3 }] });

describe('§200 triângulo: o inimigo da esquerda olha para a direita', () => {
  it('só o da esquerda (à esquerda do jogador) com 3 inimigos; com 1 ou 2 nenhum', () => {
    const l3 = stageLayout(360, 560, 3);
    expect([0, 1, 2].map((i) => foeFacesRight(l3, i))).toEqual([false, false, true]);
    for (const n of [1, 2]) { const l = stageLayout(360, 560, n); expect(l.foes.map((_, i) => foeFacesRight(l, i)).some(Boolean)).toBe(false); }
  });
  it('na cena: o sprite dele vira para a direita, os outros seguem para a esquerda', () => {
    const { container } = render(<BattleStage scene="#123" me={me} foes={[foe(0), foe(1), foe(2)]} title="Arena" closeLabel="Sair" onClose={() => {}} />);
    const faces = [...container.querySelectorAll('[data-stage-sprite="foe"]')].map((e) => e.getAttribute('data-stage-faces'));
    expect(faces).toEqual(['left', 'left', 'right']);
  });
});

describe('§197 selo de status de lado, pequeno', () => {
  it('a coluna dos selos fica à DIREITA do centro do sprite, na altura da cabeça; cada selo tem o tamanho da constante', () => {
    const { container } = render(<BattleStage scene="#123" me={me} foes={[foe(0)]} title="Arena" closeLabel="Sair" onClose={() => {}} />);
    const rows = [...container.querySelectorAll<HTMLElement>('[data-stage-status-row]')];
    expect(rows.length).toBe(2);
    for (const r of rows) {
      expect(r.style.transform).toBe(''); // não sobe centrado acima das barras
      expect(r.style.flexDirection).toBe('column');
    }
    for (const chip of container.querySelectorAll<HTMLElement>('[data-stage-status]')) {
      expect(chip.style.width).toBe(`${STAGE_STATUS_ICON}px`);
      expect(chip.style.height).toBe(`${STAGE_STATUS_ICON}px`);
    }
  });
});
