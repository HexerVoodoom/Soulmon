/**
 * O GATILHO da geração incremental de sprite — função PURA.
 *
 * Spec: `spec-geracao-incremental.md` §3 (gate em PASS). Três ocasiões, e só
 * três (§1):
 *
 *   A — Nascimento: **só `rookie`** (D-G5b, 22/09/2026).
 *   C — Incubação: `faltam <= 0`, o lote da PRÓXIMA evolução (líderes empatados).
 *
 * ⚰️ **A ocasião B (véspera, `faltam === 1`) NÃO EXISTE MAIS** (D-G8c,
 * 22/09/2026). Ela existia para que a forma já estivesse pronta quando o
 * último ponto caísse — "pra evitar espera", palavras do dono na abertura da
 * série. A decisão dele inverteu o propósito: **a espera passou a ser o
 * conteúdo**, e é o tempo de incubar. Não reintroduza a véspera achando que
 * ela foi esquecida; a lógica de líderes empatados que morava nela (`vesperForms`)
 * migrou inteira para a C, sem mudar de critério.
 *
 * Três travas que este módulo existe para não deixar cair:
 *
 * 1. **A forma-destino vem SÓ de `evolutionTarget()`** (§3.0). Não há quarta
 *    cópia da regra aqui: `getNextEvolution` e `resolveBranch` são chamados
 *    através dela, nunca à mão.
 * 2. **O gatilho chaveia por `sprites[formId]` AUSENTE** (§3.5), nunca por "já
 *    passei por essa forma" — que é falso ao re-subir depois de degenerar, o
 *    caminho que o `ultra` obriga a percorrer.
 * 3. **Degeneração NÃO gera** (§3.5): a queda em si nunca produz lote. Se ela
 *    deixar o jogador apto a evoluir na hora, quem atende é a ocasião C —
 *    quando e se ele abrir a cerimônia. Por isso este módulo não tem entrada
 *    nenhuma de "acabei de degenerar": ele só olha o estado.
 *
 * `faltam === 1`, nunca `<= 1` (§3.1): `<= 1` engoliria a ocasião C, que tem
 * prioridade e comportamento diferentes. Duas ocasiões disputando o mesmo
 * estado é como se duplica cobrança.
 */
import { branchLeaders, type AttrPoints, type CareReading } from './carePattern';
import { getNextEvolution } from './dailyReset';
import { evolutionTarget, type Branch } from './evolutionTarget';
import { FORM_REQUIREMENTS, getStageLevel } from '../types/progression';
import { hasSprite, isAccountCapped, isFormCapped, type SpriteLibrary } from './spriteLibrary';

/** `'B'` fica no tipo como LÁPIDE: nenhum caminho o produz desde o D-G8c. Ele
 *  segue aqui para que um save/telemetria antigo que o carregue não quebre a
 *  checagem exaustiva de quem consome o tipo. */
export type SpriteOccasion = 'A' | 'B' | 'C';

export interface SpriteTriggerInput {
  evolutionStage: string;
  currentBranch: Branch;
  unlockedEvolutions: string[];
  /** `perfectDays` acumulados desde a última evolução. */
  perfectDays: number;
  points: AttrPoints;
  reading: CareReading;
  library: SpriteLibrary;
}

export interface SpriteBatch {
  occasion: SpriteOccasion;
  /** Formas a gerar, na ordem. Vazio nunca é devolvido — `null` é. */
  formIds: string[];
}

/** Quantos pontos faltam para a evolução ficar disponível (§3.1). */
export function pointsToEvolve(evolutionStage: string, perfectDays: number): number {
  const level = getStageLevel(evolutionStage);
  return FORM_REQUIREMENTS[level].required - perfectDays;
}

/** A forma-destino, pela fonte única. `null` quando não há para onde ir. */
export function targetFormId(input: SpriteTriggerInput): string | null {
  const { stage } = evolutionTarget({
    points: input.points,
    reading: input.reading,
    currentBranch: input.currentBranch,
    evolutionStage: input.evolutionStage,
    unlockedEvolutions: input.unlockedEvolutions,
    perfectDays: input.perfectDays,
  });
  // `getNextEvolution` devolve o PRÓPRIO estágio quando não há destino (mega sem
  // as 3 megas, e o ultra). Isso é o estado `DISTANTE`, e ele não gera nada.
  return stage === input.evolutionStage ? null : stage;
}

/**
 * O que gerar agora — `null` quando nada deve gerar.
 *
 * Uma forma só entra no lote se **não tem sprite** e **não está em estado
 * terminal**: 409 `sprite-form-cap` (esta forma esgotou as 3 dela) ou 402
 * `sprite-lifetime-cap` (a conta parou de vez). Insistir numa dessas é bater na
 * porta que acabou de fechar — e são portas diferentes, de propósito.
 */
export function spriteBatch(input: SpriteTriggerInput): SpriteBatch | null {
  if (isAccountCapped(input.library)) return null;

  const faltam = pointsToEvolve(input.evolutionStage, input.perfectDays);

  if (faltam <= 0) {
    const target = targetFormId(input);
    if (!target) return null;
    // `vesperForms` migrou da ocasião B para cá (D-G8c): o empate de galho
    // continua sem resolver até o toque da cerimônia, então continua sendo
    // preciso cobrir TODOS os líderes. O critério não mudou — só o momento.
    const formIds = generatable(input, vesperForms(input, target));
    return formIds.length ? { occasion: 'C', formIds } : null;
  }

  return null;
}

/**
 * O lote de véspera (§4): com 2 ou 3 líderes empatados, **todas** as formas dos
 * líderes. O empate é decidido no toque da cerimônia, com o ritmo daquele
 * momento — gerar só o preferido reintroduz o risco que a geração antecipada
 * existe para eliminar.
 *
 * `branchLeaders` é o dono da aritmética (`carePattern.ts`); aqui não há
 * critério novo, só a tradução galho → forma, que é de `getNextEvolution`.
 */
function vesperForms(input: SpriteTriggerInput, target: string): string[] {
  const leaders = branchLeaders(input.points);
  if (leaders.length < 2) return [target];
  const forms = leaders.map(b => getNextEvolution(input.evolutionStage, b, input.unlockedEvolutions));
  // `ultra` não tem galho: os três líderes resolvem para a MESMA forma. Dedup
  // aqui evita três pedidos idênticos ao servidor pela mesma imagem.
  const unique = Array.from(new Set(forms.filter(f => f !== input.evolutionStage)));
  return unique.length ? unique : [target];
}

/**
 * O lote de nascimento (ocasião A): **só `rookie`**.
 *
 * ⚠️ Até 22/09/2026 este lote era `['rookie', champion previsto]` — duas
 * formas. O D-G5b encolheu-o para uma: *"Só nasce o rookie e o restante é sob
 * demanda, na incubação"* (dono). Não reintroduza o champion aqui achando que
 * ele caiu por descuido; ele nasce na incubação daquela evolução, e é isso que
 * faz a forma seguinte ser produzida no momento em que o jogador chega nela.
 *
 * Consequência aceita e declarada (parecer R-M): a página de Evolução passa a
 * mostrar a forma seguinte em SILHUETA até a incubação — o que já era a regra
 * escrita dela (§16.1-5: a Evolução nunca nomeia a próxima forma).
 */
export function birthBatch(input: SpriteTriggerInput): SpriteBatch | null {
  if (isAccountCapped(input.library)) return null;
  const formIds = generatable(input, ['rookie']);
  return formIds.length ? { occasion: 'A', formIds } : null;
}

/** Tira do lote o que já existe e o que já está terminalmente fechado. */
function generatable(input: SpriteTriggerInput, formIds: string[]): string[] {
  return formIds.filter(
    id => !hasSprite(input.library, id) && !isFormCapped(input.library, id),
  );
}

// ---------------------------------------------------------------------------
// A INCUBAÇÃO (D-G8b/D-G8c/D-G8d, 22/09/2026 — decisão do dono, escopo v1).
//
// Quando o jogador fica APTO a evoluir, a forma seguinte começa a ser
// produzida e ele espera `INCUBATION_MIN_MS` antes de poder dar o gesto.
// Palavras do dono: *"Quando pode evoluir começa a incubação e depois de 30min
// volta e completa sob o comando do user."*
//
// Três coisas que este bloco existe para NÃO deixar cair, cada uma comprada
// com um defeito que já foi encontrado:
//
// 1. **É PISO, nunca prazo.** Passados os 30 minutos a evolução libera e
//    **espera indefinidamente**. Nada expira, nada fecha sozinho, nada se perde
//    por não abrir o app. Só existe UMA comparação de data aqui
//    (`incubationReady`) e ela só LIBERA — `spriteTrigger.semPrazo.contract.test.ts`
//    varre o fonte e reprova qualquer outra.
//
// 2. **É "APTO desde X", não "gerando desde X".** O relógio não pode depender
//    do lote de sprite: `spriteBatch` devolve `null` para conta em
//    `sprite-lifetime-cap`, para forma em `sprite-form-cap` e quando a geração
//    falhou — e amarrar a escrita do estado ao lote deixaria justamente esses
//    jogadores SEM incubação e, com o portão exigindo uma, **travados fora da
//    própria evolução para sempre**. Por isso `incubationFor` não olha o
//    acervo: ele responde à elegibilidade, e o lote acontece ao lado (D-G8d,
//    endossado como régua pelo parecer R-M).
//
// 3. **O `since` é POR FORMA, e sobrevive à degeneração** (parecer R-L). A
//    versão anterior desta regra limpava a incubação ao cair, e o jogador que
//    degenerava dentro da janela pagava um SEGUNDO relógio de 30 minutos ao
//    re-subir — o HP, única punição sancionada (com teto e perdões), passaria a
//    cobrar tempo sobre progresso. Voltar à MESMA forma reaproveita o `since`
//    que já corria. A fronteira, também do parecer: é por `formId` **dentro da
//    mesma vida** — o Renascimento e a troca de criatura do upgrade zeram o
//    registro, senão a incubação vira carimbo herdado que libera na hora.
// ---------------------------------------------------------------------------

/** Trinta minutos. Dono ÚNICO do número — `spriteTrigger.semPrazo.contract.test.ts`
 *  reprova a cópia dele em outro arquivo, e reprova qualquer caminho que o
 *  condicione, multiplique ou encurte (parecer R-J: a espera é uniforme, e uma
 *  espera encurtável deixa de ser incubação e vira preço). */
export const INCUBATION_MIN_MS = 30 * 60 * 1000;

export interface Incubation {
  v: 1;
  /** `formId` → instante em que aquela forma começou a incubar (ISO). Mapa, e
   *  não um campo só, porque o empate de galho põe 2–3 formas incubando ao
   *  mesmo tempo e porque voltar a uma forma reaproveita o relógio dela (R-L). */
  since: Record<string, string>;
  /* ⚰️ **`notified: string[]` SAIU em 27/09/2026, e não deve voltar.**
   *
   * Ele nasceu no D-G6 para o aviso da Home ser one-shot ("um aviso, uma
   * vez"), foi escrito no save de TODO jogador desde 22/09/2026 e **lido por
   * ninguém** — a quarta repetição do padrão dos WP4.15/4.16 e do bestiário.
   *
   * E consumi-lo teria sido pior que deixá-lo morto, porque a regra que vale
   * é a OPOSTA: o parecer R-K(a) pede um **marcador persistente**, "que se
   * ENCONTRA em vez de conferir". Um aviso one-shot deixaria sem explicação
   * nenhuma exatamente quem mais precisa dela — o jogador que abre o app no
   * meio da incubação, vê a barra cheia, o botão apagado, e já tinha gastado
   * a única exibição do aviso. O aviso fica enquanto a incubação durar; é
   * isso que o R-K(a) chama de marcador, e é ele que substitui o push que a
   * decisão #76 do dono cortou.
   *
   * Save antigo que ainda carrega a chave é inofensivo: o load monta o objeto
   * campo a campo e simplesmente não a copia. */
}

export function emptyIncubation(): Incubation {
  return { v: 1, since: {} };
}

/**
 * O estado da incubação depois deste instante — função PURA e IDEMPOTENTE.
 *
 * Devolve **a mesma referência** quando nada muda (footgun 6: o StrictMode
 * invoca o updater 2×, e objeto novo a cada render vira spam de cloud save).
 *
 * ⚠️ Não limpa nada. Uma forma que saiu da mira (o jogador degenerou, o galho
 * previsto mudou) **mantém** o `since` dela — é o que faz voltar a ela não
 * cobrar um segundo relógio (R-L). O mapa é pequeno e limitado pelas 11 formas.
 */
export function incubationFor(
  input: Pick<SpriteTriggerInput, 'evolutionStage' | 'perfectDays' | 'points' | 'reading' | 'currentBranch' | 'unlockedEvolutions'>,
  prev: Incubation | undefined,
  now: Date,
): Incubation {
  const atual = prev ?? emptyIncubation();
  if (pointsToEvolve(input.evolutionStage, input.perfectDays) > 0) return atual;

  const target = targetFormId({ ...input, library: NO_LIBRARY });
  if (!target) return atual;

  // Todos os líderes empatados incubam: o empate só se resolve no toque, e
  // fazer o jogador esperar de novo pelo galho que ele escolher seria cobrar
  // duas vezes pela mesma decisão.
  const formas = vesperForms({ ...input, library: NO_LIBRARY }, target);
  const faltando = formas.filter(f => !atual.since[f]);
  if (faltando.length === 0) return atual;

  const since = { ...atual.since };
  for (const f of faltando) since[f] = now.toISOString();
  return { ...atual, since };
}

/** Acervo vazio: `incubationFor` e `vesperForms` não olham sprite nenhum (ver
 *  a trava 2 acima), mas os tipos compartilhados pedem o campo. */
const NO_LIBRARY = { sprites: {}, failures: {}, pendingTune: null, reverted: [] } as unknown as SpriteLibrary;

/**
 * A forma já cumpriu a espera? **É a única aritmética de data do módulo, e ela
 * só LIBERA** — não existe o ramo que devolve "tarde demais".
 *
 * Forma sem `since` responde `true`: é o save antigo, o jogador que já estava
 * apto antes desta versão existir. Fazer a versão nova abrir um relógio para
 * quem já tinha direito seria tirar algo que já era dele.
 */
export function incubationReady(inc: Incubation | undefined, formId: string, now: Date): boolean {
  const since = inc?.since?.[formId];
  if (!since) return true;
  const t = Date.parse(since);
  if (!Number.isFinite(t)) return true; // relógio corrompido nunca prende ninguém
  return now.getTime() - t >= INCUBATION_MIN_MS;
}

/** A forma-destino ainda está incubando? Usado pelo aviso e pela cerimônia. */
export function isIncubating(inc: Incubation | undefined, formId: string | null, now: Date): boolean {
  return !!formId && !!inc?.since?.[formId] && !incubationReady(inc, formId, now);
}
