// @vitest-environment jsdom
/**
 * §198 (dono, 30/10/2026): habilidade SÓ DE BENEFÍCIO (cura, escudo, buff de ataque/velocidade) não anima ataque contra
 * o inimigo — nada de projétil, corte, investida ou impacto no alvo; só o efeito no próprio conjurador.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

vi.mock('../../utils/sounds', () => ({ playAttack: vi.fn(), playAttackRanged: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn(), playDefend: vi.fn(), playCharge: vi.fn(), playDefeat: vi.fn() }));

import { BattleStage, type StageAction, type StageFighter } from './BattleStage';
import { isSelfOnlySpecial } from '../../utils/combatFx';
import { SPECIAL_FAMILIES } from '../../utils/combate/specials';

afterEach(() => cleanup());

const me: StageFighter = { key: 'me', sprite: 'me.png', name: 'Eu', hp: 40, maxHp: 80, element: 'fogo', energy: 0.3 };
const foe: StageFighter = { key: 0, sprite: 'foe.png', name: 'Rival', hp: 30, maxHp: 60, element: 'agua' };
const base = { scene: '#123', me, foes: [foe], title: 'Arena', closeLabel: 'Sair', onClose: () => {} };
const esp = (strike: 'melee' | 'ranged', selfOnly: boolean, actor: 'me' | 'foe' = 'me'): StageAction => ({ id: 1, actor, foe: 0, kind: 'special', strike, element: 'fogo', selfOnly });
const golpe = (c: HTMLElement) => c.querySelectorAll('[data-stage-fx="sm-bs-fly"], .sm-bs-lunge').length;

describe('§198 especial só de benefício não ataca o inimigo', () => {
  it('as famílias de benefício (cura, escudo, buffs) são self-only; dano, DoT e debuff não', () => {
    expect(SPECIAL_FAMILIES.filter(isSelfOnlySpecial).sort()).toEqual(['atkBuff', 'heal', 'shield', 'spdBuff']);
  });
  for (const actor of ['me', 'foe'] as const) for (const strike of ['ranged', 'melee'] as const) {
    it(`${actor} ${strike}: com dano há golpe; só benefício não há projétil nem investida`, () => {
      const a = render(<BattleStage {...base} action={esp(strike, false, actor)} />);
      const comDano = golpe(a.container);
      cleanup();
      const b = render(<BattleStage {...base} action={esp(strike, true, actor)} />);
      expect(golpe(b.container)).toBe(0);
      expect(b.container.querySelector('[data-stage-fx="sm-bs-fly"]')).toBeNull();
      expect(comDano).toBeGreaterThan(0);
    });
  }
});
