import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { ts, fonteDe, type No } from '../test/tsAst';

/**
 * O GUARD DA FAMÍLIA X-6 — regra dentro de updater inline não volta.
 *
 * ## O que esta família é
 *
 * A PROCEDÊNCIA do argumento dentro de um updater do React: a recusa é lida de
 * FORA do `setGameState` e o updater não a reconfere sobre o `prev`. Dois
 * toques no mesmo lote leem o mesmo estado e o segundo passa. Já apareceu em
 * `1be49bff` (carinho e comida), `96a62b86` (coraçãozinho), `f6716ec5` (energia
 * no desktop), `d9765d09` (energia sem conta), e a terceira varredura achou
 * mais três — as duas deste arquivo e a criação de hábito (travada em
 * `activityCreate.contract.test.ts`).
 *
 * **Nenhuma delas quebra o TypeScript.** É por isso que ela sobrevive a fatias
 * inteiras, e é por isso que a régua tem de ser esta e não o compilador.
 *
 * ## A pergunta, e por que ela não é frágil
 *
 * Não se pergunta se o handler *menciona* a função certa — import e comentário
 * satisfariam isso. Pergunta-se o que a **função-updater passada a
 * `setGameState` dentro daquele handler** faz: ela DELEGA ao dono da regra, ou
 * voltou a montar o objeto novo à mão?
 *
 * O guard fica vermelho para quem reintroduzir aritmética de saldo ou de vida
 * dentro do updater, e fica verde para qualquer refatoração que mantenha a
 * delegação — inclusive trocar o nome do handler, desde que o mapa abaixo
 * acompanhe. Um caminho de compra ou de cura NOVO não exige tocar aqui: exige
 * chamar o dono. É esse o ponto.
 */

const SRC = path.resolve(__dirname, '..');
const fonte = () => fonteDe(path.join(SRC, 'App.tsx'));

/**
 * [handler, o que o updater dele tem de chamar, o dano se voltar a decidir só
 * de fora].
 */
const DELEGACOES = [
  [
    'handleShopBuy',
    /applyShopBuy\s*\(/,
    'saldo exatamente igual ao preço + dois cliques = Bits/Emblemas NEGATIVOS, '
    + 'e o cenário entrando duas vezes na lista de posse',
  ],
  [
    'handleInstantHealWithCredits',
    /applyInstantHeal\s*\(/,
    'dois toques com a vida quase cheia = 10 Créditos de DINHEIRO REAL cobrados '
    + 'duas vezes, e a segunda cura ZERO',
  ],
] as const;

/** Aritmética que era feita à mão dentro do updater, e não pode voltar. */
const ARITMETICA_PROIBIDA = [
  [/\bgamePoints\s*:\s*\(?[^,\n]*-\s*item\.price/, 'o débito de Bits voltou para dentro do updater'],
  [/\bemblems\s*:\s*\(?[^,\n]*-\s*item\.price/, 'o débito de Emblemas voltou para dentro do updater'],
  [/healthPoints\s*:\s*Math\.min\(/, 'o clamp de vida voltou para dentro do updater'],
] as const;

/** O corpo (texto) da declaração `const nome = …` do App.tsx. */
function corpoDe(sf: ts.SourceFile, nome: string): string | null {
  let achado: string | null = null;
  const anda = (n: No): void => {
    if (
      ts.isVariableDeclaration(n) && ts.isIdentifier(n.name)
      && n.name.text === nome && n.initializer
    ) achado = n.initializer.getText(sf);
    ts.forEachChild(n, anda);
  };
  anda(sf);
  return achado;
}

/**
 * Os textos das funções-updater passadas a `setGameState` DENTRO da função
 * `nome`. É a fatia que interessa: o que roda com o `prev` na mão.
 */
function updatersDe(sf: ts.SourceFile, nome: string): string[] {
  const dentro: string[] = [];
  let alvo: No | null = null;
  const acha = (n: No): void => {
    if (
      ts.isVariableDeclaration(n) && ts.isIdentifier(n.name)
      && n.name.text === nome && n.initializer
    ) alvo = n.initializer;
    ts.forEachChild(n, acha);
  };
  acha(sf);
  if (!alvo) return dentro;
  const anda = (n: No): void => {
    if (
      ts.isCallExpression(n) && ts.isIdentifier(n.expression)
      && n.expression.text === 'setGameState' && n.arguments.length > 0
    ) {
      const arg = n.arguments[0];
      if (ts.isArrowFunction(arg) || ts.isFunctionExpression(arg)) dentro.push(arg.getText(sf));
    }
    ts.forEachChild(n, anda);
  };
  anda(alvo);
  return dentro;
}

describe('X-6: o updater reconfere a recusa sobre o `prev`, delegando ao dono da regra', () => {
  for (const [handler, chamada, dano] of DELEGACOES) {
    it(`${handler} delega o updater ao dono da regra`, () => {
      const sf = fonte();
      expect(corpoDe(sf, handler), `${handler} sumiu do App.tsx — o guard ficou cego`).not.toBeNull();

      const updaters = updatersDe(sf, handler);
      expect(updaters.length, `${handler} não chama mais setGameState — o guard ficou cego`)
        .toBeGreaterThan(0);
      for (const u of updaters) {
        expect(u, `updater de ${handler} decide sozinho de novo. Dano: ${dano}`).toMatch(chamada);
        for (const [proibida, porque] of ARITMETICA_PROIBIDA) {
          expect(proibida.test(u), `${porque} (${handler})`).toBe(false);
        }
      }
    });
  }

  it('a cura por Créditos TRAVA antes de gastar — a reconferência sozinha não devolve dinheiro', () => {
    const corpo = corpoDe(fonte(), 'handleInstantHealWithCredits')!;
    // O `await spendCredits` faz a janela ser maior que um lote do React, e o
    // gasto acontece no servidor ANTES do updater. Sem a trava, reconferir
    // impede a cura dupla e não impede a COBRANÇA dupla.
    expect(corpo, 'a trava de pedido em voo sumiu: dois toques voltam a cobrar duas vezes')
      .toMatch(/healInFlightRef\.current/);
    expect(
      corpo.indexOf('healInFlightRef.current = true'),
      'a trava tem de ser fechada ANTES do spendCredits, senão ela não trava nada',
    ).toBeLessThan(corpo.indexOf('spendCredits'));
  });
});
