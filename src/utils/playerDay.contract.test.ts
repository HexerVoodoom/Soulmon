import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * O GUARD DE ELO do dia do jogador — no AST, porque o defeito é de FIAÇÃO.
 *
 * `playerDayKey` pode estar perfeita e testada, e o bug continuar de pé: basta
 * o `App.tsx` seguir chamando `new Date().toDateString()` (ou `dayKeyOf`) nos
 * quatro gestos que gravam registro diário no save. Um teste de `playerDay.ts`
 * não pega isso — ele testa a função, que está certa. É o mesmo formato do
 * achado F-1 (`spriteBirth.contract.test.ts`): a peça existia e ninguém a
 * chamava.
 *
 * Teste TEXTUAL não serve aqui, e o repo já pagou essa lição: `/playerDayKey/`
 * sobre o `App.tsx` é satisfeita pelo import e pelos comentários que explicam a
 * decisão. Por isso a pergunta é feita ao AST, e é a pergunta certa: dentro do
 * corpo de cada handler nomeado, QUEM produz a chave de dia?
 *
 * O que este guard NÃO faz, de propósito: proibir `dayKeyOf` no `App.tsx`
 * inteiro. Ela continua sendo a chave certa para hábitos, streak, relatório
 * semanal, fresh start e a virada — trocá-la é a coisa que o cabeçalho de
 * `playerDay.ts` proíbe. O guard é cirúrgico: só os quatro handlers.
 */

const SRC = path.resolve(__dirname, '..');

/** Os gestos que gravam (ou leem) registro diário de cuidado/ritual no save. */
const HANDLERS = [
  ['handlePet', 'teto de carinho — o resíduo do X-4'],
  ['handlePickMood', 'moodLog — uma entrada por dia do jogador'],
  ['handleCheckInConfirm', 'lastCheckInDate — o ritual é do jogador'],
  ['handleCheckInSkip', 'lastCheckInDate — pular carimba o dia do mesmo jeito'],
] as const;

async function carregarTs() {
  const mod = await import('typescript');
  return ((mod as { default?: typeof import('typescript') }).default
    ?? mod) as typeof import('typescript');
}

describe('a fiação do dia do jogador existe (guard de elo, no AST)', () => {
  it('os quatro handlers diários derivam o dia de `playerDayKey`, e nunca do aparelho', async () => {
    const ts = await carregarTs();
    const arquivo = path.join(SRC, 'App.tsx');
    const sf = ts.createSourceFile(
      arquivo, fs.readFileSync(arquivo, 'utf8'),
      ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX,
    );

    /** nome do handler → as chamadas que produzem chave de dia no corpo dele. */
    const chamadas = new Map<string, string[]>();

    const corpoDe = (node: import('typescript').Node, nome: string) => {
      const encontradas: string[] = [];
      const anda = (n: import('typescript').Node): void => {
        if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
          const alvo = n.expression.text;
          if (alvo === 'playerDayKey' || alvo === 'dayKeyOf') encontradas.push(alvo);
        }
        // `new Date().toDateString()` — o defeito escrito por extenso.
        if (
          ts.isCallExpression(n)
          && ts.isPropertyAccessExpression(n.expression)
          && n.expression.name.text === 'toDateString'
        ) {
          encontradas.push('toDateString');
        }
        ts.forEachChild(n, anda);
      };
      anda(node);
      chamadas.set(nome, encontradas);
    };

    const visita = (node: import('typescript').Node): void => {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
        const nome = node.name.text;
        if (HANDLERS.some(([h]) => h === nome)) corpoDe(node.initializer, nome);
      }
      ts.forEachChild(node, visita);
    };
    visita(sf);

    for (const [nome, porque] of HANDLERS) {
      const achadas = chamadas.get(nome);
      expect(achadas, `${nome} sumiu do App.tsx — o guard ficou cego`).toBeDefined();
      expect(
        achadas,
        `${nome} (${porque}) não deriva o dia de playerDayKey`,
      ).toContain('playerDayKey');
      expect(
        achadas,
        `${nome} (${porque}) ainda usa o dia do APARELHO — é o bug, escrito por extenso`,
      ).not.toContain('toDateString');
      expect(
        achadas,
        `${nome} (${porque}) usa dayKeyOf, que é a chave do motor de hábitos e NÃO pode virar o dia do jogador`,
      ).not.toContain('dayKeyOf');
    }
  });

  it('os módulos puros leem a âncora do ESTADO, e não de um parâmetro novo', async () => {
    // Parâmetro é coisa que quem chama esquece — e um chamador que esquecesse
    // voltaria em SILÊNCIO ao dia do aparelho, compilando. Vindo do estado, o
    // desktop e o celular herdam a âncora sem uma segunda fiação. É a mesma
    // razão pela qual `petPassive` mora no estado (X-6).
    const ts = await carregarTs();
    for (const [arquivo, tipo] of [
      ['utils/poopDrain.ts', 'PoopDrainState'],
      ['utils/rituals.ts', 'RitualState'],
    ] as const) {
      const p = path.join(SRC, arquivo);
      const sf = ts.createSourceFile(
        p, fs.readFileSync(p, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS,
      );
      let temCampo = false;
      const visita = (n: import('typescript').Node): void => {
        if (ts.isInterfaceDeclaration(n) && n.name.text === tipo) {
          temCampo = n.members.some(
            m => ts.isPropertySignature(m) && m.name.getText(sf) === 'playerDayTz',
          );
        }
        ts.forEachChild(n, visita);
      };
      visita(sf);
      expect(temCampo, `${tipo} (${arquivo}) não carrega playerDayTz no estado`).toBe(true);
    }
  });

  it('o save grava a âncora no load — sem isso ela nunca chega ao segundo aparelho', async () => {
    // A âncora só resolve alguma coisa se MORAR NO SAVE: é a viagem pela nuvem
    // que faz os dois aparelhos concordarem. Resolvida e não persistida, cada
    // aparelho voltaria a inventar a dele — o bug com mais código.
    const ts = await carregarTs();
    const p = path.join(SRC, 'contexts/GameStateContext.tsx');
    const sf = ts.createSourceFile(
      p, fs.readFileSync(p, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX,
    );

    let campoNoTipo = false;
    let atribuicaoResolvida = false;
    const visita = (n: import('typescript').Node): void => {
      if (ts.isInterfaceDeclaration(n) && n.name.text === 'GameState') {
        campoNoTipo = n.members.some(
          m => ts.isPropertySignature(m) && m.name.getText(sf) === 'playerDayTz',
        );
      }
      if (
        ts.isPropertyAssignment(n)
        && n.name.getText(sf) === 'playerDayTz'
        && ts.isCallExpression(n.initializer)
        && ts.isIdentifier(n.initializer.expression)
        && n.initializer.expression.text === 'resolvePlayerDayAnchor'
      ) {
        atribuicaoResolvida = true;
      }
      ts.forEachChild(n, visita);
    };
    visita(sf);

    expect(campoNoTipo, 'GameState não tem playerDayTz: a âncora não viaja no save').toBe(true);
    expect(
      atribuicaoResolvida,
      'o load não chama resolvePlayerDayAnchor: save antigo nunca ganha âncora',
    ).toBe(true);
  });
});
