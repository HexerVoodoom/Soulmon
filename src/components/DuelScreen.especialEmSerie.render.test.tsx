// @vitest-environment jsdom
/**
 * ESPECIAIS EM SÉRIE no Duelo (11/10/2026, pedido do dono): "quando há dois especiais muito próximos, um atrapalha o
 * outro: enquanto rola um especial, PARE os ataques dos dois e retome depois. Especiais são usados UM DE CADA VEZ."
 *
 * O núcleo roda de VERDADE (`simulatePvp` com a ficha do servidor); só a CENA é um espião que registra, a cada render,
 * a ação e o número de dano em curso e QUANDO (relógio falso). Mede ordem e pausa; nunca matemática — a luta
 * (eventos, resultado, paridade) é a mesma de antes, o que há de novo é só o relógio de EXIBIÇÃO.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';

const reg = vi.hoisted(() => ({ linhas: [] as Array<{ t: number; action: any; hit: any }> }));
vi.mock('../utils/sounds', () => ({ playAttack: vi.fn(), playAttackRanged: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn() }));
vi.mock('./games/BattleStage', () => ({
  BATTLE_LAYER_STYLE: {},
  BattleStage: (p: { action: any; hit: any }) => { reg.linhas.push({ t: performance.now(), action: p.action, hit: p.hit }); return null; },
}));

import { DuelScreen } from './DuelScreen';
import { simulatePvp, type DuelSide } from '../utils/combate/duel';
import { duelSide } from '../../functions/api/_duel.js';
import { specialLeadMs, specialTailMs } from '../utils/combatFx';

afterEach(() => { cleanup(); vi.useRealTimers(); reg.linhas.length = 0; });

const lado = (perfectDays = 3): DuelSide => duelSide({ evolutionStage: 'rookie', perfectDays }) as unknown as DuelSide;

/** Uma semente em que os DOIS lados soltam o especial com menos de `maxDifS` segundos entre si, antes do 1º nocaute. */
function sementeComDoisEspeciaisProximos(maxDifS: number): number {
  for (let s = 1; s < 6000; s++) {
    const ev = simulatePvp({ me: lado(), opp: lado(), seed: s, taps: [] }).events;
    const ko = ev.findIndex(e => e.kind === 'ko');
    const casts = ev.slice(0, ko < 0 ? ev.length : ko).filter(e => e.kind === 'cast');
    for (let i = 1; i < casts.length; i++) if (casts[i].side !== casts[i - 1].side && casts[i].t - casts[i - 1].t < maxDifS) return s;
  }
  throw new Error('nenhuma semente com dois especiais próximos');
}

function lutar(seed: number) {
  vi.useFakeTimers();
  const onDone = vi.fn();
  render(<DuelScreen me={lado()} opp={lado()} seed={seed} petSprite="" oppSprite="" petName="Pet" oppName="Rival" isPt={false} petElement="fogo" oppElement="agua" onDone={onDone} onClose={() => {}} />);
  for (let i = 0; i < 6000 && !onDone.mock.calls.length; i++) act(() => { vi.advanceTimersByTime(25); });
  return onDone;
}

/** As MUDANÇAS de ação (id novo) e de número de dano (id novo), com o instante em que o espião as viu. */
function linhaDoTempo() {
  const acoes: Array<{ t: number; id: number; kind: string; actor: string }> = [];
  const hits: Array<{ t: number; id: number; big: boolean }> = [];
  let ultimaAcao = -1; let ultimoHit = -1;
  for (const l of reg.linhas) {
    if (l.action && l.action.id !== ultimaAcao) { ultimaAcao = l.action.id; acoes.push({ t: l.t, id: l.action.id, kind: l.action.kind, actor: l.action.actor }); }
    const h = Array.isArray(l.hit) ? l.hit[0] : l.hit;
    if (h && h.id !== ultimoHit) { ultimoHit = h.id; hits.push({ t: l.t, id: h.id, big: !!h.big }); }
  }
  return { acoes, hits };
}

const LEAD = specialLeadMs(false);
const TAIL = specialTailMs(false);
const FOLGA = 120; // 2 ticks de 50 ms + o passo de 25 ms do relógio falso

describe('Duelo — um especial de cada vez, e a luta PARA enquanto ele rola', () => {
  const seed = sementeComDoisEspeciaisProximos(2.5);

  it('depois da largada de um especial, NENHUM golpe novo (de nenhum lado) começa até o fim da cena + a cauda', () => {
    lutar(seed);
    const { acoes } = linhaDoTempo();
    const especiais = acoes.filter(a => a.kind === 'special');
    expect(especiais.length).toBeGreaterThanOrEqual(2);
    for (const esp of especiais) {
      const seguinte = acoes.find(a => a.t > esp.t);
      if (!seguinte) continue;
      expect(seguinte.t - esp.t, `a ação ${seguinte.id} (${seguinte.kind}) começou ${Math.round(seguinte.t - esp.t)} ms depois do especial ${esp.id} — a janela é ${LEAD + TAIL} ms`).toBeGreaterThanOrEqual(LEAD + TAIL - FOLGA);
    }
  });

  it('os dois especiais PRÓXIMOS saem em SÉRIE: o 2º só começa depois do 1º inteiro (cena + batida + cauda)', () => {
    lutar(seed);
    const esp = linhaDoTempo().acoes.filter(a => a.kind === 'special');
    expect(esp[1].actor).not.toBe(esp[0].actor); // um de cada lado, bem próximos no relógio da luta
    expect(esp[1].t - esp[0].t).toBeGreaterThanOrEqual(LEAD + TAIL - FOLGA);
  });

  it('nenhum número de dano aparece durante a cena do especial; o do golpe dele chega no fim dela', () => {
    lutar(seed);
    const { acoes, hits } = linhaDoTempo();
    for (const esp of acoes.filter(a => a.kind === 'special')) {
      const dentro = hits.filter(h => h.t > esp.t + FOLGA && h.t < esp.t + LEAD - FOLGA);
      expect(dentro, `chegou dano durante a cena do especial ${esp.id}`).toEqual([]);
      const dele = hits.find(h => h.t >= esp.t + LEAD - FOLGA);
      if (dele) expect(dele.t - esp.t).toBeLessThan(LEAD + TAIL + FOLGA * 4);
    }
  });

  it('é só encenação: o núcleo é o mesmo (a simulação com a semente não muda) e a luta TERMINA entregando o resultado', () => {
    const a = JSON.stringify(simulatePvp({ me: lado(), opp: lado(), seed, taps: [] }).events);
    const onDone = lutar(seed);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(simulatePvp({ me: lado(), opp: lado(), seed, taps: [] }).events)).toBe(a);
  });
});
