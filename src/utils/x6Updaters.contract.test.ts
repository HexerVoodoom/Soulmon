import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
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
  // ⚰️ `handleInstantHealWithCredits` estava aqui até 06/09/2026. A peça foi
  // REMOVIDA (D7+D15), então o guard de delegação virou o guard de ausência,
  // logo abaixo — que é mais forte: em vez de exigir que a cobrança dupla seja
  // impossível, exige que a cobrança não exista.
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

  /**
   * D7 + D15 (06/09/2026) — **dinheiro não compra a barra de cuidado, e não é
   * mais uma questão de teto ou de trava: a venda não existe.**
   *
   * Eram DOIS caminhos, e é por isso que este guard tem duas metades. O direto
   * cobrava 10 Créditos por um coração. O indireto ninguém tinha notado: o
   * câmbio `BITS_EXCHANGE` troca 1 Crédito por 10 Bits, e o coraçãozinho
   * custava 150 Bits na loja — 15 Créditos por +1 coração, sem cap. Remover só
   * o primeiro deixaria o segundo, que é o mesmo negócio com um passo a mais.
   *
   * O item continua existindo: ele só não se compra. Vem da masmorra e se usa
   * pela pastinha (`SPECIAL_ITEMS`, catálogo de USO), então ninguém perde o que
   * já tinha.
   */
  it('não existe caminho de dinheiro para HP: nem o direto, nem o câmbio', () => {
    expect(corpoDe(fonte(), 'handleInstantHealWithCredits'),
      'a cura instantânea por Créditos voltou ao App.tsx').toBeNull();
    const appTexto = readFileSync(path.join(SRC, 'App.tsx'), 'utf-8');
    expect(appTexto.replace(/\/\*[\s\S]*?\*\//g, ''),
      'o módulo da cura paga voltou a ser importado').not.toMatch(/instantHeal/);

    const shop = readFileSync(path.join(SRC, 'utils/shop.ts'), 'utf-8');
    const catalogo = shop.slice(shop.indexOf('SHOP_ITEMS'), shop.indexOf('SPECIAL_ITEMS'));
    expect(catalogo, 'o coraçãozinho voltou à loja — e Créditos compram Bits')
      .not.toMatch(/id: 'heart-item'/);

    // A outra metade da verdade: o item CONTINUA curável fora da loja.
    expect(shop, 'o coraçãozinho sumiu do catálogo de USO — isso quebraria quem já tem um')
      .toMatch(/\[HEART_ITEM_EMOJI\]:/);
  });

  it('nenhum preço em Créditos aponta para HP', () => {
    const mon = readFileSync(path.join(SRC, 'utils/monetization.ts'), 'utf-8');
    const vivos = mon.replace(/\/\/.*$/gm, '');
    expect(vivos, 'um custo em Créditos para curar voltou a existir').not.toMatch(/HEART_COST_CREDITS\s*=/);
  });
});
