/**
 * WP2.7 — o reencontro é por DIAS.
 *
 * A saudação usava limiar de 10 minutos e a MESMA frase para quem voltou 11
 * minutos depois e para quem sumiu três semanas. As duas coisas não são a
 * mesma: uma é continuar, a outra é voltar.
 *
 * A trava do pacote é o silêncio sobre o que ficou para trás — um reencontro
 * que começa com um balanço é uma cobrança com roupa de saudade.
 */
import { describe, it, expect } from 'vitest';
import { absenceBucket, welcomeBackLine, welcomeBackLines, type AbsenceBucket } from './welcomeBack';

describe('welcomeBack — as quatro faixas', () => {
  it('0 = voltou logo · 1 = 2–4 · 2 = 5–14 · 3 = 15+', () => {
    expect(absenceBucket(0)).toBe(0);
    expect(absenceBucket(1)).toBe(0);
    expect(absenceBucket(2)).toBe(1);
    expect(absenceBucket(4)).toBe(1);
    expect(absenceBucket(5)).toBe(2);
    expect(absenceBucket(14)).toBe(2);
    expect(absenceBucket(15)).toBe(3);
    expect(absenceBucket(900)).toBe(3);
  });

  it('valor inválido cai na faixa de quem não sumiu', () => {
    // Errar para "voltou logo" é inofensivo; errar para "sumiu três semanas"
    // faria o pet dizer saudade a quem esteve aqui ontem.
    expect(absenceBucket(NaN)).toBe(0);
    expect(absenceBucket(-3)).toBe(0);
  });

  it('cada faixa tem frase própria — 11 minutos e 3 semanas não são iguais', () => {
    const ditas = new Set([0, 1, 2, 3].map(b => welcomeBackLine(b === 0 ? 0 : b === 1 ? 3 : b === 2 ? 7 : 30, true, 0)));
    expect(ditas.size).toBe(4);
  });
});

describe('welcomeBack — nenhuma frase menciona o que ficou para trás', () => {
  const PROIBIDAS = [
    'tarefa', 'task', 'meta', 'goal', 'atras', 'late', 'perdeu', 'lost',
    'sumiu', 'disappear', 'recuperar', 'catch up', 'pendente', 'pending',
    'faz tempo que você não', 'você não fez',
  ];

  it('em PT e EN, nas quatro faixas', () => {
    for (const b of [0, 1, 2, 3] as AbsenceBucket[]) {
      const { pt, en } = welcomeBackLines(b);
      for (const l of [...pt, ...en]) {
        for (const p of PROIBIDAS) {
          expect(l.toLowerCase(), `faixa ${b}: "${l}"`).not.toContain(p);
        }
      }
    }
  });

  it('as faixas longas falam de guardar e de esperar, não de retomar', () => {
    const longa = welcomeBackLines(3).pt.join(' ').toLowerCase();
    expect(longa).toMatch(/esperando|não mudei|guardei|tudo bem/);
  });

  it('o sorteio nunca sai do intervalo', () => {
    expect(welcomeBackLine(30, true, 1)).toBeTruthy();
    expect(welcomeBackLine(30, true, -1)).toBeTruthy();
  });
});
