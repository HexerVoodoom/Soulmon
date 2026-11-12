/**
 * WP1.4 camada 1 — o "porquê" da pessoa vira a primeira sugestão, SEM REDE.
 *
 * Duas coisas são medidas aqui, e a segunda é a mais importante:
 *  1. o casamento acerta em PT e EN;
 *  2. ele **não tem rede**. A decisão D8 é explícita: do texto dessas duas
 *     perguntas só ENUM sai do aparelho. Um teste que só medisse acerto
 *     deixaria passar a versão "melhorada" que manda a frase para a IA.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { categoryForGoal, orderCategoriesForGoal, normalizeGoalText } from './goalToCategory';
import type { ActivityCategory } from '../types/attributes';

const TODAS: ActivityCategory[] = [
  'sono', 'corpo', 'mente', 'foco', 'aprendizado', 'relacoes', 'casa', 'financas', 'proposito', 'criatividade',
];

const CASOS: Array<[string, ActivityCategory]> = [
  ['quero dormir melhor', 'corpo'],
  ['parar de virar a noite e ter mais sono de qualidade', 'corpo'],
  ['I want to sleep better and drink more water', 'corpo'],
  ['voltar pra academia', 'corpo'],
  ['correr 5km sem parar', 'corpo'],
  ['get back to the gym and work out again', 'corpo'],
  ['estudar pra prova da faculdade', 'aprendizado'],
  ['ler mais livros esse ano', 'aprendizado'],
  ['study english every day', 'aprendizado'],
  ['dar conta dos prazos do trabalho', 'foco'],
  ['organizar os projetos dos clientes', 'foco'],
  ['stop missing deadlines at work', 'foco'],
  ['voltar a desenhar', 'criatividade'],
  ['escrever um pouco todo dia', 'criatividade'],
  ['play guitar again', 'criatividade'],
  ['ver mais os amigos e a familia', 'relacoes'],
  ['ligar para minha mae toda semana', 'relacoes'],
  ['parar de procrastinar', 'foco'],
  ['largar o celular e ter foco', 'foco'],
  ['lidar melhor com a ansiedade', 'mente'],
  ['deal with stress and burnout', 'mente'],
];

describe('goalToCategory — o que a pessoa escreveu vira a primeira sugestão', () => {
  for (const [frase, esperada] of CASOS) {
    it(`"${frase}" → ${esperada}`, () => {
      expect(categoryForGoal(frase)).toBe(esperada);
    });
  }

  it('lê as DUAS perguntas juntas', () => {
    // O objetivo e a dificuldade descrevem a mesma vida; usar só uma jogaria
    // fora metade do que a pessoa contou.
    expect(categoryForGoal('', 'não consigo acordar cedo, durmo mal')).toBe('corpo');
  });
});

describe('goalToCategory — não saber é resposta legítima', () => {
  it('texto vazio, pulado ou não-string devolve null', () => {
    expect(categoryForGoal('')).toBeNull();
    expect(categoryForGoal('   ')).toBeNull();
    expect(categoryForGoal(undefined)).toBeNull();
    expect(categoryForGoal(null, 42)).toBeNull();
  });

  it('frase que não bate com nada devolve null, e não um chute', () => {
    // Errar para "não sei" custa a ordem padrão. Errar para o chute põe na
    // cara da pessoa, no minuto zero, uma sugestão que não é dela.
    expect(categoryForGoal('quero ser mais eu mesmo')).toBeNull();
  });

  it('acento e caixa não mudam a leitura', () => {
    expect(normalizeGoalText('DORMIR Melhor')).toBe('dormir melhor');
    expect(categoryForGoal('exercício físico')).toBe(categoryForGoal('exercicio fisico'));
  });
});

describe('goalToCategory — reordena, nunca esconde', () => {
  it('a sugerida vai para a frente e o resto continua inteiro', () => {
    const ordem = orderCategoriesForGoal(TODAS, 'quero voltar a correr');
    expect(ordem[0]).toBe('corpo');
    expect(ordem).toHaveLength(TODAS.length);
    expect([...ordem].sort()).toEqual([...TODAS].sort());
  });

  it('sem casamento, a ordem padrão fica intacta', () => {
    expect(orderCategoriesForGoal(TODAS, '')).toEqual(TODAS);
  });

  it('esconder categoria seria decidir no lugar da pessoa — nunca acontece', () => {
    for (const [frase] of CASOS) {
      expect(orderCategoriesForGoal(TODAS, frase)).toHaveLength(TODAS.length);
    }
  });
});

describe('goalToCategory — camada 1 NÃO tem rede (decisão D8)', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('nenhuma chamada de rede acontece ao casar a frase', () => {
    // O texto dessas duas perguntas não sai do aparelho: `_redact.js` declara
    // isso e a D8 confirmou. Se alguém "melhorar" este módulo mandando a
    // frase para a IA, é aqui que quebra.
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const beaconSpy = vi.fn(() => true);
    vi.stubGlobal('navigator', { sendBeacon: beaconSpy });
    for (const [frase] of CASOS) categoryForGoal(frase);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(beaconSpy).not.toHaveBeenCalled();
  });
});
