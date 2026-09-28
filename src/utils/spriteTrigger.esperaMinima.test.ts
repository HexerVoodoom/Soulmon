// A INCUBAÇÃO — espera mínima de 30 min (D-G8b/D-G8c/D-G8d, 22/09/2026).
//
// Decisão do dono: *"Quando pode evoluir começa a incubação e depois de 30min
// volta e completa sob o comando do user."* Escopo v1, todo jogador.
//
// Este arquivo trava o COMPORTAMENTO. O que separa uma incubação de um timer
// gate não é o tempo — é o que o relógio pode fazer. Cada caso aqui é uma das
// condições do parecer `soulmon-guarda-linha-vermelha` (R-I..R-P, em
// `docs/plano-melhorias/ledger/vetos.md`).

import { describe, expect, it } from 'vitest';
import {
  INCUBATION_MIN_MS, emptyIncubation, incubationFor, incubationReady, isIncubating,
} from './spriteTrigger';
import { CARE_PATTERNS, type CareReading } from './carePattern';

const reading: CareReading = {
  pattern: CARE_PATTERNS.equilibrado,
  activeDays: 10, total: 30, concentration: 0.2, confident: true,
};

function apto(over: Partial<Parameters<typeof incubationFor>[0]> = {}) {
  return {
    evolutionStage: 'rookie',
    perfectDays: 4,            // rookie exige 4 → apto
    points: { virus: 9, data: 0, vaccine: 0 },
    reading,
    currentBranch: 'virus' as const,
    unlockedEvolutions: [] as string[],
    ...over,
  };
}

const T0 = new Date('2026-09-22T10:00:00Z');
const maisTarde = (ms: number) => new Date(T0.getTime() + ms);

describe('a incubação abre na ELEGIBILIDADE, não na véspera', () => {
  it('a um ponto de distância não abre relógio nenhum', () => {
    const inc = incubationFor(apto({ perfectDays: 3 }), undefined, T0);
    expect(Object.keys(inc.since)).toHaveLength(0);
  });

  it('ficar apto registra o instante da forma-destino', () => {
    const inc = incubationFor(apto(), undefined, T0);
    expect(inc.since['champion-virus']).toBe(T0.toISOString());
  });

  it('o empate de galho incuba TODOS os líderes — o toque decide depois', () => {
    const inc = incubationFor(apto({ points: { virus: 4, data: 0, vaccine: 4 } }), undefined, T0);
    expect(Object.keys(inc.since).sort()).toEqual(['champion-vaccine', 'champion-virus']);
  });
});

describe('30 min é PISO, nunca prazo (D-G8b)', () => {
  it('antes dos 30 min não libera; a partir deles, libera', () => {
    const inc = incubationFor(apto(), undefined, T0);
    expect(incubationReady(inc, 'champion-virus', maisTarde(INCUBATION_MIN_MS - 1))).toBe(false);
    expect(incubationReady(inc, 'champion-virus', maisTarde(INCUBATION_MIN_MS))).toBe(true);
  });

  it('**o caso que separa piso de prazo**: 30 dias depois continua liberado', () => {
    const inc = incubationFor(apto(), undefined, T0);
    expect(incubationReady(inc, 'champion-virus', maisTarde(30 * 24 * 60 * 60 * 1000))).toBe(true);
  });

  it('R-K(b): o ESTADO é idêntico com 30 min e com 30 dias de espera', () => {
    // Não há prêmio por chegar cedo, e por isso não há motivo para conferir o
    // app. É este teste que substitui o push que a decisão #76 cortou.
    const inc = incubationFor(apto(), undefined, T0);
    const cedo = incubationFor(apto(), inc, maisTarde(INCUBATION_MIN_MS));
    const tarde = incubationFor(apto(), inc, maisTarde(30 * 24 * 60 * 60 * 1000));
    expect(JSON.stringify(cedo)).toBe(JSON.stringify(tarde));
  });
});

describe('R-L: degenerar dentro da janela NÃO cobra um segundo relógio', () => {
  it('cair e re-subir para a mesma forma reaproveita o `since` que já corria', () => {
    const inc = incubationFor(apto(), undefined, T0);
    // O jogador degenera 10 min depois: deixa de estar apto.
    const caiu = incubationFor(apto({ perfectDays: 0 }), inc, maisTarde(10 * 60_000));
    // Volta a ficar apto 5 min depois disso.
    const voltou = incubationFor(apto(), caiu, maisTarde(15 * 60_000));
    expect(voltou.since['champion-virus']).toBe(T0.toISOString());
    // …e por isso libera aos 30 min do relógio ORIGINAL, não 30 min depois da volta.
    expect(incubationReady(voltou, 'champion-virus', maisTarde(INCUBATION_MIN_MS))).toBe(true);
  });

  it('o HP não cobra tempo sobre progresso: a queda não apaga registro nenhum', () => {
    const inc = incubationFor(apto(), undefined, T0);
    const caiu = incubationFor(apto({ perfectDays: 0 }), inc, maisTarde(60_000));
    expect(caiu.since['champion-virus']).toBe(T0.toISOString());
  });
});

describe('R-M/D-G8d: o portão é o RELÓGIO, nunca o sprite ficar pronto', () => {
  it('`incubationFor` não recebe acervo — teto e falha de geração não entram na conta', () => {
    // A assinatura é a régua: se um dia alguém acrescentar `library` aqui, o
    // jogador em `sprite-lifetime-cap` volta a poder ficar travado fora da
    // própria evolução. O teste falha por tipo antes de falhar por asserção.
    const inc = incubationFor(apto(), undefined, T0);
    expect(incubationReady(inc, 'champion-virus', maisTarde(INCUBATION_MIN_MS))).toBe(true);
  });
});

describe('o save antigo e o relógio quebrado nunca prendem ninguém', () => {
  it('forma sem registro está liberada — quem já era apto não ganha relógio novo', () => {
    expect(incubationReady(undefined, 'champion-virus', T0)).toBe(true);
    expect(incubationReady(emptyIncubation(), 'champion-virus', T0)).toBe(true);
  });

  it('`since` corrompido libera, nunca tranca', () => {
    const inc = { v: 1 as const, since: { 'champion-virus': 'não é data' } };
    expect(incubationReady(inc, 'champion-virus', T0)).toBe(true);
  });
});

describe('idempotência (footgun 6) e `isIncubating`', () => {
  it('chamar duas vezes devolve a MESMA referência — StrictMode e cloud save', () => {
    const a = incubationFor(apto(), undefined, T0);
    const b = incubationFor(apto(), a, maisTarde(60_000));
    expect(b).toBe(a);
  });

  it('não-apto com estado vazio devolve a mesma referência', () => {
    const vazio = emptyIncubation();
    expect(incubationFor(apto({ perfectDays: 0 }), vazio, T0)).toBe(vazio);
  });

  it('`isIncubating` responde false sem forma, sem registro e depois da espera', () => {
    const inc = incubationFor(apto(), undefined, T0);
    expect(isIncubating(inc, null, T0)).toBe(false);
    expect(isIncubating(inc, 'ultra', T0)).toBe(false);
    expect(isIncubating(inc, 'champion-virus', T0)).toBe(true);
    expect(isIncubating(inc, 'champion-virus', maisTarde(INCUBATION_MIN_MS))).toBe(false);
  });
});
