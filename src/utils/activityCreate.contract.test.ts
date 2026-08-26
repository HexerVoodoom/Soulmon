import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { ts, fonteDe, type No } from '../test/tsAst';

/**
 * O GUARD DE ELO DA CRIAÇÃO — no AST, porque o defeito é de FIAÇÃO.
 *
 * ## O defeito que este arquivo existe para não deixar voltar
 *
 * `DEMO_ACTIVITY_DAILY_CAP` era consultado em UM lugar (`CreateModal`), e o
 * `CreateModal` tinha UM ponto de abertura no app inteiro — dentro do
 * `EvolveTaskModal`. O botão principal de criar da tela inicial abria o
 * `EditModal`, que salvava por `handleSaveActivity`: sem consultar teto e sem
 * consumir cota. Mais dois caminhos faziam o mesmo (`handleAICreateActivity`,
 * `handleCompleteTutorial`). Resultado: a regra de monetização existia, estava
 * testada, e o caminho por onde as pessoas realmente criavam passava ao lado
 * dela. Trocar o número `1` por qualquer outro não mudava nada.
 *
 * Teste de `monetization.ts` não pega isso — a função estava certa. Teste
 * TEXTUAL também não: `/canCreateActivity/` sobre o `App.tsx` é satisfeita pelo
 * import e por qualquer comentário que explique a decisão. Por isso a pergunta
 * é feita ao AST, e ela é a pergunta certa: **quem escreve na lista?**
 *
 * ## A régua
 *
 * | Caso | Pergunta |
 * |---|---|
 * | portão único      | existe UM lugar no `App.tsx` que empurra item novo na lista, e é o portão? |
 * | o portão decide   | esse lugar consulta `canCreateActivity` antes de escrever? |
 * | o portão conta    | ele emite `activity_create` ao criar e `demo_cap_hit` ao recusar? |
 * | o teto é o efetivo| o que a UI mostra como teto passa por `activityCapFor`? |
 * | o regime antigo   | o teto diário não voltou ao `App.tsx`? |
 *
 * Acrescentar um caminho de criação novo (um widget, um deep link, um import)
 * NÃO exige tocar neste arquivo: exige chamar o portão. É esse o ponto — o
 * guard fica vermelho justamente para quem tentar criar por fora.
 */

const SRC = path.resolve(__dirname, '..');
const APP = 'App.tsx';
const fonte = () => fonteDe(path.join(SRC, APP));

/**
 * Os portões. Colunas: [nome da função, lista do save que ela escreve, por quê].
 *
 * São DOIS porque as duas listas têm regras diferentes — hábito respeita o teto
 * de ativas, tarefa avulsa nunca respeita nada (é o uso espontâneo, o gerador
 * da métrica-norte). Um portão só, com um `if`, esconderia essa diferença
 * dentro de um parâmetro em vez de a declarar.
 */
/**
 * A quarta coluna é COMO o portão consulta a regra, e ela diverge por um
 * motivo: desde o conserto de X-6 (instância 3) o hábito pergunta o teto DUAS
 * vezes — de fora, para a telemetria e para o retorno, e de novo DENTRO do
 * updater, sobre o `prev`. As duas passam por `fitHabitCreates`
 * (`utils/habitCreate.ts`), que é quem chama `canCreateActivity`. Exigir a
 * chamada literal aqui empurraria a regra de volta para dentro do `App.tsx` —
 * exatamente o que a extração desfez. O elo com `monetization.ts` continua
 * travado pelo teste seguinte, que confere o dono da pergunta.
 */
const PORTOES = [
  ['commitHabitCreate', 'activities', 'hábito: consome o teto de ativas', /fitHabitCreates\s*\(/],
  ['commitTaskCreate', 'tasks', 'tarefa avulsa: nunca consome teto, mas CONTA', /canCreateActivity\s*\(/],
] as const;

/** Nomes que o regime antigo (teto diário) usava. Nenhum pode voltar. */
const REGIME_ANTIGO = [
  'canCreateDemoTaskToday',
  'recordDemoCreation',
  'getDemoCreationsToday',
  'DEMO_ACTIVITY_DAILY_CAP',
] as const;

/** Props de JSX cujo valor é um TETO mostrado ao usuário. */
const TETOS_NA_UI = [
  ['activitiesCap', 'CreateModal — o botão Salvar desabilita por este número'],
  ['maxActivities', 'GameTutorialFlow — o lote do tutorial é cortado por este número'],
] as const;

/**
 * A função (nomeada) que CONTÉM o nó, subindo pelos pais.
 *
 * Sobe até achar uma `VariableDeclaration` com nome — que é como o `App.tsx`
 * declara todos os seus handlers (`const handleX = …`, `useCallback`) — ou uma
 * declaração de função. Devolve `'<solto>'` quando o nó está no corpo do
 * componente, fora de qualquer handler: esse caso é falha, não isenção.
 */
function funcaoQueContem(n: No): string {
  let p: No | undefined = n.parent;
  while (p) {
    if (ts.isVariableDeclaration(p) && ts.isIdentifier(p.name)) return p.name.text;
    if (ts.isFunctionDeclaration(p) && p.name) return p.name.text;
    p = p.parent;
  }
  return '<solto>';
}

/**
 * Todo ponto do arquivo que ESCREVE um item novo numa das listas do save.
 *
 * O formato procurado é o do próprio código: `{ …prev, lista: [...prev.lista,
 * novo] }` (ou com o item na frente). O que caracteriza CRIAÇÃO e distingue de
 * `.map` de edição e de `.filter` de remoção é o par arranjo-literal + spread
 * da lista anterior. `.map`/`.filter` não são arranjo literal, então saem sem
 * precisar de exceção escrita à mão — exceção é o que os guards deste repo
 * pagam caro quando alguém a copia.
 */
/**
 * O valor atribuído à lista contém, em algum lugar, um arranjo literal que
 * ESTENDE a lista anterior (`[...prev.tasks, novo]`)?
 *
 * A busca desce em vez de olhar só o topo porque o portão de tarefa escolhe a
 * ponta (`cond ? [novo, ...prev.tasks] : [...prev.tasks, novo]`) — as duas
 * listas do app já divergiam nisso. Olhar só o nó de cima deixaria o guard cego
 * exatamente para quem escrevesse a criação dentro de um ternário, que é a
 * forma mais provável de alguém contorná-lo sem perceber.
 */
function temArranjoQueEstende(no: No, lista: string, sf: ts.SourceFile): boolean {
  let achou = false;
  const anda = (n: No): void => {
    if (
      ts.isArrayLiteralExpression(n)
      && n.elements.some(
        e => ts.isSpreadElement(e) && new RegExp(`\\.${lista}$`).test(e.expression.getText(sf)),
      )
    ) achou = true;
    ts.forEachChild(n, anda);
  };
  anda(no);
  return achou;
}

function escritasDeCriacao(
  sf: ts.SourceFile,
  lista: string,
): Array<{ fn: string; texto: string; completo: string }> {
  const achados: Array<{ fn: string; texto: string; completo: string }> = [];
  const anda = (n: No): void => {
    if (
      ts.isPropertyAssignment(n)
      && ts.isIdentifier(n.name)
      && n.name.text === lista
      && temArranjoQueEstende(n.initializer, lista, sf)
    ) {
      achados.push({
        fn: funcaoQueContem(n),
        // `texto` é o recorte que entra na mensagem de erro; `completo` é o que
        // as perguntas sobre o CONTEÚDO da escrita usam — 90 caracteres cortam
        // a chamada que reconfere o teto.
        texto: n.getText(sf).slice(0, 90),
        completo: n.getText(sf),
      });
    }
    ts.forEachChild(n, anda);
  };
  anda(sf);
  return achados;
}

/** O corpo (como texto) da função nomeada `nome`, ou `null` se ela sumiu. */
function corpoDe(sf: ts.SourceFile, nome: string): string | null {
  let achado: string | null = null;
  const anda = (n: No): void => {
    if (
      ts.isVariableDeclaration(n) && ts.isIdentifier(n.name)
      && n.name.text === nome && n.initializer
    ) {
      achado = n.initializer.getText(sf);
    }
    ts.forEachChild(n, anda);
  };
  anda(sf);
  return achado;
}

/** Nomes locais do arquivo cujo valor prova ter vindo de `activityCapFor(...)`. */
function nomesDoTetoEfetivo(sf: ts.SourceFile): Set<string> {
  const nomes = new Set<string>();
  const veioDoTeto = (e: No): boolean => {
    if (ts.isCallExpression(e) && ts.isIdentifier(e.expression)) {
      return e.expression.text === 'activityCapFor';
    }
    return ts.isIdentifier(e) && nomes.has(e.text);
  };
  const anda = (n: No): void => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer && veioDoTeto(n.initializer)) {
      nomes.add(n.name.text);
    }
    ts.forEachChild(n, anda);
  };
  anda(sf);
  return nomes;
}

describe('todo caminho de criação passa pelo mesmo portão (guard de elo, no AST)', () => {
  it('só o portão escreve item novo na lista — nenhum caminho cria por fora', () => {
    const sf = fonte();

    for (const [portao, lista, porque] of PORTOES) {
      const escritas = escritasDeCriacao(sf, lista);
      expect(
        escritas.length,
        `nenhuma criação em \`${lista}\` no App.tsx — o guard ficou cego`,
      ).toBeGreaterThan(0);

      const forasteiras = escritas.filter(e => e.fn !== portao);
      expect(
        forasteiras.map(e => `${e.fn}: ${e.texto}`),
        `estes escrevem em \`${lista}\` sem passar por ${portao} (${porque}). `
        + 'É EXATAMENTE o vazamento de D-12 renascendo: a regra existe e o caminho passa ao lado.',
      ).toEqual([]);
    }
  });

  it('o portão CONSULTA a regra antes de escrever, e a regra mora em monetization.ts', () => {
    const sf = fonte();
    for (const [portao, , porque, pergunta] of PORTOES) {
      const corpo = corpoDe(sf, portao);
      expect(corpo, `${portao} sumiu do App.tsx — o guard ficou cego`).not.toBeNull();
      expect(
        corpo!,
        `${portao} (${porque}) escreve sem perguntar o teto (${pergunta})`,
      ).toMatch(pergunta);
    }
  });

  /**
   * O elo do hábito: quem responde `fitHabitCreates` tem de ser a
   * `canCreateActivity` de `monetization.ts`, e não um número reescrito à mão.
   * Sem esta pergunta, a extração do X-6 teria aberto a porta para o teto
   * migrar de dono sem ninguém ver.
   */
  it('quem o portão de hábito consulta é `canCreateActivity`, do dono de sempre', () => {
    const fitFonte = fonteDe(path.join(SRC, 'utils', 'habitCreate.ts'));
    const texto = fitFonte.getFullText();
    expect(texto, 'habitCreate.ts deixou de importar a regra de monetization.ts')
      .toMatch(/import\s*\{[^}]*canCreateActivity[^}]*\}\s*from\s*'\.\/monetization'/);
    expect(texto, 'fitHabitCreates parou de chamar canCreateActivity — o teto virou número solto')
      .toMatch(/canCreateActivity\s*\(/);
  });

  /**
   * ⚠️ X-6, instância 3: a decisão do teto tem de ser reconferida DENTRO do
   * updater. Enquanto ela era tomada só de fora, duas criações no mesmo lote do
   * React liam a mesma contagem e ambas passavam. O guard pergunta ao AST se a
   * escrita em `activities` dentro do portão passa por `fitHabitCreates` — o
   * `prev` é o único estado que o updater tem para reconferir.
   */
  it('a escrita do portão de hábito reconfere o teto sobre o `prev` (X-6)', () => {
    const sf = fonte();
    const escritas = escritasDeCriacao(sf, 'activities');
    expect(escritas.length).toBeGreaterThan(0);
    for (const e of escritas) {
      expect(
        e.completo,
        'o updater voltou a escrever a lista sem reconferir o teto sobre o `prev` — '
        + 'é a família X-6 renascendo: dois toques no mesmo lote furam activityCapFor',
      ).toMatch(/fitHabitCreates\s*\(/);
    }
  });

  it('o portão CONTA: `activity_create` ao criar, `demo_cap_hit` ao recusar', () => {
    const sf = fonte();
    for (const [portao] of PORTOES) {
      const corpo = corpoDe(sf, portao)!;
      expect(
        corpo,
        `${portao} cria sem emitir activity_create — o caminho fica invisível no agregado`,
      ).toMatch(/track\(\s*'activity_create'/);
    }
    // `demo_cap_hit` é o DENOMINADOR da pergunta "o teto é a fronteira certa?".
    // Ele só faz sentido onde existe recusa — e recusa só existe para hábito.
    expect(
      corpoDe(sf, 'commitHabitCreate')!,
      'a recusa do teto não é contada: `unlock_view` de task-limit viraria um '
      + 'numerador sem denominador, e nenhuma taxa seria calculável',
    ).toMatch(/track\(\s*'demo_cap_hit'/);
  });

  it('o teto que a UI mostra é o EFETIVO (passa por `activityCapFor`), nunca o cru do estágio', () => {
    const sf = fonte();
    const efetivos = nomesDoTetoEfetivo(sf);
    expect(
      efetivos.size,
      'nenhum valor derivado de activityCapFor no App.tsx — o guard ficou cego',
    ).toBeGreaterThan(0);

    const vistas = new Map<string, number>(TETOS_NA_UI.map(([p]) => [p, 0]));
    const suspeitas: string[] = [];
    const anda = (n: No): void => {
      if (ts.isJsxAttribute(n) && ts.isIdentifier(n.name)) {
        const linha = TETOS_NA_UI.find(([p]) => p === n.name.getText(sf));
        if (linha && n.initializer && ts.isJsxExpression(n.initializer) && n.initializer.expression) {
          vistas.set(linha[0], (vistas.get(linha[0]) ?? 0) + 1);
          const alvo = n.initializer.expression;
          const ok = ts.isIdentifier(alvo)
            ? efetivos.has(alvo.text)
            : /activityCapFor\s*\(/.test(alvo.getText(sf));
          if (!ok) suspeitas.push(`${linha[0]}={${alvo.getText(sf)}} — ${linha[1]}`);
        }
      }
      ts.forEachChild(n, anda);
    };
    anda(sf);

    for (const [prop] of TETOS_NA_UI) {
      expect(vistas.get(prop), `a prop ${prop} sumiu do App.tsx — o guard ficou cego`)
        .toBeGreaterThan(0);
    }
    expect(
      suspeitas,
      'mostrar o teto do ESTÁGIO a um demo é prometer uma vaga que o portão vai negar: '
      + 'o usuário escreve a atividade inteira e o Salvar recusa',
    ).toEqual([]);
  });

  it('o regime do teto DIÁRIO não voltou ao App.tsx', () => {
    const sf = fonte();
    const ressuscitados: string[] = [];
    const anda = (n: No): void => {
      if (ts.isIdentifier(n) && (REGIME_ANTIGO as readonly string[]).includes(n.text)) {
        ressuscitados.push(n.text);
      }
      ts.forEachChild(n, anda);
    };
    anda(sf);
    expect(
      [...new Set(ressuscitados)],
      'o teto diário racionava o verbo central do produto e não protegia custo nenhum '
      + '(docs/PLANO-PRODUTO.md:70). Ele saiu por decisão, não por acidente.',
    ).toEqual([]);
  });
});
