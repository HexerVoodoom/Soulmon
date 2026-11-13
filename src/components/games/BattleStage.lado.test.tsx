// @vitest-environment jsdom
/**
 * §200 (dono, 30/10/2026): com 3 inimigos em triângulo, o da ESQUERDA olha para a direita (espelhado em relação aos outros).
 * Selos de status (dono, 13/11/2026; substitui o §197): debuff em cima à esquerda do sprite, buff embaixo à direita, em
 * FILEIRA, maiores (proporcionais ao sprite) — o detalhe da ordem e do z mora em `BattleStage.status.test.tsx`.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

vi.mock('../../utils/sounds', () => ({ playAttack: vi.fn(), playAttackRanged: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn(), playDefend: vi.fn(), playCharge: vi.fn(), playDefeat: vi.fn() }));

import { BattleStage, foeFacesRight, stageLayout, stageStatusIconSize, statusRowPlacement, STAGE_STATUS_ICON_MAX, STAGE_STATUS_ICON_MIN, type StageFighter } from './BattleStage';

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

describe('selos de status: zona por tipo, fileira, tamanho proporcional (dono, 13/11/2026)', () => {
  it('cada zona é uma FILEIRA (nunca coluna); o DoT do inimigo é debuff e o buff do pet é buff', () => {
    const { container } = render(<BattleStage scene="#123" me={me} foes={[foe(0)]} title="Arena" closeLabel="Sair" onClose={() => {}} />);
    const rows = [...container.querySelectorAll<HTMLElement>('[data-stage-status-row]')];
    expect(rows.map((r) => [r.dataset.stageStatusSide, r.dataset.stageStatusZone])).toEqual([['foe', 'debuff'], ['me', 'buff']]);
    for (const r of rows) {
      expect(r.style.transform).toBe('');
      expect(r.style.flexDirection).not.toBe('column');
    }
    expect(rows[0].style.flexDirection).toBe('row-reverse'); // inimigo: da direita para a esquerda
    expect(rows[1].style.flexDirection).toBe('row'); // pet: da esquerda para a direita
  });

  it('o tamanho segue o sprite (26%), entre o piso e o teto; bem maior que o selo antigo de 22 px', () => {
    expect(stageStatusIconSize({ x: 0, y: 0, size: 152 })).toBe(40); // um inimigo num campo de 360 px (o print do dono)
    expect(stageStatusIconSize({ x: 0, y: 0, size: 230 })).toBe(STAGE_STATUS_ICON_MAX);
    expect(stageStatusIconSize({ x: 0, y: 0, size: 60 })).toBe(STAGE_STATUS_ICON_MIN);
    expect(STAGE_STATUS_ICON_MIN).toBeGreaterThan(22);
    const { container } = render(<BattleStage scene="#123" me={me} foes={[foe(0)]} title="Arena" closeLabel="Sair" onClose={() => {}} />);
    for (const chip of container.querySelectorAll<HTMLElement>('[data-stage-status]')) {
      const px = parseFloat(chip.style.width);
      expect(px).toBeGreaterThanOrEqual(STAGE_STATUS_ICON_MIN);
      expect(chip.style.height).toBe(chip.style.width);
    }
  });

  it('geometria: debuff no canto de cima à esquerda, buff no canto de baixo à direita, dos dois lados', () => {
    const l = stageLayout(360, 560, 1);
    for (const [side, spot] of [['foe', l.foes[0]], ['me', l.me]] as const) {
      const top = spot.y - spot.size * 0.94;
      const d = statusRowPlacement(spot, side, 'debuff', 1, 360, 560);
      const b = statusRowPlacement(spot, side, 'buff', 1, 360, 560);
      expect(d.left + d.width / 2, `${side} debuff à esquerda do centro`).toBeLessThan(spot.x);
      expect(b.left + b.width / 2, `${side} buff à direita do centro`).toBeGreaterThan(spot.x);
      expect(d.top, `${side} debuff no alto do sprite`).toBeLessThan(top + spot.size * 0.25);
      expect(b.top, `${side} buff embaixo`).toBeGreaterThan(d.top + spot.size * 0.3);
    }
  });

  it('a fileira nunca sai do campo: o inimigo da esquerda (triângulo) e o pet colado na borda crescem para dentro', () => {
    const l = stageLayout(360, 560, 3);
    for (const spot of l.foes) for (const zone of ['debuff', 'buff'] as const) {
      const p = statusRowPlacement(spot, 'foe', zone, 3, 360, 560);
      expect(p.left).toBeGreaterThanOrEqual(2);
      expect(p.left + p.width).toBeLessThanOrEqual(358);
    }
    const pb = statusRowPlacement(l.me, 'me', 'buff', 3, 360, 560);
    expect(pb.left + pb.width).toBeLessThanOrEqual(358);
    expect(pb.top + pb.icon).toBeLessThanOrEqual(558); // o pet pisa abaixo do campo; os buffs dele não descem sobre o HUD
  });
});
