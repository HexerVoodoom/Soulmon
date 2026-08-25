/**
 * O GATILHO da geração incremental de sprite — função PURA.
 *
 * Spec: `spec-geracao-incremental.md` §3 (gate em PASS). Três ocasiões, e só
 * três (§1):
 *
 *   A — Nascimento: `rookie` + o galho previsto de `champion`.
 *   B — Véspera: `faltam === 1`, o lote da PRÓXIMA evolução (líderes empatados).
 *   C — Resgate: `faltam <= 0` e a forma-destino não tem sprite próprio.
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

export type SpriteOccasion = 'A' | 'B' | 'C';

export interface SpriteTriggerInput {
  evolutionStage: string;
  currentBranch: Branch;
  unlockedEvolutions: string[];
  /** `perfectDays` acumulados desde a última evolução (`digivolutionSegments`). */
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
    const formIds = generatable(input, [target]);
    return formIds.length ? { occasion: 'C', formIds } : null;
  }

  if (faltam === 1) {
    const target = targetFormId(input);
    if (!target) return null;
    const formIds = generatable(input, vesperForms(input, target));
    return formIds.length ? { occasion: 'B', formIds } : null;
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

/** O lote de nascimento (ocasião A): `rookie` + o galho previsto de champion. */
export function birthBatch(input: SpriteTriggerInput): SpriteBatch | null {
  if (isAccountCapped(input.library)) return null;
  const champion = targetFormId(input);
  const wanted = champion ? ['rookie', champion] : ['rookie'];
  const formIds = generatable(input, wanted);
  return formIds.length ? { occasion: 'A', formIds } : null;
}

/** Tira do lote o que já existe e o que já está terminalmente fechado. */
function generatable(input: SpriteTriggerInput, formIds: string[]): string[] {
  return formIds.filter(
    id => !hasSprite(input.library, id) && !isFormCapped(input.library, id),
  );
}
