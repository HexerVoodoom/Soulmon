import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * O GUARD DE ELO da NOITE — no AST, porque o defeito é de FIAÇÃO.
 *
 * Irmão de `playerDay.contract.test.ts`, e escrito à parte de propósito: aquele
 * arquivo é de outra frente. O relatório do commit diz quais destes casos devem
 * ser FUNDIDOS lá depois, para a família inteira ficar sob um guard só.
 *
 * A lição é a do F-1 (`spriteBirth.contract.test.ts`) e a que este repo já
 * pagou duas vezes: `playerDayKey` pode estar perfeita e testada e o bug seguir
 * de pé, porque o defeito nunca esteve na função — está em QUEM produz a chave
 * no ponto de uso. Teste textual não serve: `/playerDayKey/` sobre o `App.tsx`
 * já é satisfeita pelo import e pelos comentários que explicam a decisão. Por
 * isso a pergunta é feita ao AST.
 *
 * O que este guard NÃO faz: proibir `dayKeyOf` no `App.tsx` inteiro. Ela
 * continua sendo a chave certa de hábito, streak, semana, fresh start e virada
 * — trocá-la é a coisa que o cabeçalho de `playerDay.ts` proíbe.
 */

const SRC = path.resolve(__dirname, '..');

async function carregarTs() {
  const mod = await import('typescript');
  return ((mod as { default?: typeof import('typescript') }).default
    ?? mod) as typeof import('typescript');
}

function fonte(ts: typeof import('typescript'), rel: string) {
  const p = path.join(SRC, rel);
  return ts.createSourceFile(
    p, fs.readFileSync(p, 'utf8'), ts.ScriptTarget.Latest, true,
    rel.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

describe('a fiação do dia do jogador na NOITE (guard de elo, no AST)', () => {
  it('`RestState` carrega a âncora no ESTADO, e não num parâmetro novo', async () => {
    // Parâmetro é coisa que quem chama esquece — e um chamador que esquecesse
    // voltaria em SILÊNCIO ao dia do aparelho, compilando. Mesma razão de
    // `PoopDrainState`, `RitualState` e `PetNeedsState` (b8296e0b, 4ef33d89).
    //
    // A âncora da noite mora SÓ em `RestState`: `nightmares.ts` é a camada de
    // cima e lê a de `rest`, em vez de guardar uma cópia própria em
    // `NightmareState` — duas âncoras seriam duas verdades sobre qual noite é
    // hoje, e o portão e a escrita voltariam a poder discordar.
    const ts = await carregarTs();
    const sf = fonte(ts, 'utils/restWindow.ts');
    let temCampo = false;
    const visita = (n: import('typescript').Node): void => {
      if (ts.isInterfaceDeclaration(n) && n.name.text === 'RestState') {
        temCampo = n.members.some(
          m => ts.isPropertySignature(m) && m.name.getText(sf) === 'playerDayTz',
        );
      }
      ts.forEachChild(n, visita);
    };
    visita(sf);
    expect(temCampo, 'RestState (utils/restWindow.ts) não carrega playerDayTz no estado').toBe(true);
  });

  it('os dois módulos da noite não nomeiam mais nenhum dia pelo APARELHO', async () => {
    // `toDateString()` é o bug escrito por extenso. Aqui a proibição pode ser
    // do ARQUIVO inteiro (e não cirúrgica como no App.tsx): nestes dois
    // módulos, todo nome de dia é nome de MANHÃ, e manhã é do jogador.
    const ts = await carregarTs();
    for (const rel of ['utils/restWindow.ts', 'utils/nightmares.ts']) {
      const sf = fonte(ts, rel);
      const achadas: string[] = [];
      const anda = (n: import('typescript').Node): void => {
        if (
          ts.isCallExpression(n)
          && ts.isPropertyAccessExpression(n.expression)
          && n.expression.name.text === 'toDateString'
        ) {
          achadas.push(n.getText(sf));
        }
        ts.forEachChild(n, anda);
      };
      anda(sf);
      expect(achadas, `${rel} ainda nomeia um dia pelo APARELHO`).toEqual([]);
    }
  });

  it('toda chamada a `nightmareDayKey` no App.tsx recebe a âncora do save', async () => {
    // Esta é a que mais dói se faltar: `markFought` carimba o que
    // `nightmareDayKey` devolve e `hasPendingNightmare` pergunta pelo mesmo
    // nome. Se a escrita usasse o dia do aparelho e o portão o do jogador,
    // fechar a luta não a fecharia — o pesadelo voltaria a cada abertura, para
    // sempre. As duas réguas TÊM de bater, e um segundo argumento esquecido é
    // legal em TypeScript porque a âncora é opcional (ela precisa ser, para o
    // save sem âncora continuar se comportando como antes).
    const ts = await carregarTs();
    const sf = fonte(ts, 'App.tsx');
    const suspeitas: string[] = [];
    let chamadas = 0;

    const anda = (n: import('typescript').Node): void => {
      if (
        ts.isCallExpression(n) && ts.isIdentifier(n.expression)
        && n.expression.text === 'nightmareDayKey'
      ) {
        chamadas++;
        const ancora = n.arguments[1];
        if (!ancora || !/playerDayTz/.test(ancora.getText(sf))) {
          suspeitas.push(n.getText(sf));
        }
      }
      ts.forEachChild(n, anda);
    };
    anda(sf);

    expect(chamadas, 'nenhuma chamada a nightmareDayKey no App.tsx — o guard ficou cego')
      .toBeGreaterThan(0);
    expect(suspeitas, 'estas chamadas nomeiam a manhã pelo dia do APARELHO').toEqual([]);
  });

  it('a chave comparada contra `rest.nights` no App.tsx vem de `playerDayKey`', async () => {
    // O efeito do sonho da manhã faz `rest.nights.some(n => n.date === key)`.
    // Nenhum guard de HANDLER alcança isso — é um `useEffect`, não um
    // `const handleX =`. E `dayKeyOf(now)` ali compilava perfeitamente,
    // perguntando pelo nome do dia do aparelho a uma lista carimbada com o nome
    // do dia do jogador: a manhã inteira (sonho E pesadelo) sumia em silêncio.
    const ts = await carregarTs();
    const sf = fonte(ts, 'App.tsx');

    /** Nomes locais que provaram vir de `playerDayKey(...)`. */
    const doJogador = new Set<string>();
    const suspeitas: string[] = [];
    let comparacoes = 0;

    const vemDoJogador = (n: import('typescript').Node): boolean => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
        return n.expression.text === 'playerDayKey';
      }
      return ts.isIdentifier(n) && doJogador.has(n.text);
    };

    const anda = (n: import('typescript').Node): void => {
      if (
        ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer
        && vemDoJogador(n.initializer)
      ) {
        doJogador.add(n.name.text);
      }
      // `<algo>.nights.some|find|filter(...)` — a lista de noites do save.
      if (
        ts.isCallExpression(n)
        && ts.isPropertyAccessExpression(n.expression)
        && ['some', 'find', 'filter'].includes(n.expression.name.text)
        && /\.nights$/.test(n.expression.expression.getText(sf))
      ) {
        const dentro = (m: import('typescript').Node): void => {
          if (
            ts.isBinaryExpression(m)
            && m.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken
            && /\.date$/.test(m.left.getText(sf))
          ) {
            comparacoes++;
            if (!vemDoJogador(m.right)) suspeitas.push(m.getText(sf));
          }
          ts.forEachChild(m, dentro);
        };
        n.arguments.forEach(dentro);
      }
      ts.forEachChild(n, anda);
    };
    anda(sf);

    expect(comparacoes, 'nenhuma comparação com `.date` sobre `rest.nights` — o guard ficou cego')
      .toBeGreaterThan(0);
    expect(
      suspeitas,
      'esta comparação procura a noite pelo nome do dia do APARELHO',
    ).toEqual([]);
  });

  it('o load entrega a âncora DENTRO do `rest` — senão ela não chega a quem nomeia a noite', async () => {
    // A âncora podia estar resolvida e gravada em `GameState.playerDayTz` e o
    // bug seguir inteiro: quem batiza a manhã é `recordNight`, e ela lê
    // `state.playerDayTz` do `RestState`. Resolvida e não distribuída, é o bug
    // de fiação com mais código.
    const ts = await carregarTs();
    const sf = fonte(ts, 'contexts/GameStateContext.tsx');
    let ancorado = false;
    const visita = (n: import('typescript').Node): void => {
      if (
        ts.isPropertyAssignment(n)
        && n.name.getText(sf) === 'rest'
        && ts.isCallExpression(n.initializer)
        && ts.isIdentifier(n.initializer.expression)
        && n.initializer.expression.text === 'hydrateRest'
        && n.initializer.arguments.length >= 2
      ) {
        ancorado = true;
      }
      ts.forEachChild(n, visita);
    };
    visita(sf);
    expect(
      ancorado,
      'hydrateRest é chamada sem âncora: o `rest` do save nomeia a noite pelo aparelho',
    ).toBe(true);
  });
});
