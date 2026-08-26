// DONO ÚNICO do orçamento de tempo dos testes.
//
// Por que este arquivo existe, e por que ele não é uma linha dentro do
// `vitest.config.ts`: o número do timeout passou a ter DOIS leitores — o
// runner (que o aplica) e o medidor (`scripts/orcamento-de-tempo.mjs`, que
// afere quem está perto dele). Dois leitores e uma constante digitada duas
// vezes é o footgun 9 do `CLAUDE.md` ("regra copiada diverge em silêncio") na
// sua forma mais barata de evitar: o medidor passaria a comparar contra um
// orçamento que o runner não usa mais, e ficaria verde pelo motivo errado —
// exatamente o padrão que o sweeper mediu em `flake-assets-contract.md`.
//
// É `.mjs` (e não `.ts`) de propósito: o `vitest.config.ts` é bundlado pelo
// esbuild e o consome sem cerimônia, e um script Node cru (`scripts/*.mjs`)
// também — sem passo de compilação, sem `tsx`, sem terceira cópia.

/**
 * Piso de robustez da suíte, em ms. A justificativa do VALOR mora no
 * `vitest.config.ts`, onde ele é aplicado; aqui mora só a propriedade de ser
 * um número só.
 */
export const TEST_TIMEOUT_MS = 15_000;

/**
 * A régua que faltava ao `testTimeout`. O número sozinho declarou um teto;
 * estas faixas declaram o que fazer com quem se aproxima dele.
 *
 * As faixas são frações do orçamento, não milissegundos digitados — se o
 * orçamento mudar, a régua acompanha sem ninguém lembrar de mexer.
 *
 *  • `atencao` (10%) — não é defeito. É a lista de quem paga custo de
 *    ambiente (jsdom, transform de grafo React) e, portanto, de quem a
 *    contenção de CPU vai machucar primeiro. Só se observa.
 *  • `divida`  (25%) — DÍVIDA NOMEADA. O incidente de referência
 *    (`sweeper/flake-assets-contract.md` §1.3) estourou 5 s partindo de 24,8%
 *    do orçamento na suíte completa: sob 6 processos concorrentes o mesmo
 *    teste foi a 52%, e sob 8, a 100%. O fator medido entre carga normal e
 *    carga que estoura é ~4,4×. Quem chega a 25% já não tem folga para esse
 *    fator, e tem de aparecer com nome no documento de orçamento.
 *  • `critico` (50%) — é o número exato em que o flake de referência vivia
 *    quando quebrou. Ninguém deve chegar aqui sem conserto na ORIGEM (tirar o
 *    custo do caminho do teste), nunca subindo o teto.
 */
export const LIMIARES = Object.freeze({
  atencao: 0.10,
  divida: 0.25,
  critico: 0.50,
});
