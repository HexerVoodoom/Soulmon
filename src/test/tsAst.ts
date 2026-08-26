/**
 * O compilador de TypeScript, carregado FORA do orçamento de cada teste.
 *
 * ## Por que este arquivo existe
 *
 * Cinco guards de elo deste repositório leem código de produção como AST —
 * `playerDay.contract`, `spriteBirth.contract`, `spriteTuneUnseen`,
 * `useDailyReset.rollover` e `assets.contract`. Todos os cinco começavam o
 * corpo do caso com:
 *
 * ```ts
 * const mod = await import('typescript');   // ANTES
 * ```
 *
 * Isso é, literalmente, a assinatura mecânica do flake medido em
 * `sweeper/flake-assets-contract.md`: **custo de carregar módulo pago DENTRO do
 * orçamento do teste**. Lá o módulo era um componente React de 1469 linhas;
 * aqui é o `typescript`, que tem ~9 MB de JS e custa ~490 ms na primeira vez.
 * A diferença é de tamanho, não de natureza — e a natureza é a que produz
 * timeout: o relógio do `testTimeout` está correndo enquanto o runner faz um
 * trabalho que **não é o que o teste mede**. O guard mede a fiação do
 * `App.tsx`; o parser é ferramenta, não sujeito.
 *
 * Medido nesta árvore (`scripts/orcamento-de-tempo.mjs`, 2 rodadas, máquina
 * ociosa, orçamento 15 s), pior caso por guard ANTES: 900 / 803 / 726 / 709 /
 * 655 ms — 6,0% do orçamento no pior deles, com o gatilho de "atenção" em 10%.
 * Sob o fator de contenção de 4,4× medido no incidente de referência, 900 ms
 * viram ~4,0 s: acima do limiar de DÍVIDA (25% = 3750 ms) sem que uma linha de
 * código tivesse piorado.
 *
 * ## Por que `import` estático no topo, e não `beforeAll`
 *
 * As três opções foram avaliadas contra a mesma pergunta — *onde o custo passa
 * a ser cobrado?*:
 *
 * | Opção | Onde o custo cai | Veredito |
 * |---|---|---|
 * | `await import()` no caso (hoje) | dentro do `testTimeout` de 15 s | é o defeito |
 * | `beforeAll` no arquivo | dentro do **`hookTimeout`**, default 10 s, que ninguém declarou | troca um teto invisível por outro |
 * | **`import` estático no topo do módulo** | na fase de **import** do arquivo, que nenhum dos dois relógios governa | escolhido |
 *
 * A linha do meio é o motivo de a escolha não ser gosto. O `renderEnv.tsx`
 * documenta o mesmo achado numa terceira régua (`asyncUtilTimeout`, default
 * 1000 ms, que ignora o `testTimeout`): este projeto já foi mordido uma vez por
 * "segundo teto invisível". `beforeAll` criaria o quarto — e um mais apertado
 * que o declarado (10 s < 15 s), o que é exatamente o padrão que já cobrou.
 *
 * O import estático não esconde o custo, ele o move para onde ele já é
 * contabilizado e reportado por arquivo (a linha `transform … import …` do
 * vitest), e onde nenhum limite o transforma em vermelho.
 *
 * ## O que este módulo NÃO faz
 *
 * Não afrouxa guard nenhum: ele não altera o que é parseado nem o que é
 * asserido. Ele entrega o mesmo `ts` e a mesma `SourceFile` que cada teste
 * montava à mão — com a mesma `ScriptTarget.Latest` e `setParentNodes: true`,
 * de que os guards dependem para `node.parent` e `getText(sf)`.
 */
import fs from 'node:fs';
import ts from 'typescript';

export { ts };

/** Reexport de conveniência: os guards anotam nós como `No` em vez de repetir
 *  `import('typescript').Node` em cada lambda. É tipo — custo zero em runtime. */
export type No = ts.Node;

/**
 * Cache por caminho ABSOLUTO. Vale dentro de um arquivo de teste (o `App.tsx`
 * é parseado por mais de um caso em três dos cinco guards) e some entre
 * arquivos, porque o vitest isola cada arquivo em seu próprio contexto.
 *
 * É seguro porque guard de AST só LÊ: nenhum caso muta a `SourceFile`, e o
 * arquivo em disco não muda no meio de uma rodada. O `assets.contract.test.ts`
 * já fazia esta memoização na mão, pelo mesmo motivo escrito lá ("parsear duas
 * vezes pagaria o custo duas vezes num arquivo cujo defeito histórico é
 * timeout"); aqui ela deixa de ser um privilégio de um arquivo.
 */
const cache = new Map<string, ts.SourceFile>();

/**
 * Lê um arquivo do repositório e devolve sua `SourceFile` parseada.
 *
 * `ScriptKind` vem da EXTENSÃO, não de um parâmetro: passar `TSX` para um `.ts`
 * é o tipo de divergência silenciosa que nenhum teste acusaria (o parser aceita,
 * e só o caso que depende de `<T>` quebra, meses depois).
 */
export function fonteDe(caminho: string): ts.SourceFile {
  const guardado = cache.get(caminho);
  if (guardado) return guardado;
  const sf = ts.createSourceFile(
    caminho,
    fs.readFileSync(caminho, 'utf8'),
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    caminho.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  cache.set(caminho, sf);
  return sf;
}
