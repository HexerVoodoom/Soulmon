import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { ts, fonteDe, type No } from '../test/tsAst';

/**
 * O GUARD DE ELO do dia do jogador — no AST, porque o defeito é de FIAÇÃO.
 *
 * ## Por que este arquivo existe
 *
 * `playerDayKey` pode estar perfeita e testada, e o bug continuar de pé: basta
 * o `App.tsx` seguir chamando `new Date().toDateString()` (ou `dayKeyOf`) nos
 * gestos que gravam registro diário no save. Um teste de `playerDay.ts` não
 * pega isso — ele testa a função, que está certa. É o mesmo formato do achado
 * F-1 (`spriteBirth.contract.test.ts`): a peça existia e ninguém a chamava.
 *
 * Teste TEXTUAL não serve aqui, e o repo já pagou essa lição: `/playerDayKey/`
 * sobre o `App.tsx` é satisfeita pelo import e pelos comentários que explicam a
 * decisão. Por isso a pergunta é feita ao AST, e é a pergunta certa: no ponto de
 * uso, QUEM produz a chave de dia?
 *
 * ## A régua: `A FAMÍLIA DO DIA DO JOGADOR`
 *
 * Este arquivo é a régua ÚNICA da família. Ele nasceu de duas frentes paralelas
 * (`playerDay.contract` e `noite.contract`), que descobriram o mesmo defeito em
 * pontos diferentes e escreveram guards quase idênticos. A fusão preservou cada
 * pergunta e trocou a duplicação por CINCO TABELAS NOMEADAS. Acrescentar um
 * registro diário novo à família é acrescentar UMA LINHA numa tabela — não
 * escrever um guard novo:
 *
 * | Tabela | Pergunta que ela faz | Onde |
 * |---|---|---|
 * | `HANDLERS`              | o handler deriva o dia de `playerDayKey`?      | `App.tsx`, corpo do handler |
 * | `CONSUMIDORAS_DE_DIA`   | o argumento que chega à função é o certo?      | `App.tsx`, todo ponto de chamada |
 * | `LISTAS_DIARIAS`        | a chave comparada contra a lista é do jogador? | `App.tsx`, todo `.some/.find/.filter` |
 * | `ESTADOS_COM_ANCORA`    | a âncora mora no ESTADO, não num parâmetro?    | módulos puros |
 * | `SEM_DIA_DO_APARELHO`   | o arquivo INTEIRO parou de nomear dia pelo aparelho? | módulos da noite |
 *
 * Mais o guard do save (`GameState` + `resolvePlayerDayAnchor` + `hydrateRest`),
 * que é único por natureza: existe UM ponto de load.
 *
 * ## O que este guard NÃO faz, de propósito
 *
 * Proibir `dayKeyOf` no `App.tsx` inteiro. Ela continua sendo a chave certa
 * para hábitos, streak, relatório semanal, fresh start e a virada — trocá-la é
 * a coisa que o cabeçalho de `playerDay.ts` proíbe. No `App.tsx` o guard é
 * cirúrgico: só os handlers e só os pontos de uso tabelados. A proibição de
 * ARQUIVO INTEIRO só vale em `SEM_DIA_DO_APARELHO`, onde todo nome de dia é
 * nome de MANHÃ, e manhã é do jogador.
 *
 * ## Custo
 *
 * O parser vem de `src/test/tsAst.ts` (`import` estático + `fonteDe` com cache).
 * Nenhum caso aqui faz `await import('typescript')` no corpo: aquele padrão foi
 * medido em 4× a 9,6× o custo, e é a assinatura mecânica do flake de
 * `sweeper/flake-assets-contract.md` — custo de módulo pago DENTRO do orçamento
 * do teste. Já foi pago uma vez; não volta.
 */

const SRC = path.resolve(__dirname, '..');

/** Os gestos que gravam (ou leem) registro diário de cuidado/ritual no save. */
const HANDLERS = [
  ['handlePet', 'teto de carinho — o resíduo do X-4'],
  ['handlePickMood', 'moodLog — uma entrada por dia do jogador'],
  ['handleCheckInConfirm', 'lastCheckInDate — o ritual é do jogador'],
  ['handleCheckInSkip', 'lastCheckInDate — pular carimba o dia do mesmo jeito'],
  ['handlePlay', 'playLog — brincar é 1×/dia do jogador (PLAY_TIMES_PER_DAY)'],
] as const;

/**
 * Funções que recebem o dia POR ARGUMENTO — e o argumento tem de ser o certo.
 *
 * Elas não são chamadas só de dentro de um handler nomeado: o `PlayCard` é
 * montado direto no JSX, e ali `canPlay`/`playedToday` recebem uma chave
 * calculada numa IIFE que nenhum guard de handler alcança; `nightmareDayKey`
 * é chamada de dentro de `useEffect` e de callbacks de `setGameState`. Como
 * TODAS as réguas têm de bater — a leitura da UI e a escrita do handler —, o
 * guard olha o ARGUMENTO em todo ponto de chamada do `App.tsx`. É o mesmo
 * defeito de fiação de sempre, só que a peça errada entra por um argumento em
 * vez de por uma linha de atribuição.
 *
 * Duas frentes escreveram este guard duas vezes, com um detalhe crucial
 * diferente, e por isso a tabela tem uma coluna de CRITÉRIO em vez de uma
 * suposição embutida:
 *
 * - `'chave'`  → o argumento é a chave de dia já formada, e tem de PROVAR que
 *   veio de `playerDayKey(...)` (direto ou por um nome local rastreado).
 * - `'ancora'` → o argumento é o fuso do save, e a função forma a chave lá
 *   dentro. Aqui o que se exige é que a ÂNCORA chegue: um segundo argumento
 *   esquecido é legal em TypeScript porque a âncora é opcional — ela precisa
 *   ser, para o save sem âncora continuar se comportando como antes.
 *
 * Confundir os dois critérios seria afrouxar o guard: exigir `playerDayKey` de
 * `nightmareDayKey(new Date(), tz)` daria vermelho eterno, e exigir só
 * `/playerDayTz/` de `play(state, key)` aceitaria `play(state, dayKeyOf(now))`.
 *
 * Colunas: [função, índice do argumento, critério, por que dói se faltar].
 */
const CONSUMIDORAS_DE_DIA = [
  ['play', 1, 'chave',
    'playLog — a escrita do brincar'],
  ['canPlay', 1, 'chave',
    'o PlayCard mostraria "vamos brincar" e o clique responderia "já brincamos hoje"'],
  ['playedToday', 1, 'chave',
    'a mesma régua da UI, do outro lado do card'],
  ['nightmareDayKey', 1, 'ancora',
    'markFought carimba o que ela devolve e hasPendingNightmare pergunta pelo mesmo nome: '
    + 'se a escrita usasse o dia do aparelho e o portão o do jogador, fechar a luta não a '
    + 'fecharia — o pesadelo voltaria a cada abertura, para sempre'],
] as const;

/**
 * Listas de registro diário do save que são procuradas POR CHAVE DE DIA.
 *
 * O efeito do sonho da manhã faz `rest.nights.some(n => n.date === key)`. Nenhum
 * guard de HANDLER alcança isso — é um `useEffect`, não um `const handleX =`. E
 * `dayKeyOf(now)` ali compilava perfeitamente, perguntando pelo nome do dia do
 * aparelho a uma lista carimbada com o nome do dia do jogador: a manhã inteira
 * (sonho E pesadelo) sumia em silêncio.
 *
 * Colunas: [propriedade da lista, campo de dia dentro do item, por quê].
 */
const LISTAS_DIARIAS = [
  ['nights', 'date', 'as noites do descanso — o sonho e o pesadelo da manhã'],
] as const;

/**
 * Os estados que carregam a âncora DENTRO de si, e não num parâmetro novo.
 *
 * Parâmetro é coisa que quem chama esquece — e um chamador que esquecesse
 * voltaria em SILÊNCIO ao dia do aparelho, compilando. Vindo do estado, o
 * desktop e o celular herdam a âncora sem uma segunda fiação. É a mesma razão
 * pela qual `petPassive` mora no estado (X-6).
 *
 * A âncora da noite mora SÓ em `RestState`: `nightmares.ts` é a camada de cima
 * e lê a de `rest`, em vez de guardar uma cópia própria em `NightmareState` —
 * duas âncoras seriam duas verdades sobre qual noite é hoje, e o portão e a
 * escrita voltariam a poder discordar.
 */
const ESTADOS_COM_ANCORA = [
  ['utils/poopDrain.ts', 'PoopDrainState'],
  ['utils/rituals.ts', 'RitualState'],
  // `needsAttention` decide sozinha se oferece brincar, e para isso precisa
  // saber que dia é hoje sem que ninguém lhe passe a chave.
  ['utils/petNeeds.ts', 'PetNeedsState'],
  ['utils/restWindow.ts', 'RestState'],
] as const;

/**
 * Arquivos onde a proibição de `toDateString()` é do ARQUIVO INTEIRO.
 *
 * `toDateString()` é o bug escrito por extenso. Aqui a proibição pode ser total
 * (e não cirúrgica como no `App.tsx`): nestes módulos, todo nome de dia é nome
 * de MANHÃ, e manhã é do jogador.
 */
const SEM_DIA_DO_APARELHO = [
  'utils/restWindow.ts',
  'utils/nightmares.ts',
] as const;

/** O ponto de load: onde a âncora é resolvida e distribuída. */
const APP = 'App.tsx';
const CONTEXTO = 'contexts/GameStateContext.tsx';

const fonte = (rel: string) => fonteDe(path.join(SRC, rel));

/**
 * Percorre `sf` mantendo, em ordem de código, o conjunto de nomes locais que
 * provaram vir de `playerDayKey(...)`, e chama `aoVisitar` em cada nó com o
 * predicado `vemDoJogador` já atualizado.
 *
 * Duas passadas não são necessárias — e seriam PIORES: no `App.tsx` a chave é
 * sempre declarada antes de ser usada, e uma passada prévia de coleta aceitaria
 * um uso-antes-da-declaração que a ordem de código reprova. Menos suspeitos é
 * guard mais fraco.
 */
function comRastreioDeChave(
  sf: ts.SourceFile,
  aoVisitar: (n: No, vemDoJogador: (e: No) => boolean) => void,
): Set<string> {
  const doJogador = new Set<string>();

  const vemDoJogador = (n: No): boolean => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
      return n.expression.text === 'playerDayKey';
    }
    return ts.isIdentifier(n) && doJogador.has(n.text);
  };

  const anda = (n: No): void => {
    if (
      ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer
      && vemDoJogador(n.initializer)
    ) {
      doJogador.add(n.name.text);
    }
    aoVisitar(n, vemDoJogador);
    ts.forEachChild(n, anda);
  };
  anda(sf);

  return doJogador;
}

/** O campo da âncora existe na interface `tipo` declarada em `sf`? */
function temAncoraNoTipo(sf: ts.SourceFile, tipo: string): boolean {
  let achou = false;
  const visita = (n: No): void => {
    if (ts.isInterfaceDeclaration(n) && n.name.text === tipo) {
      achou = n.members.some(
        m => ts.isPropertySignature(m) && m.name.getText(sf) === 'playerDayTz',
      );
    }
    ts.forEachChild(n, visita);
  };
  visita(sf);
  return achou;
}


describe('a fiação do dia do jogador existe (guard de elo, no AST)', () => {
  it('os handlers diários derivam o dia de `playerDayKey`, e nunca do aparelho', () => {
    const sf = fonte(APP);

    /** nome do handler → as chamadas que produzem chave de dia no corpo dele. */
    const chamadas = new Map<string, string[]>();

    const corpoDe = (node: No, nome: string) => {
      const encontradas: string[] = [];
      const anda = (n: No): void => {
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

    const visita = (node: No): void => {
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

  it('toda consumidora de dia do App.tsx recebe o argumento certo (chave do jogador ou âncora do save)', () => {
    const sf = fonte(APP);

    /** função → pontos de chamada suspeitos. */
    const suspeitas = new Map<string, string[]>();
    /** função → quantas chamadas o guard chegou a ver. */
    const vistas = new Map<string, number>();
    for (const [fn] of CONSUMIDORAS_DE_DIA) {
      suspeitas.set(fn, []);
      vistas.set(fn, 0);
    }

    const doJogador = comRastreioDeChave(sf, (n, vemDoJogador) => {
      if (!(ts.isCallExpression(n) && ts.isIdentifier(n.expression))) return;
      const linha = CONSUMIDORAS_DE_DIA.find(([fn]) => fn === n.expression.getText(sf));
      if (!linha) return;
      const [fn, idx, criterio] = linha;

      vistas.set(fn, (vistas.get(fn) ?? 0) + 1);
      const arg = n.arguments[idx];
      const ok = criterio === 'chave'
        ? !!arg && vemDoJogador(arg)
        // A âncora é opcional na assinatura: ausente compila, e é o defeito.
        : !!arg && /playerDayTz/.test(arg.getText(sf));
      if (!ok) suspeitas.get(fn)!.push(`${fn}(… ${arg ? arg.getText(sf) : '—'} …)`);
    });

    expect(
      doJogador.size,
      'nenhuma chave de `playerDayKey` no App.tsx — o guard ficou cego',
    ).toBeGreaterThan(0);

    for (const [fn, , criterio, porque] of CONSUMIDORAS_DE_DIA) {
      expect(
        vistas.get(fn),
        `nenhuma chamada a ${fn} no App.tsx — o guard ficou cego`,
      ).toBeGreaterThan(0);
      expect(
        suspeitas.get(fn),
        criterio === 'chave'
          ? `${fn} (${porque}) recebe uma chave de dia que não é a do JOGADOR`
          : `${fn} (${porque}) é chamada sem a âncora do save: nomeia o dia pelo APARELHO`,
      ).toEqual([]);
    }
  });

  it('a chave comparada contra as listas diárias do save vem de `playerDayKey`', () => {
    const sf = fonte(APP);

    /** lista → comparações suspeitas. */
    const suspeitas = new Map<string, string[]>();
    /** lista → quantas comparações o guard chegou a ver. */
    const vistas = new Map<string, number>();
    for (const [lista] of LISTAS_DIARIAS) {
      suspeitas.set(lista, []);
      vistas.set(lista, 0);
    }

    comRastreioDeChave(sf, (n, vemDoJogador) => {
      if (!(
        ts.isCallExpression(n)
        && ts.isPropertyAccessExpression(n.expression)
        && ['some', 'find', 'filter'].includes(n.expression.name.text)
      )) return;
      const alvo = n.expression.expression.getText(sf);
      const linha = LISTAS_DIARIAS.find(([lista]) => new RegExp(`\\.${lista}$`).test(alvo));
      if (!linha) return;
      const [lista, campo] = linha;

      const dentro = (m: No): void => {
        if (
          ts.isBinaryExpression(m)
          && m.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken
          && new RegExp(`\\.${campo}$`).test(m.left.getText(sf))
        ) {
          vistas.set(lista, (vistas.get(lista) ?? 0) + 1);
          if (!vemDoJogador(m.right)) suspeitas.get(lista)!.push(m.getText(sf));
        }
        ts.forEachChild(m, dentro);
      };
      n.arguments.forEach(dentro);
    });

    for (const [lista, campo, porque] of LISTAS_DIARIAS) {
      expect(
        vistas.get(lista),
        `nenhuma comparação com \`.${campo}\` sobre \`.${lista}\` — o guard ficou cego`,
      ).toBeGreaterThan(0);
      expect(
        suspeitas.get(lista),
        `esta comparação (${porque}) procura o registro pelo nome do dia do APARELHO`,
      ).toEqual([]);
    }
  });

  it('os módulos puros leem a âncora do ESTADO, e não de um parâmetro novo', () => {
    for (const [arquivo, tipo] of ESTADOS_COM_ANCORA) {
      expect(
        temAncoraNoTipo(fonte(arquivo), tipo),
        `${tipo} (${arquivo}) não carrega playerDayTz no estado`,
      ).toBe(true);
    }
  });

  it('os módulos da noite não nomeiam mais nenhum dia pelo APARELHO', () => {
    for (const rel of SEM_DIA_DO_APARELHO) {
      const sf = fonte(rel);
      const achadas: string[] = [];
      const anda = (n: No): void => {
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

  it('o save resolve a âncora no load E a entrega dentro do `rest`', () => {
    // A âncora só resolve alguma coisa se MORAR NO SAVE: é a viagem pela nuvem
    // que faz os dois aparelhos concordarem. Resolvida e não persistida, cada
    // aparelho voltaria a inventar a dele — o bug com mais código.
    //
    // E não basta resolver: podia estar gravada em `GameState.playerDayTz` e o
    // bug seguir inteiro, porque quem batiza a manhã é `recordNight`, e ela lê
    // `state.playerDayTz` do `RestState`. Resolvida e não DISTRIBUÍDA é o mesmo
    // bug de fiação com mais código. As três perguntas moram juntas porque há
    // um só ponto de load — esta é a única parte da família que não é tabela.
    const sf = fonte(CONTEXTO);

    let atribuicaoResolvida = false;
    let restAncorado = false;
    const visita = (n: No): void => {
      if (
        ts.isPropertyAssignment(n)
        && n.name.getText(sf) === 'playerDayTz'
        && ts.isCallExpression(n.initializer)
        && ts.isIdentifier(n.initializer.expression)
        && n.initializer.expression.text === 'resolvePlayerDayAnchor'
      ) {
        atribuicaoResolvida = true;
      }
      if (
        ts.isPropertyAssignment(n)
        && n.name.getText(sf) === 'rest'
        && ts.isCallExpression(n.initializer)
        && ts.isIdentifier(n.initializer.expression)
        && n.initializer.expression.text === 'hydrateRest'
        && n.initializer.arguments.length >= 2
      ) {
        restAncorado = true;
      }
      ts.forEachChild(n, visita);
    };
    visita(sf);

    expect(
      temAncoraNoTipo(sf, 'GameState'),
      'GameState não tem playerDayTz: a âncora não viaja no save',
    ).toBe(true);
    expect(
      atribuicaoResolvida,
      'o load não chama resolvePlayerDayAnchor: save antigo nunca ganha âncora',
    ).toBe(true);
    expect(
      restAncorado,
      'hydrateRest é chamada sem âncora: o `rest` do save nomeia a noite pelo aparelho',
    ).toBe(true);
  });
});
