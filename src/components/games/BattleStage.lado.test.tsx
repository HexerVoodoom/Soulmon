// @vitest-environment jsdom
/**
 * §197 e §200 (dono, 30/10/2026):
 *  - o selo de buff/DoT fica DE LADO, no canto de cima do Soulmon (ao lado da cabeça), pequeno — substituído em §326: o selo
 *    com contador saiu e o marcador no canto do sprite é a única leitura do efeito;
 *  - com 3 inimigos em triângulo, o da ESQUERDA olha para a direita (espelhado em relação aos outros).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';

vi.mock('../../utils/sounds', () => ({ playAttack: vi.fn(), playAttackRanged: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn(), playDefend: vi.fn(), playCharge: vi.fn(), playDefeat: vi.fn() }));

import { BattleStage, foeFacesRight, stageLayout, stageBarsRect, stageFxMarkSize, fxMarkRowPlacement, STAGE_FX_MARK_MAX, STAGE_FX_MARK_MIN, type StageFighter } from './BattleStage';

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

describe('§326 o efeito aparece UMA vez: só o marcador no canto do sprite, sem o selo com contador ao lado da barra', () => {
  it('nenhuma coluna de selos nem selo com turnos; o pet e cada inimigo ficam só com o marcador', async () => {
    const { container } = render(<BattleStage scene="#123" me={me} foes={[foe(0)]} title="Arena" closeLabel="Sair" onClose={() => {}} />);
    await waitFor(() => expect(container.querySelectorAll('[data-stage-fx-mark]').length).toBe(2), { timeout: 10_000 });
    expect(container.querySelector('[data-stage-status-row]')).toBeNull();
    expect(container.querySelector('[data-stage-status]')).toBeNull();
    expect([...container.querySelectorAll('[data-stage-fx-mark]')].map((m) => m.getAttribute('data-stage-fx-mark')).sort()).toEqual(['buff', 'dot']);
  });
});

describe('marcadores de efeito: canto, borda do sprite, nunca sob a caixa de HP (dono, 13/11/2026)', () => {
  const telas: Array<[number, number]> = [[320, 480], [360, 500], [360, 560], [360, 640], [393, 660], [412, 720], [430, 760]];
  const cruza = (a: { left: number; top: number; width: number; height: number }, b: typeof a) =>
    a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height;

  it('tamanho: ~40 px num inimigo sozinho (o que o dono marcou), 28 px com 3 inimigos, até 44 px no pet', () => {
    expect(stageFxMarkSize({ x: 0, y: 0, size: 152 })).toBe(40);
    expect(stageFxMarkSize({ x: 0, y: 0, size: 115 }, true)).toBe(STAGE_FX_MARK_MIN);
    expect(STAGE_FX_MARK_MIN).toBe(28);
    expect(stageFxMarkSize({ x: 0, y: 0, size: 230 })).toBe(STAGE_FX_MARK_MAX);
  });

  it('em toda contagem (1, 2 e 3 inimigos; 1 a 3 marcadores + "+k"; 7 telas): começa na borda do sprite, cresce para a outra, cabe na altura do sprite e não cruza nenhuma caixa de HP/especial', () => {
    let n0 = 0;
    for (const [w, h] of telas) for (const nf of [1, 2, 3]) {
      const l = stageLayout(w, h, nf);
      const caixas = [...l.foes.map((s) => stageBarsRect(s, 'gold', true, l.barsH, w)), stageBarsRect(l.me, 'cyan', true, l.barsH, w)];
      for (const [side, s] of [...l.foes.map((f) => ['foe', f] as const), ['me', l.me] as const]) for (const zone of ['debuff', 'buff'] as const) for (const n of [1, 2, 3, 4]) {
        const p = fxMarkRowPlacement(s, side, zone, n, { crowded: side === 'foe' && nf >= 3, avoid: caixas, fieldW: w, fieldH: h });
        const tag = `${w}x${h} ${nf} inimigo(s) ${side}@${s.x} ${zone} n=${n}`;
        const r = { left: p.left, top: p.top, width: p.width, height: p.icon };
        expect(p.fits, tag).toBe(true);
        for (const c of caixas) expect(cruza(r, c), `${tag} cruza a caixa ${JSON.stringify(c)}`).toBe(false);
        // a borda: debuff encosta na esquerda do sprite, buff na direita (só a borda do campo empurra)
        const borda = zone === 'debuff' ? Math.max(2, Math.round(s.x - s.size / 2)) : Math.min(w - 2, Math.round(s.x + s.size / 2));
        const ancora = zone === 'debuff' ? p.left : p.left + p.width;
        if (zone === 'debuff' ? borda + p.width <= w - 2 : borda - p.width >= 2) expect(Math.abs(ancora - borda), `${tag} borda`).toBeLessThanOrEqual(1);
        expect(p.left, tag).toBeGreaterThanOrEqual(2);
        expect(p.left + p.width, tag).toBeLessThanOrEqual(w - 2);
        expect(p.dir).toBe(side === 'foe' ? 'row-reverse' : 'row');
        n0++;
      }
    }
    expect(n0).toBe(telas.length * (2 + 3 + 4) * 2 * 4);
  });
});
