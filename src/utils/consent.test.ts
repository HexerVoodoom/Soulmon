import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ageOn, isAdult, isAgeBlocked, buildConsentRecord, normalizeConsent,
  ageOnMonth, isAgeBlockedByMonth, monthYearFromText,
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

  it('o reroll declara a equivalência mecânica nos dois idiomas (D-05)', () => {
    expect(credits).toContain('Todo pet é mecanicamente igual');
    expect(credits).toContain('Every pet is mechanically equal');
    expect(credits).toContain('sorteado aleatoriamente');
    expect(credits).toContain('randomly rolled');
  });
});

describe('gate de idade no caminho DEMO — mês/ano no passo de consentimento', () => {
  // O buraco que estes casos fecham: o demo pula o Oráculo inteiro
  // (STRUGGLE_STEP → CONSENT_STEP → DEMO_PICK) e nunca chega ao passo da data,
  // então o 18+ existia SÓ para quem pagava. A decisão do dono é 18+ para o
  // produto.
  it('demo com menos de 18 é barrado', () => {
    expect(isAgeBlockedByMonth('2012-03', AGORA)).toBe(true);
    expect(ageOnMonth('2012-03', AGORA)).toBe(14);
  });

  it('demo com 18 ou mais passa', () => {
    expect(isAgeBlockedByMonth('2000-01', AGORA)).toBe(false);
    expect(ageOnMonth('2000-01', AGORA)).toBe(26);
  });

  it('a folga do mês é resolvida para o lado generoso (assume o dia 1º)', () => {
    // Nasceu em agosto/2008: em 25/08/2026 pode ter 17 (nasceu dia 26+) ou 18.
    // Autodeclaração não ganha nada apertando a folga — quem quiser passar
    // digita outro ano; apertar só criaria o risco de barrar adulto de verdade
    // no mês do aniversário dele. Ver a nota em consent.ts.
    expect(ageOnMonth('2008-08', AGORA)).toBe(MIN_AGE_YEARS);
    expect(isAgeBlockedByMonth('2008-08', AGORA)).toBe(false);
    // O mês seguinte inteiro ainda é de menor, e aí bloqueia.
    expect(isAgeBlockedByMonth('2008-09', AGORA)).toBe(true);
  });

  it('mês/ano ausente ou ilegível NÃO barra — save antigo e quem já joga seguem', () => {
    expect(isAgeBlockedByMonth(undefined, AGORA)).toBe(false);
    expect(isAgeBlockedByMonth('', AGORA)).toBe(false);
    expect(isAgeBlockedByMonth('2008', AGORA)).toBe(false);
    expect(isAgeBlockedByMonth('13-2008', AGORA)).toBe(false);
    expect(isAgeBlockedByMonth('não sei', AGORA)).toBe(false);
  });

  it('a máscara MM/AAAA só vira data quando está completa e o mês existe', () => {
    expect(monthYearFromText('05/2000')).toBe('2000-05');
    expect(monthYearFromText('12/1999')).toBe('1999-12');
    expect(monthYearFromText('')).toBe('');
    expect(monthYearFromText('05/20')).toBe('');
    expect(monthYearFromText('00/2000')).toBe('');
    expect(monthYearFromText('13/2000')).toBe('');
  });

  it('a tela do demo pede mês/ano, diz para que serve, e nos dois idiomas', () => {
    const onboarding = ler('src/components/SoulmonOnboarding.tsx');
    expect(onboarding).toContain('Em que mês e ano você nasceu?');
    expect(onboarding).toContain('What month and year were you born?');
    // Coleta declarada: a tela diz a finalidade e que a resposta não é guardada.
    expect(onboarding).toContain('não guardamos essa resposta');
    expect(onboarding).toContain("we don't store this answer");
    // O campo só aparece no demo — no Oráculo a data cheia já confere.
    expect(onboarding).toMatch(/const demoNeedsAge = flow === 'demo'/);
    // E o avanço do passo de consentimento passa pelo gate.
    expect(onboarding).toMatch(/isAgeBlockedByMonth\(demoAgeMonth\)/);
    // A resposta NÃO é persistida: nada de writeJson/STORAGE_KEYS com ela.
    expect(onboarding).not.toMatch(/writeJson\([^)]*demoAge/);
  });
});
