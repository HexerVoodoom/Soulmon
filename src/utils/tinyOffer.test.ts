/**
 * WP2.5 — o `soulStruggle` era escrito no onboarding e NUNCA lido. Perguntar
 * algo pessoal, guardar e não devolver é extração — a mesma crítica que este
 * produto faz aos apps de sono, aplicada a ele mesmo.
 *
 * O teste tem duas metades: a devolução acontece, e ela não vira cobrança.
 */
import { describe, it, expect } from 'vitest';
import { echoStruggle, tinyOfferIntro, STRUGGLE_ECHO_MAX } from './tinyOffer';

describe('tinyOffer — devolve o que a pessoa contou', () => {
  it('monta a frase nos dois idiomas', () => {
    expect(tinyOfferIntro('o cansaço no fim do dia', true))
      .toBe('Você me contou que o cansaço no fim do dia costuma atrapalhar.');
    expect(tinyOfferIntro('being tired at night', false))
      .toBe('You told me that being tired at night usually gets in the way.');
  });

  it('quem pulou a pergunta não vê nada — nunca um vazio com ar de formulário', () => {
    expect(tinyOfferIntro('', true)).toBeNull();
    expect(tinyOfferIntro('   ', true)).toBeNull();
    expect(tinyOfferIntro(undefined, true)).toBeNull();
    expect(tinyOfferIntro(null, true)).toBeNull();
    expect(tinyOfferIntro(42, true)).toBeNull();
  });
});

describe('tinyOffer — o texto é da pessoa, então é tratado com cuidado', () => {
  it('colapsa espaço', () => {
    expect(echoStruggle('  o   sono \n ruim ')).toBe('o sono ruim');
  });

  it('corta na última palavra inteira, nunca no meio de uma', () => {
    const longo = 'procrastinação crônica somada a um ambiente barulhento e reuniões demais durante toda a tarde';
    const eco = echoStruggle(longo);
    expect(eco.length).toBeLessThanOrEqual(STRUGGLE_ECHO_MAX);
    expect(longo.startsWith(eco)).toBe(true);
    expect(eco.endsWith(' ')).toBe(false);
    // A última palavra do eco é uma palavra do texto original, inteira.
    const ultima = eco.split(' ').pop()!;
    expect(longo.split(/\s+/)).toContain(ultima);
  });

  it('texto de uma palavra só, mais longo que o teto, ainda é cortado', () => {
    const eco = echoStruggle('a'.repeat(200));
    expect(eco).toHaveLength(STRUGGLE_ECHO_MAX);
  });
});

describe('tinyOffer — a frase NÃO cobra', () => {
  it('não usa palavra de culpa, nem conta falhas', () => {
    const frase = tinyOfferIntro('a preguiça', true)!;
    for (const p of ['deveria', 'falhou', 'de novo', 'duas vezes', 'atrasad', 'perdeu']) {
      expect(frase.toLowerCase(), frase).not.toContain(p);
    }
    // O texto da pessoa é reproduzido como ela escreveu — inclusive
    // "preguiça", que ela pode usar sobre si mesma. O que não pode é o APP
    // adicionar julgamento; é isso que o teste acima mede.
    expect(frase).toContain('a preguiça');
  });
});
