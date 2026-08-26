import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanPoop, applyPoopDrain, POOP_DRAIN_PERIOD_MS } from './poopDrain';

// ---------------------------------------------------------------------------
// O BANHO como REGRA PURA — a dívida que o commit 86341fcb declarou por escrito.
//
// O `remoteShower` do desktop (`desktop/renderer/src/care.ts`) é a ÚNICA
// transição daquele arquivo que não é um import, e o cabeçalho dele diz por
// quê: "no app o banho não tem regra pura em `src/utils/`. Ele mora inteiro no
// `App.tsx` (`handleCareEventComplete`), acoplado ao `careEvent`, um estado de
// React produzido pelo agendamento do `useCareSystem` — coisa que o overlay não
// tem e não deveria ter. (…) O conserto certo é extrair um `cleanPoop()` para
// `src/utils/poopDrain.ts`".
//
// Por que a regra é do `poopDrain.ts` e não de um arquivo novo: quem decide se
// há sujeira é `applyPoopDrain` — `poopEventsShown` menos `poopEventsCompleted`,
// mais o `poopPenaltyClockAt`. Limpar é escrever exatamente essas três coisas.
// Separar o par leitura/escrita em dois arquivos é como a terceira cópia nasce
// (footgun 9). Por isso os testes de baixo não conferem a FORMA do objeto: eles
// EXECUTAM `applyPoopDrain` sobre o resultado e exigem que ela pare de cobrar —
// o mesmo critério que o teste de paridade do desktop já usa.
// ---------------------------------------------------------------------------

const LIMPO_ONTEM = new Date('2026-08-25T12:00:00Z').toDateString();

function sujo(over: Record<string, unknown> = {}) {
  return {
    healthPoints: 4,
    poopEventsScheduled: [1000, 2000],
    poopEventsShown: [0, 1],
    poopEventsCompleted: [] as number[],
    poopPenaltyClockAt: 0,
    lastResetDate: LIMPO_ONTEM,
    ...over,
  };
}

describe('cleanPoop — o banho, como regra pura', () => {
  it('o cocô do `careEvent` é achado pelo HORÁRIO AGENDADO, não por índice cru', () => {
    const { state, refused } = cleanPoop(sujo(), { at: 2000 });
    expect(refused).toBeUndefined();
    // 2000 é o índice 1 de `poopEventsScheduled`.
    expect(state.poopEventsCompleted).toEqual([1]);
  });

  it('horário que não está na agenda é RECUSADO e não escreve nada', () => {
    const antes = sujo();
    const { state, refused } = cleanPoop(antes, { at: 999999 });
    expect(refused).toBe('not-scheduled');
    expect(state).toBe(antes);
  });

  it('sem `at` o banho limpa TUDO que está na tela (o caso do overlay do desktop)', () => {
    const { state } = cleanPoop(sujo({ poopEventsShown: [0, 1], poopEventsCompleted: [0] }));
    expect(state.poopEventsCompleted).toEqual([0, 1]);
  });

  it('já limpo e relógio parado: recusa, porque o save não mudaria em byte nenhum', () => {
    const antes = sujo({ poopEventsShown: [0], poopEventsCompleted: [0] });
    const { state, refused } = cleanPoop(antes);
    expect(refused).toBe('already-clean');
    expect(state).toBe(antes);
  });

  it('não duplica o índice quando o mesmo cocô é limpo duas vezes', () => {
    const um = cleanPoop(sujo(), { at: 1000 }).state;
    const dois = cleanPoop(um, { at: 1000 }).state;
    expect(dois.poopEventsCompleted).toEqual([0]);
  });

  it('PARA O RELÓGIO — provado executando `applyPoopDrain`, não conferindo a forma', () => {
    const agora = Date.parse('2026-08-26T12:00:00Z');
    // 12h de cocô na tela: sem banho, o dreno cobraria.
    const antes = sujo({ poopPenaltyClockAt: agora - 2 * POOP_DRAIN_PERIOD_MS });
    expect(applyPoopDrain(antes, { now: agora, isSleeping: false }).healthPoints).toBeLessThan(4);

    const depois = cleanPoop(antes, { at: 1000 }).state;
    // Um único cocô limpo já basta? Não: o índice 1 continua sujo. O relógio
    // para mesmo assim, porque é isso que o `handleCareEventComplete` sempre
    // fez — e é o dreno, não esta função, quem decide se volta a correr.
    expect(depois.poopPenaltyClockAt).toBe(0);
    expect(applyPoopDrain(depois, { now: agora, isSleeping: false }).healthPoints).toBe(4);
  });

  it('banho completo deixa `applyPoopDrain` sem nada para cobrar, para sempre', () => {
    const agora = Date.parse('2026-08-26T12:00:00Z');
    const limpo = cleanPoop(sujo({ poopPenaltyClockAt: agora - 10 * POOP_DRAIN_PERIOD_MS })).state;
    const muito_depois = agora + 30 * POOP_DRAIN_PERIOD_MS;
    expect(applyPoopDrain(limpo, { now: muito_depois, isSleeping: false }).healthPoints).toBe(4);
  });

  it('save antigo sem os campos não explode (regra do `?? padrão` do CLAUDE.md)', () => {
    const velho = { healthPoints: 3, poopPenaltyClockAt: 0 };
    expect(cleanPoop(velho).refused).toBe('already-clean');
    expect(cleanPoop(velho, { at: 1 }).refused).toBe('not-scheduled');
  });
});

// ---------------------------------------------------------------------------
// FONTE ÚNICA — extrair sem trocar o chamador cria a TERCEIRA cópia da regra
// (App.tsx, desktop e agora `poopDrain.ts`), que é exatamente o footgun 9. O
// teste de comportamento acima passaria feliz com o `App.tsx` intacto, então
// este guard é o que impede a extração de virar decoração.
// ---------------------------------------------------------------------------
describe('App.tsx usa a função extraída, e não uma cópia', () => {
  const app = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

  it('importa `cleanPoop` de utils/poopDrain', () => {
    expect(app).toMatch(/cleanPoop[^;]*from '\.\/utils\/poopDrain'/s);
  });

  it('não sobrou escrita crua de `poopEventsCompleted` no App.tsx', () => {
    expect(app).not.toMatch(/poopEventsCompleted:\s*\[/);
  });
});
