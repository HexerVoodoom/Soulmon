/**
 * FONTE ÚNICA da forma-destino da evolução manual.
 *
 * Existiam TRÊS derivações do galho no `App.tsx`: `handleEvolve` (a que commita)
 * chamava `resolveBranch`, enquanto `handleEvolveRequest` (a que ANUNCIA na
 * cerimônia) e o `canEvolve` (que libera o botão) reimplementavam a decisão à
 * mão e mandavam TODO empate para `data`, sem consultar o ritmo de cuidado.
 * Empate poder/benevolência com leitura confiável: a página previa `power`, a
 * cerimônia anunciava `ultimate-harmony` e o save recebia `ultimate-power` — o jogo
 * anunciava um destino que não cumpria. É o footgun 9 do `CLAUDE.md`: regra
 * copiada é regra que diverge em silêncio.
 *
 * Aqui a regra mora UMA vez. Quem exibe e quem commita chamam a mesma função —
 * não existe mais "sincronizar as duas". Função PURA: `now` e leitura de ritmo
 * entram por parâmetro, nada de React nem de localStorage.
 */
import { resolveBranch, type AttrPoints, type CareReading } from './carePattern';
import { getNextEvolution } from './dailyReset';

export type Branch = 'power' | 'harmony' | 'benevolence';

export interface EvolutionTargetInput {
  /** Pontos de atributo do save (vêm da categoria das tarefas, via comida). */
  points: AttrPoints;
  /** Leitura do ritmo de cuidado — só desempata quando `confident`. */
  reading: CareReading;
  /** Galho atual: é o fallback do empate sem leitura confiável. */
  currentBranch: Branch;
  evolutionStage: string;
  unlockedEvolutions: string[];
  /** Dias perfeitos desde a última evolução — abre o caminho da PERMANÊNCIA
   *  para o Ultra (WP4.2/D6). Sem ele, vale só a coleção das três megas. */
  perfectDays?: number;
}

export interface EvolutionTarget {
  branch: Branch;
  /** Forma-destino. Igual a `evolutionStage` significa "não há para onde ir". */
  stage: string;
}

export function evolutionTarget(input: EvolutionTargetInput): EvolutionTarget {
  const branch = resolveBranch(input.points, input.reading, input.currentBranch);
  return {
    branch,
    stage: getNextEvolution(input.evolutionStage, branch, input.unlockedEvolutions),
  };
}
