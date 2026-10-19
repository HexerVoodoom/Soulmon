import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  letterForDay, hasUnreadLetter, markLetterRead, parseLetterState, serializeLetterState, normalizeKinds, letterCopy,
  npcNewsToday, notificarCarta, registerCartaPushHandler, LETTER_MAX_LINES,
} from './npcLetter';
import { weeklyDiscountItem } from './equipment';

const D1 = '2026-10-19';
const D2 = '2026-10-20';

afterEach(() => { registerCartaPushHandler(null); });

describe('carta de NPC: no máximo 1 por dia', () => {
  it('sem novidade: nenhuma carta (e a cartinha não existe)', () => {
    const r = letterForDay(null, D1, []);
    expect(r).toEqual({ letter: null, created: false });
    expect(hasUnreadLetter(r.letter, D1)).toBe(false);
  });

  it('com novidade: nasce UMA carta não lida e a cartinha aparece', () => {
    const r = letterForDay(null, D1, ['promo', 'quest']);
    expect(r.created).toBe(true);
    expect(r.letter).toEqual({ day: D1, kinds: ['promo', 'quest'], read: false });
    expect(hasUnreadLetter(r.letter, D1)).toBe(true);
  });

  it('novidade que chega DEPOIS no mesmo dia não gera segunda carta nem muda a primeira (lida ou não)', () => {
    const first = letterForDay(null, D1, ['promo']).letter!;
    expect(letterForDay(first, D1, ['promo', 'quest'])).toEqual({ letter: first, created: false });
    const lida = markLetterRead(first);
    expect(letterForDay(lida, D1, ['promo', 'quest', 'event'])).toEqual({ letter: lida, created: false });
  });

  it('abrir a carta marca lida e a cartinha some (idempotente)', () => {
    const l = letterForDay(null, D1, ['quest']).letter!;
    const lida = markLetterRead(l);
    expect(hasUnreadLetter(lida, D1)).toBe(false);
    expect(markLetterRead(lida)).toBe(lida);
  });

  it('virou o dia: a carta de ontem some sem rastro e, com novidade, nasce a de hoje', () => {
    const ontem = letterForDay(null, D1, ['promo']).letter!;
    expect(hasUnreadLetter(ontem, D2)).toBe(false);
    expect(letterForDay(ontem, D2, [])).toEqual({ letter: null, created: false });
    const hoje = letterForDay(ontem, D2, ['quest']);
    expect(hoje.created).toBe(true);
    expect(hoje.letter?.day).toBe(D2);
  });

  it('junta as novidades em até 3 linhas, ordem fixa, sem repetição, só tipos válidos', () => {
    expect(normalizeKinds(['event', 'quest', 'promo', 'promo', 'x', 7])).toEqual(['promo', 'quest', 'event']);
    expect(LETTER_MAX_LINES).toBe(3);
    const c = letterCopy({ day: D1, kinds: ['promo', 'quest', 'event'], read: false }, 'pt-BR');
    expect(c.lines).toHaveLength(3);
  });
});

describe('persistência e copy', () => {
  it('ida e volta; lixo vira null', () => {
    const l = { day: D1, kinds: ['promo' as const], read: true };
    expect(parseLetterState(serializeLetterState(l))).toEqual(l);
    for (const bad of [null, '', '{', '[]', '{"day":1}', '{"day":"x","kinds":["zzz"]}']) expect(parseLetterState(bad)).toBeNull();
  });

  it('copy EN e PT na voz do NPC, sem culpa nem cobrança', () => {
    const l = { day: D1, kinds: ['promo' as const, 'quest' as const], read: false };
    for (const lang of ['en-US', 'pt-BR'] as const) {
      const c = letterCopy(l, lang);
      expect(c.from).toEqual({ area: 'mercado', lot: 'ferreiro' });
      const txt = c.lines.join(' ').toLowerCase();
      expect(txt).not.toMatch(/perdeu|esquece|forget|missed|last chance|última chance|hurry|streak/);
    }
    expect(letterCopy(l, 'pt-BR').lines[0]).toMatch(/promoção/);
    expect(letterCopy(l, 'en-US').lines[0]).toMatch(/on sale/);
  });
});

describe('novidades de NPC de hoje (só o que já existe)', () => {
  const week = '2026-W43';
  it('a peça da semana existe', () => { expect(weeklyDiscountItem(week)).toBeTruthy(); });

  it('promo só com o talento de Comércio e a forja aberta', () => {
    expect(npcNewsToday({ weekKey: week, bondLevel: 5, talentPicks: ['tal-com-07'], marks: {} })).toContain('promo');
    expect(npcNewsToday({ weekKey: week, bondLevel: 5, talentPicks: [], marks: {} })).not.toContain('promo');
    expect(npcNewsToday({ weekKey: week, bondLevel: 0, talentPicks: ['tal-com-07'], marks: {} })).not.toContain('promo');
    expect(npcNewsToday({ weekKey: null, bondLevel: 5, talentPicks: ['tal-com-07'], marks: {} })).not.toContain('promo');
  });

  it('quest só com "!" (missão disponível); "?" (completa) não gera carta', () => {
    expect(npcNewsToday({ weekKey: null, bondLevel: 5, talentPicks: [], marks: { 'exploracao.caderno': 'available' } })).toEqual(['quest']);
    expect(npcNewsToday({ weekKey: null, bondLevel: 5, talentPicks: [], marks: { 'exploracao.caderno': 'ready' } })).toEqual([]);
  });
});

describe('ponto de entrada do push', () => {
  it('sem handler: no-op; com handler: entrega a carta e o texto; handler que lança não derruba', () => {
    const l = { day: D1, kinds: ['promo' as const], read: false };
    expect(notificarCarta(l, 'pt-BR')).toBe(false);
    const h = vi.fn();
    registerCartaPushHandler(h);
    expect(notificarCarta(l, 'pt-BR')).toBe(true);
    expect(h).toHaveBeenCalledWith(l, expect.objectContaining({ lines: [expect.stringMatching(/promoção/)] }));
    registerCartaPushHandler(() => { throw new Error('x'); });
    expect(notificarCarta(l, 'en-US')).toBe(false);
  });
});
