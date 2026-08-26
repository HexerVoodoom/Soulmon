import { describe, it, expect } from 'vitest';
import * as monetization from './monetization';
import { activityCapFor, canCreateActivity, DEMO_ACTIVITY_TOTAL_CAP } from './monetization';
import { FORM_REQUIREMENTS } from '../types/progression';

/**
 * A FRONTEIRA NOVA DO GRÁTIS (D-12) — a regra, não a fiação.
 *
 * O guard de fiação (`activityCreate.contract.test.ts`) prova que todo caminho
 * de criação PASSA por aqui. Este arquivo prova o que a regra DECIDE, e ela
 * mudou de eixo: saiu de "quantas você pode criar HOJE" para "quantas podem
 * existir ATIVAS", que é o mesmo eixo do pagante no Rookie.
 *
 * As três afirmações que este arquivo trava, e por que cada uma dói se cair:
 *
 *  1. **Não existe mais teto diário.** Ele racionava o verbo central do produto
 *     (`docs/PLANO-PRODUTO.md:70` lista "trancar cuidado atrás de paywall" como
 *     NÃO-objetivo) e não protegia custo nenhum: a IA, o Oráculo e a criatura
 *     única — que são o COGS — já estavam trancados em outro lugar.
 *  2. **Tarefa avulsa nunca consome teto.** No desenho antigo um hábito e uma
 *     tarefa de hoje custavam o MESMO um-por-dia: quem anotava "ligar pro
 *     médico" gastava o orçamento inteiro do dia na coisa de menor valor, e
 *     punir o uso espontâneo é punir exatamente o que gera a métrica-norte.
 *  3. **O teto do demo não SOBE com a evolução.** É aqui que a paywall passa a
 *     cair, e ela cai sobre o diferencial: 7/8/9/10 são consequência de ter uma
 *     árvore própria, e a árvore própria é o que se compra.
 */
describe('a fronteira nova: teto TOTAL de ativas, não teto diário', () => {
  it('o teto do demo é o mesmo teto que o PAGANTE tem no Rookie — nem um a menos', () => {
    // Não é um número escolhido: é `FORM_REQUIREMENTS.rookie.cap`. Se um dia a
    // escada mudar, o demo acompanha sem ninguém lembrar de vir aqui.
    expect(DEMO_ACTIVITY_TOTAL_CAP).toBe(FORM_REQUIREMENTS.rookie.cap);
    expect(activityCapFor('demo', FORM_REQUIREMENTS.rookie.cap))
      .toBe(activityCapFor('paid', FORM_REQUIREMENTS.rookie.cap));
  });

  it('evoluir eleva o teto do PAGANTE (7/8/9/10) e NÃO eleva o do demo', () => {
    const escada = [
      FORM_REQUIREMENTS.champion.cap,
      FORM_REQUIREMENTS.ultimate.cap,
      FORM_REQUIREMENTS.mega.cap,
      FORM_REQUIREMENTS.ultra.cap,
    ];
    for (const cap of escada) {
      expect(activityCapFor('paid', cap), `pagante em teto ${cap}`).toBe(cap);
      expect(activityCapFor('demo', cap), `demo em teto ${cap}`).toBe(DEMO_ACTIVITY_TOTAL_CAP);
    }
    // A escada precisa MESMO subir, senão o teste acima passaria por acidente.
    expect(escada.every(c => c > DEMO_ACTIVITY_TOTAL_CAP)).toBe(true);
  });

  it('o demo cria hábitos até o teto total — e não há teto DIÁRIO nenhum no caminho', () => {
    const stageCap = FORM_REQUIREMENTS.rookie.cap;
    // Seis criações seguidas, no MESMO dia: o regime antigo reprovava a segunda.
    for (let n = 0; n < DEMO_ACTIVITY_TOTAL_CAP; n++) {
      expect(
        canCreateActivity({ tier: 'demo', kind: 'habit', habitCount: n, stageCap }),
        `hábito nº ${n + 1} no mesmo dia`,
      ).toBe(true);
    }
    // E o teto morde no total, não no dia.
    expect(canCreateActivity({
      tier: 'demo', kind: 'habit', habitCount: DEMO_ACTIVITY_TOTAL_CAP, stageCap,
    })).toBe(false);
  });

  it('tarefa avulsa NUNCA consome nem respeita o teto — nem com a lista estourada', () => {
    for (const tier of ['demo', 'paid'] as const) {
      expect(canCreateActivity({
        tier, kind: 'task', habitCount: 999, stageCap: FORM_REQUIREMENTS.rookie.cap,
      }), `tarefa avulsa (${tier})`).toBe(true);
    }
  });

  it('o pagante que evoluiu passa dos 6 hábitos; o demo, no mesmo estágio, não', () => {
    const cap = FORM_REQUIREMENTS.mega.cap; // 9
    expect(canCreateActivity({ tier: 'paid', kind: 'habit', habitCount: 6, stageCap: cap })).toBe(true);
    expect(canCreateActivity({ tier: 'demo', kind: 'habit', habitCount: 6, stageCap: cap })).toBe(false);
  });

  it('o teto DIÁRIO não voltou pela porta dos fundos', () => {
    // Regressão nominal: as quatro peças do regime antigo saíram do módulo.
    // Um `export` que volta é a fronteira antiga voltando junto, em silêncio.
    for (const morto of [
      'DEMO_ACTIVITY_DAILY_CAP',
      'canCreateDemoTaskToday',
      'recordDemoCreation',
      'getDemoCreationsToday',
    ]) {
      expect(monetization, `${morto} ressuscitou`).not.toHaveProperty(morto);
    }
  });
});
