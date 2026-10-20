import { describe, it, expect } from 'vitest';
import { groveWalkers, groveStandSlots, STAND_SLOTS, WALK_SLOW, nextBubbleDelay, pickBubble, GROVE_WALKERS_MAX, BUBBLE_MIN_MS, BUBBLE_PHRASES } from './groveWalkers';
import { GUILD_MAX_MEMBERS, GUILD_PRESENCE_NOMINAL_MAX } from './guildRules';
import { GUILD_COPY } from './guildCopy';

const membros = (n: number, euEm = 0) =>
  Array.from({ length: n }, (_, i) => ({ id: `id-${String(i).padStart(2, '0')}-abcdef`, name: `Nome${i}`, euMesmo: i === euEm }));

describe('groveWalkers: todos os membros andam (D-51, K-13)', () => {
  it('o teto é o máximo do clã (12) e o resultado nunca passa dele', () => {
    expect(GROVE_WALKERS_MAX).toBe(GUILD_MAX_MEMBERS);
    expect(GROVE_WALKERS_MAX).toBe(12);
    expect(groveWalkers({ members: membros(12) })).toHaveLength(12);
    expect(groveWalkers({ members: membros(30) })).toHaveLength(12);
  });

  it.each([1, 2, 4, 5, 8, 12])('%i membros: todos andam, na ordem de chegada (acima de 4 não há estado de presença)', n => {
    expect(GUILD_PRESENCE_NOMINAL_MAX).toBe(4);
    const w = groveWalkers({ members: membros(n, n - 1) });
    expect(w).toHaveLength(n);
    expect(w.filter(x => x.own)).toHaveLength(1);
    // a posição de repouso cresce da esquerda para a direita, na ordem que o servidor mandou
    for (let i = 1; i < w.length; i++) expect(w[i].home).toBeGreaterThan(w[i - 1].home);
  });

  it('sem a própria criatura na lista, a SUA entra na frente (sem passar de 12); sem membros, só a sua', () => {
    const w = groveWalkers({ members: membros(12).map(m => ({ ...m, euMesmo: false })) });
    expect(w).toHaveLength(12);
    expect(w[0].own).toBe(true);
    expect(groveWalkers({ members: [] })).toHaveLength(1);
    expect(groveWalkers({ members: [] })[0].own).toBe(true);
  });

  it('todos andam igual: a presença do dia não entra na conta', () => {
    const base = membros(4);
    const a = groveWalkers({ members: base });
    const b = groveWalkers({ members: base.map(m => ({ ...m, apareceuHoje: true })) as never });
    expect(b).toEqual(a);
  });

  it('é determinístico (mesma roda, mesmo cenário em qualquer aparelho) e as caminhadas cabem na cena', () => {
    const a = groveWalkers({ members: membros(7) });
    expect(groveWalkers({ members: membros(7) })).toEqual(a);
    for (const w of a) {
      expect(w.home - w.amp).toBeGreaterThanOrEqual(0);
      expect(w.home + w.amp).toBeLessThanOrEqual(100);
      expect(w.dur).toBeGreaterThanOrEqual(14 * WALK_SLOW); // D-105: a caminhada do preview é bem mais lenta
      expect(w.dur).toBeLessThanOrEqual(26 * WALK_SLOW);
      expect(w.delay).toBeLessThanOrEqual(0);
      expect([0, 1, 2]).toContain(w.lane);
    }
  });

  it('a criatura dos OUTROS é uma das nossas (hash do id), nunca URL do servidor; a própria vem do App', () => {
    for (const w of groveWalkers({ members: membros(5) })) {
      if (w.own) expect(w.sprite).toBeNull();
      else expect(w.sprite).toBeTruthy();
    }
  });
});

describe('balões (D-52): intervalo aleatório >= 20 s, banco fixo EN+PT', () => {
  it('a pausa nunca é menor que 20 s', () => {
    for (const r of [0, 0.01, 0.5, 0.999, 1, 5, -3]) expect(nextBubbleDelay(r)).toBeGreaterThanOrEqual(BUBBLE_MIN_MS);
    expect(nextBubbleDelay(0)).toBe(BUBBLE_MIN_MS);
  });
  it('sorteia quem fala e a frase (1..N); sem sprites, nada', () => {
    expect(pickBubble(0, 0.5, 0.5)).toBeNull();
    for (const [a, b] of [[0, 0], [0.5, 0.5], [0.999, 0.999], [1, 1]]) {
      const p = pickBubble(12, a, b)!;
      expect(p.who).toBeGreaterThanOrEqual(0);
      expect(p.who).toBeLessThan(12);
      expect(p.phrase).toBeGreaterThanOrEqual(1);
      expect(p.phrase).toBeLessThanOrEqual(BUBBLE_PHRASES);
    }
  });
  it('toda frase existe nas duas línguas, sem dígito nem cobrança', () => {
    for (let i = 1; i <= BUBBLE_PHRASES; i++) {
      const [pt, en] = GUILD_COPY[`guild.bosque.fala.${i}` as keyof typeof GUILD_COPY];
      expect(pt.trim().length).toBeGreaterThan(0);
      expect(en.trim().length).toBeGreaterThan(0);
      expect(pt + en).not.toMatch(/\d|hoje|today|falt|miss|%/i);
    }
    expect(Object.keys(GUILD_COPY).filter(k => k.startsWith('guild.bosque.fala.'))).toHaveLength(BUBBLE_PHRASES);
  });
});

describe('D-105: slots fixos entre as árvores (ao entrar no Bosque)', () => {
  it('a travessia do preview é pelo menos 2x mais lenta que a antiga (14..26 s)', () => {
    expect(WALK_SLOW).toBeGreaterThanOrEqual(2);
    expect(WALK_SLOW).toBeLessThanOrEqual(3);
  });
  it('são 12 slots, determinísticos, dentro da cena, mais acima que o antigo chão (86..91) e distintos', () => {
    expect(STAND_SLOTS).toHaveLength(12);
    expect(new Set(STAND_SLOTS.map(sl => `${sl.x},${sl.y}`)).size).toBe(12);
    for (const sl of STAND_SLOTS) { expect(sl.x).toBeGreaterThan(5); expect(sl.x).toBeLessThan(95); expect(sl.y).toBeLessThan(86); expect(sl.y).toBeGreaterThan(70); }
  });
  it('sem sobreposição: nenhum par de sprites (own 96 px, outros 64 px, cena de 844 px de altura) se cobre', () => {
    const H = 844; const W = H * 1700 / 1129;
    for (const n of [1, 4, 12]) {
      for (const euEm of [0, n - 1]) {
        const ws = groveWalkers({ members: membros(n, euEm) });
        const sl = groveStandSlots(ws);
        const caixas = ws.map((w, i) => { const lado = w.own ? 96 : 64; const cx = (sl[i].x / 100) * W; const pes = (sl[i].y / 100) * H; return { x0: cx - lado / 2, x1: cx + lado / 2, y0: pes - lado, y1: pes }; });
        for (let a = 0; a < caixas.length; a++) for (let b = a + 1; b < caixas.length; b++) {
          const A = caixas[a]; const B = caixas[b];
          const sobre = A.x0 < B.x1 && B.x0 < A.x1 && A.y0 < B.y1 && B.y0 < A.y1;
          expect(sobre, `n=${n} eu=${euEm}: ${a} x ${b}`).toBe(false);
        }
      }
    }
  });
  it('quem olha sempre ocupa o primeiro slot, qualquer que seja a ordem de chegada', () => {
    const ws = groveWalkers({ members: membros(5, 3) });
    expect(groveStandSlots(ws)[ws.findIndex(w => w.own)]).toEqual(STAND_SLOTS[0]);
  });
});
