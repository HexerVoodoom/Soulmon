import { describe, it, expect } from 'vitest';
import {
  REVIEW_BOXES, REVIEW_INTERVAL_DAYS, REVIEW_SESSION_SIZE, REVIEW_MAX_CARDS, REVIEW_TEXT_MAX,
  REVIEW_SESSION_BITS, REVIEW_EMPTY, sanitizeReview, addCard, editCard, removeCard, dueCards,
  answerCard, completeSession, addDays, type ReviewState,
} from './revisao';

const HOJE = '2026-09-30';

function comCartoes(n: number, dia = HOJE): ReviewState {
  let s: ReviewState = REVIEW_EMPTY;
  for (let i = 0; i < n; i++) s = addCard(s, `f${i}`, `b${i}`, dia, `id${String(i).padStart(3, '0')}`);
  return s;
}

describe('addDays — UTC puro', () => {
  it('atravessa mês, ano e fevereiro bissexto', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2026-09-30', 16)).toBe('2026-10-16');
  });
});

describe('constantes', () => {
  it('uma caixa por intervalo, crescente', () => {
    expect(REVIEW_INTERVAL_DAYS).toHaveLength(REVIEW_BOXES);
    for (let i = 1; i < REVIEW_INTERVAL_DAYS.length; i++) {
      expect(REVIEW_INTERVAL_DAYS[i]).toBeGreaterThan(REVIEW_INTERVAL_DAYS[i - 1]);
    }
    expect(REVIEW_SESSION_BITS).toBe(5);
    expect(REVIEW_SESSION_SIZE).toBe(5);
  });

  it('linha vermelha: nenhum campo de dias seguidos no estado', () => {
    let s = comCartoes(2);
    s = completeSession(s, HOJE).state;
    s = completeSession(s, addDays(HOJE, 1)).state;
    for (const k of Object.keys(s)) expect(k).not.toMatch(/streak|consecutive|seguid|sequencia|row/i);
    for (const k of Object.keys(s.cards[0])) expect(k).not.toMatch(/streak|consecutive|seguid|sequencia/i);
  });
});

describe('addCard / editCard / removeCard', () => {
  it('novo cartão vale hoje, caixa 1, texto aparado e cortado', () => {
    const s = addCard(REVIEW_EMPTY, '  oi  ', 'x'.repeat(500), HOJE, 'a');
    expect(s.cards).toEqual([{ id: 'a', front: 'oi', back: 'x'.repeat(REVIEW_TEXT_MAX), box: 1, due: HOJE, createdAt: HOJE }]);
    expect(REVIEW_EMPTY.cards).toHaveLength(0);
  });

  it('recusa (mesma referência) texto vazio, id repetido e teto', () => {
    const s = addCard(REVIEW_EMPTY, 'a', 'b', HOJE, 'x');
    expect(addCard(s, '   ', 'b', HOJE, 'y')).toBe(s);
    expect(addCard(s, 'a', '', HOJE, 'y')).toBe(s);
    expect(addCard(s, 'a', 'b', HOJE, 'x')).toBe(s);
    const cheio = comCartoes(REVIEW_MAX_CARDS);
    expect(cheio.cards).toHaveLength(REVIEW_MAX_CARDS);
    expect(addCard(cheio, 'a', 'b', HOJE, 'novo')).toBe(cheio);
  });

  it('editar troca o texto e mantém caixa/dia; remover tira', () => {
    let s = addCard(REVIEW_EMPTY, 'a', 'b', HOJE, 'x');
    s = answerCard(s, 'x', true, HOJE);
    const e = editCard(s, 'x', 'A', 'B');
    expect(e.cards[0]).toMatchObject({ front: 'A', back: 'B', box: 2, due: s.cards[0].due });
    expect(editCard(s, 'nao-existe', 'A', 'B')).toBe(s);
    expect(editCard(s, 'x', '', 'B')).toBe(s);
    expect(removeCard(e, 'x').cards).toHaveLength(0);
    expect(removeCard(e, 'nao-existe')).toBe(e);
  });
});

describe('Leitner — answerCard', () => {
  it('lembrou sobe uma caixa e volta no intervalo dela', () => {
    let s = addCard(REVIEW_EMPTY, 'a', 'b', HOJE, 'x');
    s = answerCard(s, 'x', true, HOJE);
    expect(s.cards[0]).toMatchObject({ box: 2, due: addDays(HOJE, REVIEW_INTERVAL_DAYS[1]) });
    for (let i = 0; i < 10; i++) s = answerCard(s, 'x', true, HOJE);
    expect(s.cards[0]).toMatchObject({ box: REVIEW_BOXES, due: addDays(HOJE, REVIEW_INTERVAL_DAYS[REVIEW_BOXES - 1]) });
  });

  it('não lembrou volta para a caixa 1 e para amanhã', () => {
    let s = addCard(REVIEW_EMPTY, 'a', 'b', HOJE, 'x');
    s = answerCard(answerCard(s, 'x', true, HOJE), 'x', true, HOJE);
    s = answerCard(s, 'x', false, HOJE);
    expect(s.cards[0]).toMatchObject({ box: 1, due: '2026-10-01' });
  });

  it('id inexistente devolve a mesma referência', () => {
    const s = comCartoes(1);
    expect(answerCard(s, 'nada', true, HOJE)).toBe(s);
  });
});

describe('dueCards', () => {
  it('só o que vence até hoje, caixa baixa → mais antigo → id; corta na sessão', () => {
    const s: ReviewState = {
      cards: [
        { id: 'c', front: 'f', back: 'b', box: 2, due: '2026-09-28', createdAt: '2026-09-01' },
        { id: 'b', front: 'f', back: 'b', box: 1, due: '2026-09-30', createdAt: '2026-09-01' },
        { id: 'a', front: 'f', back: 'b', box: 1, due: '2026-09-30', createdAt: '2026-09-01' },
        { id: 'd', front: 'f', back: 'b', box: 1, due: '2026-09-20', createdAt: '2026-09-01' },
        { id: 'z', front: 'f', back: 'b', box: 1, due: '2026-10-01', createdAt: '2026-09-01' },
      ],
    };
    expect(dueCards(s, HOJE).map(c => c.id)).toEqual(['d', 'a', 'b', 'c']);
    expect(dueCards(comCartoes(12), HOJE)).toHaveLength(REVIEW_SESSION_SIZE);
  });
});

describe('completeSession', () => {
  it('paga só a primeira sessão do dia', () => {
    const s = comCartoes(1);
    const r1 = completeSession(s, HOJE);
    expect(r1.bits).toBe(REVIEW_SESSION_BITS);
    expect(r1.state.lastSessionDay).toBe(HOJE);
    const r2 = completeSession(r1.state, HOJE);
    expect(r2.bits).toBe(0);
    expect(r2.state).toBe(r1.state);
    expect(completeSession(r2.state, addDays(HOJE, 1)).bits).toBe(REVIEW_SESSION_BITS);
  });
});

describe('sanitizeReview — nunca lança', () => {
  it('lixo de topo vira estado vazio', () => {
    for (const lixo of [null, undefined, 'x', 42, [], true, { cards: 'nope' }, { cards: null }]) {
      expect(sanitizeReview(lixo)).toEqual({ cards: [] });
    }
  });

  it('descarta malformado, prende caixa, corta texto, tira id repetido', () => {
    const r = sanitizeReview({
      lastSessionDay: 'ontem',
      cards: [
        null, 'x', 7, [],
        { id: 'ok', front: ' a ', back: 'b', box: 99, due: HOJE, createdAt: HOJE },
        { id: 'ok', front: 'dup', back: 'b', box: 1, due: HOJE, createdAt: HOJE },
        { id: 'neg', front: 'a', back: 'b', box: -3, due: '2026-02-30', createdAt: HOJE },
        { id: 'nan', front: 'a', back: 'b', box: 'abc', due: HOJE },
        { id: 'sem-texto', front: '', back: 'b', box: 1, due: HOJE, createdAt: HOJE },
        { id: 'sem-dia', front: 'a', back: 'b', box: 1, due: 'amanhã' },
        { id: 'longo', front: 'x'.repeat(1000), back: 'y', box: 2.6, due: HOJE, createdAt: HOJE },
        { front: 'sem id', back: 'b', box: 1, due: HOJE },
      ],
    });
    expect(r.lastSessionDay).toBeUndefined();
    expect(r.cards.map(c => c.id)).toEqual(['ok', 'neg', 'nan', 'longo']);
    expect(r.cards[0]).toMatchObject({ front: 'a', box: REVIEW_BOXES });
    expect(r.cards[1]).toMatchObject({ box: 1, due: HOJE });
    expect(r.cards[2]).toMatchObject({ box: 1, createdAt: HOJE });
    expect(r.cards[3].front).toHaveLength(REVIEW_TEXT_MAX);
    expect(r.cards[3].box).toBe(3);
  });

  it('array gigante é cortado no teto', () => {
    const cards = Array.from({ length: 100_000 }, (_, i) => ({ id: `i${i}`, front: 'a', back: 'b', box: 1, due: HOJE, createdAt: HOJE }));
    const r = sanitizeReview({ cards, lastSessionDay: HOJE });
    expect(r.cards).toHaveLength(REVIEW_MAX_CARDS);
    expect(r.lastSessionDay).toBe(HOJE);
  });

  it('é idempotente sobre estado válido', () => {
    const s = completeSession(comCartoes(3), HOJE).state;
    expect(sanitizeReview(sanitizeReview(s))).toEqual(s);
  });
});
