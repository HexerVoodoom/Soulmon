// @vitest-environment jsdom
/**
 * §197 e §200 (dono, 30/10/2026):
 *  - o selo de buff/DoT fica DE LADO, no canto de cima do Soulmon (ao lado da cabeça), pequeno — substituído em §331: o selo
 *    com contador saiu e o marcador no canto do sprite é a única leitura do efeito;
 *  - com 3 inimigos em triângulo, o da ESQUERDA olha para a direita (espelhado em relação aos outros).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';

vi.mock('../../utils/sounds', () => ({ playAttack: vi.fn(), playAttackRanged: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn(), playDefend: vi.fn(), playCharge: vi.fn(), playDefeat: vi.fn() }));

import { BattleStage, foeFacesRight, stageLayout, stageBarsRect, stageFxMarkSize, fxMarkRowPlacement, fxMarkIconSize, fxMarkAnchor, STAGE_FX_MARK_MAX, STAGE_FX_MARK_MIN, type StageFighter } from './BattleStage';

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

describe('§331 o efeito aparece UMA vez: só o marcador no canto do sprite, sem o selo com contador ao lado da barra', () => {
  it('nenhuma coluna de selos nem selo com turnos; o pet e cada inimigo ficam só com o marcador', async () => {
    const { container } = render(<BattleStage scene="#123" me={me} foes={[foe(0)]} title="Arena" closeLabel="Sair" onClose={() => {}} />);
    await waitFor(() => expect(container.querySelectorAll('[data-stage-fx-mark]').length).toBe(2), { timeout: 10_000 });
    expect(container.querySelector('[data-stage-status-row]')).toBeNull();
    expect(container.querySelector('[data-stage-status]')).toBeNull();
    expect([...container.querySelectorAll('[data-stage-fx-mark]')].map((m) => m.getAttribute('data-stage-fx-mark')).sort()).toEqual(['buff', 'dot']);
  });
});

describe('§328 marcadores de efeito: canto por lado, 1º na borda, ~17% do campo, nunca sob a caixa de HP (dono, 13/11/2026)', () => {
  const telas: Array<[number, number]> = [[320, 480], [360, 500], [360, 560], [360, 640], [393, 660], [412, 720], [430, 760]];
  const cruza = (a: { left: number; top: number; width: number; height: number }, b: typeof a) =>
    a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height;

  it('a borda de partida: inimigo debuff à esquerda e buff à direita; o seu Soulmon espelhado', () => {
    expect(fxMarkAnchor('foe', 'debuff')).toBe('left');
    expect(fxMarkAnchor('foe', 'buff')).toBe('right');
    expect(fxMarkAnchor('me', 'debuff')).toBe('right');
    expect(fxMarkAnchor('me', 'buff')).toBe('left');
  });

  it('tamanho: ~17% da largura do campo (PR #877: ~70% maior que os 10% marcados; ~61 px em 360), entre 24 e 75', () => {
    expect(stageFxMarkSize(360)).toBe(61);
    expect(stageFxMarkSize(320)).toBe(54);
    expect(stageFxMarkSize(393)).toBe(67);
    expect(stageFxMarkSize(412)).toBe(70);
    expect(stageFxMarkSize(430)).toBe(73);
    expect(stageFxMarkSize(100)).toBe(STAGE_FX_MARK_MIN);
    expect(stageFxMarkSize(900)).toBe(STAGE_FX_MARK_MAX);
    expect(STAGE_FX_MARK_MIN).toBe(24);
    expect(STAGE_FX_MARK_MAX).toBe(75);
  });

  /**
   * Onde os 3 marcadores no tamanho cheio não cabem (medido, 7 telas × 1–3 inimigos): só o inimigo do MEIO com 3
   * inimigos (as caixas de HP dos vizinhos apertam) e o 2º inimigo com 2 inimigos em 360×500. Chave = `tela nf índice`.
   */
  const ENCOLHE: Record<string, number> = {
    '320x480 3 1': 46, '360x500 2 1': 59, '360x500 3 1': 48, '360x560 3 1': 55, '360x640 3 1': 56,
    '393x660 3 1': 64, '412x720 3 1': 66, '430x760 3 1': 68,
  };

  it('em toda contagem (1, 2 e 3 inimigos; 1 a 3 marcadores; 7 telas): o 1º na borda do sprite, os seguintes para dentro, dentro do campo, sem cruzar caixa de HP/especial, o MESMO tamanho com 1 ou 3 inimigos', () => {
    let n0 = 0;
    for (const [w, h] of telas) for (const nf of [1, 2, 3]) {
      const l = stageLayout(w, h, nf);
      const caixas = [...l.foes.map((s) => stageBarsRect(s, 'gold', true, l.barsH, w)), stageBarsRect(l.me, 'cyan', true, l.barsH, w)];
      for (const [side, s] of [...l.foes.map((f) => ['foe', f] as const), ['me', l.me] as const]) {
        const icon = fxMarkIconSize(s, side, { avoid: caixas, fieldW: w, fieldH: h });
        // o alvo cheio (17% do campo), exceto onde está na tabela ENCOLHE; e encolhe SÓ o necessário: 1 px a mais não cabe
        const idx = side === 'me' ? -1 : l.foes.indexOf(s);
        expect(icon, `${w}x${h} ${nf} ${side}${idx}`).toBe(ENCOLHE[`${w}x${h} ${nf} ${idx}`] ?? stageFxMarkSize(w));
        if (icon < stageFxMarkSize(w)) {
          const maior = (['debuff', 'buff'] as const).every((z) => fxMarkRowPlacement(s, side, z, 3, { icon: icon + 1, avoid: caixas, fieldW: w, fieldH: h }).fits);
          expect(maior, `${w}x${h} ${nf} ${side}${idx} +1 px`).toBe(false);
        }
        for (const zone of ['debuff', 'buff'] as const) for (const n of [1, 2, 3]) {
          const p = fxMarkRowPlacement(s, side, zone, n, { icon, avoid: caixas, fieldW: w, fieldH: h });
          const tag = `${w}x${h} ${nf} inimigo(s) ${side}@${s.x} ${zone} n=${n}`;
          const r = { left: p.left, top: p.top, width: p.width, height: p.icon };
          expect(p.fits, tag).toBe(true);
          for (const c of caixas) expect(cruza(r, c), `${tag} cruza a caixa ${JSON.stringify(c)}`).toBe(false);
          // a borda: o 1º marcador encosta na borda do sprite que o dono marcou (só a borda do campo empurra)
          const anchor = fxMarkAnchor(side, zone);
          expect(p.anchor, tag).toBe(anchor);
          expect(p.dir, tag).toBe(anchor === 'left' ? 'row' : 'row-reverse');
          const borda = anchor === 'left' ? Math.max(2, Math.round(s.x - s.size / 2)) : Math.min(w - 2, Math.round(s.x + s.size / 2));
          const ponta = anchor === 'left' ? p.left : p.left + p.width;
          if (anchor === 'left' ? borda + p.width <= w - 2 : borda - p.width >= 2) expect(Math.abs(ponta - borda), `${tag} borda`).toBeLessThanOrEqual(1);
          // cima/baixo: debuff na metade de cima do sprite, buff na de baixo
          const meio = s.y - s.size * 0.47;
          if (zone === 'debuff') expect(p.top, tag).toBeLessThan(meio);
          else expect(p.top + p.icon, tag).toBeGreaterThan(Math.min(meio, h - 2));
          expect(p.left, tag).toBeGreaterThanOrEqual(2);
          expect(p.left + p.width, tag).toBeLessThanOrEqual(w - 2);
          n0++;
        }
      }
    }
    expect(n0).toBe(telas.length * (2 + 3 + 4) * 2 * 3);
  });
});
