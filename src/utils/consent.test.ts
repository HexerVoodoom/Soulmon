import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ageOn, isAdult, isAgeBlocked, buildConsentRecord, normalizeConsent,
  MIN_AGE_YEARS, TERMS_VERSION, PRIVACY_VERSION,
} from './consent';

const RAIZ = resolve(__dirname, '../..');
const ler = (p: string) => readFileSync(resolve(RAIZ, p), 'utf8');

const AGORA = new Date('2026-08-25T12:00:00Z');

describe('gate de idade — 18+ por autodeclaração (D-06)', () => {
  it('bloqueia quem tem menos de 18', () => {
    expect(isAdult('2010-01-01', AGORA)).toBe(false);
    expect(isAgeBlocked('2010-01-01', AGORA)).toBe(true);
  });

  it('deixa passar quem tem 18 ou mais', () => {
    expect(isAdult('2000-05-10', AGORA)).toBe(true);
    expect(isAgeBlocked('2000-05-10', AGORA)).toBe(false);
  });

  it('a virada do aniversário é no DIA, não no ano', () => {
    // Faz 18 exatamente hoje: passa.
    expect(ageOn('2008-08-25', AGORA)).toBe(MIN_AGE_YEARS);
    expect(isAgeBlocked('2008-08-25', AGORA)).toBe(false);
    // Faz 18 amanhã: ainda não.
    expect(ageOn('2008-08-26', AGORA)).toBe(MIN_AGE_YEARS - 1);
    expect(isAgeBlocked('2008-08-26', AGORA)).toBe(true);
  });

  it('data ausente ou ilegível NÃO bloqueia — quem já joga não pode ser barrado', () => {
    // O modo de falha que este caso fecha: um save antigo (ou o caminho demo,
    // que não coleta data) sendo tratado como "menor de idade" e perdendo o
    // acesso por um campo que nunca existiu no save dele.
    expect(isAgeBlocked(undefined, AGORA)).toBe(false);
    expect(isAgeBlocked('', AGORA)).toBe(false);
    expect(isAgeBlocked('não sei', AGORA)).toBe(false);
    // Mas "ilegível" também não vira "maior": quem decide é quem chama.
    expect(isAdult('não sei', AGORA)).toBe(false);
  });
});

describe('consentimento — prova com versão e timestamp', () => {
  it('o registro carrega quando foi aceito E qual versão de cada documento', () => {
    const r = buildConsentRecord(AGORA);
    expect(r.acceptedAt).toBe(AGORA.toISOString());
    expect(r.termsVersion).toBe(TERMS_VERSION);
    expect(r.privacyVersion).toBe(PRIVACY_VERSION);
  });

  it('sobrevive à ida e volta do save (JSON) e à normalização de load', () => {
    const r = buildConsentRecord(AGORA);
    const voltou = normalizeConsent(JSON.parse(JSON.stringify(r)));
    expect(voltou).toEqual(r);
  });

  it('save antigo (sem o campo) normaliza para ausência, sem lançar', () => {
    expect(normalizeConsent(undefined)).toBeUndefined();
    expect(normalizeConsent(null)).toBeUndefined();
    expect(normalizeConsent('sim')).toBeUndefined();
    expect(normalizeConsent({})).toBeUndefined();
    expect(normalizeConsent({ acceptedAt: 123 })).toBeUndefined();
  });

  it('registro sem versão não é descartado — a prova do quando não se perde', () => {
    const r = normalizeConsent({ acceptedAt: '2026-01-01T00:00:00.000Z' });
    expect(r?.acceptedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(r?.termsVersion).toBe('desconhecida');
  });
});

describe('superfícies novas em PT-BR e EN', () => {
  const termos = ler('public/termos.html');
  const politica = ler('public/privacidade.html');
  const onboarding = ler('src/components/SoulmonOnboarding.tsx');
  const credits = ler('src/components/CreditsModal.tsx');

  it('os Termos existem nos dois idiomas, com as 10 seções', () => {
    expect(termos).toContain('Termos de Uso — Soulmon');
    expect(termos).toContain('Terms of Use — Soulmon');
    for (let n = 1; n <= 10; n++) {
      expect(termos, `falta a seção ${n} em PT`).toMatch(new RegExp(`<h2>${n}\\. `));
    }
    // 10 em PT + 10 em EN.
    expect(termos.match(/<h2>\d+\. /g)?.length).toBe(20);
  });

  it('política e termos se linkam nos dois sentidos', () => {
    expect(termos).toContain('/privacidade.html');
    expect(politica).toContain('/termos.html');
  });

  it('a política declara a base para leitura de dados de uso (D-22), PT e EN', () => {
    expect(politica).toContain('Base para leitura dos seus dados de uso');
    expect(politica).toContain('Basis for reading your usage data');
    expect(politica).toContain('completedTasks');
  });

  it('a tela "Antes de começar" tem os dois idiomas e a caixa fora do texto legal', () => {
    expect(onboarding).toContain('Antes de começar');
    expect(onboarding).toContain('Before we start');
    expect(onboarding).toContain('Li e concordo com os Termos de Uso e a Política de Privacidade');
    expect(onboarding).toContain('I have read and agree to the Terms of Use and the Privacy Policy');
    // A caixa é um `CheckRow` próprio, não um <a> dentro de um parágrafo legal.
    expect(onboarding).toMatch(/<CheckRow checked=\{consentChecked\}/);
  });

  it('o muro de idade fala nos dois idiomas e não usa linguagem de rejeição', () => {
    expect(onboarding).toContain('Ainda não dá para continuar');
    expect(onboarding).toContain('Not quite yet');
    expect(onboarding).toContain('Volte quando fizer 18 anos');
    expect(onboarding).toContain("Come back when you turn 18");
    // A voz do produto encoraja, nunca expulsa — nem aqui.
    for (const proibida of ['negado', 'Acesso negado', 'Denied', 'not allowed']) {
      expect(onboarding.includes(proibida), `"${proibida}" não pode aparecer no muro de idade`).toBe(false);
    }
  });

  /**
   * ⚠️ Este caso pedia que a tela dissesse "sorteado aleatoriamente" — porque,
   * enquanto o sorteio existia, **declará-lo era a obrigação** (D-05: vender
   * aleatoriedade sem dizer que é aleatória é vender a ilusão de que existe um
   * resultado melhor).
   *
   * Em 06/09/2026 o sorteio foi REMOVIDO (WP5.7 / decisão H.4): a criatura sai
   * das respostas, e a mesma resposta devolve a mesma criatura. A obrigação de
   * declarar a aleatoriedade some junto com ela — e a exigência se inverte: a
   * palavra não pode mais aparecer, porque agora ela seria falsa.
   *
   * A equivalência mecânica continua sendo obrigatória, e por outro motivo: ela
   * não é sobre o sorteio, é sobre dinheiro nunca comprar poder.
   */
  it('a Nova Leitura não promete sorteio nenhum, e mantém a equivalência mecânica', () => {
    expect(credits).toContain('Todo pet é mecanicamente igual');
    expect(credits).toContain('Every pet is mechanically equal');
    expect(credits, 'a criatura voltou a ser sorteada').not.toContain('sorteado aleatoriamente');
    expect(credits).not.toContain('randomly rolled');
    expect(credits).toContain('Mesmas respostas, mesma criatura');
    expect(credits).toContain('Same answers, same creature');
  });
});

describe('gate de idade — a declaração por CAIXA (07/09/2026)', () => {
  // O campo de mês/ano saiu: o dono trocou por uma caixa "Tenho 18 anos ou
  // mais". O que motivou é um fato sobre o provedor, e por isso fica escrito
  // aqui: o login com Google NÃO informa a idade — devolve e-mail, nome e
  // foto —, então nunca houve como delegar a checagem a ele.
  //
  // São DUAS caixas, e não uma frase só: juntar "sou maior" com "aceito os
  // Termos" faz um marcar o outro por tabela, e aí nenhum dos dois é uma
  // declaração específica — que é o que o aceite precisa ser (run 01).
  it('a caixa de maioridade e a de Termos são separadas, nos dois idiomas', () => {
    const onboarding = ler('src/components/SoulmonOnboarding.tsx');
    expect(onboarding).toContain('Tenho ${MIN_AGE_YEARS} anos ou mais');
    expect(onboarding).toContain('I am ${MIN_AGE_YEARS} or older');
    expect(onboarding).toContain('Li e concordo com os Termos de Uso e a Política de Privacidade');
    expect(onboarding).toContain('I have read and agree to the Terms of Use and the Privacy Policy');
    // As duas travam o mesmo portão, e as duas precisam estar marcadas.
    expect(onboarding).toMatch(/podeAutenticar = consentChecked && \(!precisaDeclararIdade \|\| maiorIdadeChecked\)/);
  });

  it('nada mais pede mês e ano de nascimento', () => {
    const onboarding = ler('src/components/SoulmonOnboarding.tsx');
    expect(onboarding).not.toContain('Em que mês e ano você nasceu?');
    expect(onboarding).not.toContain('What month and year were you born?');
    // E as funções que serviam só a esse campo saíram do utilitário.
    const utilitario = ler('src/utils/consent.ts');
    expect(utilitario).not.toMatch(/export function isAgeBlockedByMonth/);
    expect(utilitario).not.toMatch(/export function monthYearFromText/);
  });

  it('o caminho PAGO continua conferindo pela data cheia', () => {
    // Ali existe data de nascimento de verdade (mapa astral), e ela é mais
    // estrita que uma declaração — não faz sentido abrir mão dela.
    const onboarding = ler('src/components/SoulmonOnboarding.tsx');
    expect(onboarding).toMatch(/isAgeBlocked\(birthDate\)/);
  });
});