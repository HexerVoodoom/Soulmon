import { canCreateActivity, type AccountTier } from './monetization';

/**
 * QUANTOS HÁBITOS NOVOS CABEM — a decisão do teto, tomada sobre o estado que
 * ela recebe. Extraída do portão `commitHabitCreate` do `App.tsx`.
 *
 * ⚠️ Família X-6, terceira varredura, instância 3 — a única cuja falha estava
 * DECLARADA POR ESCRITO no comentário do próprio portão: *"A decisão é tomada
 * FORA, contra `gameState.activities`, e o updater só escreve."* Duas criações
 * no mesmo lote do React (duplo submit, ou tutorial + clique) liam a mesma
 * contagem, ambas passavam, e a lista terminava com MAIS hábitos que
 * `activityCapFor` — furando a fronteira de monetização do demo e o teto de
 * estágio do pagante.
 *
 * A frase do comentário era verdadeira e o motivo dela também: `track` é efeito
 * colateral e rodaria 2× no StrictMode dentro do updater. O erro não era medir
 * de fora — era **só** medir de fora. Agora a mesma função responde às duas
 * perguntas, com dois donos diferentes:
 *
 *  - de FORA, contra `gameState`: quantos vão ser contados na telemetria e o
 *    que o chamador recebe de volta (o tutorial cria um LOTE e precisa saber o
 *    que não coube);
 *  - de DENTRO do updater, contra o `prev`: quantos de fato entram na lista.
 *
 * O estado é a autoridade; a contagem de fora é a melhor estimativa no momento
 * do clique. No caminho feliz os dois números são idênticos — só divergem no
 * lote duplo, e é melhor um `activity_create` a mais no agregado do que um
 * hábito a mais além do teto pelo qual alguém paga.
 *
 * ⚠️ NENHUM número mudou: o teto continua sendo `activityCapFor` via
 * `canCreateActivity`, com o mesmo `stageCap` e o mesmo tier.
 */

/** Fatia do GameState que a decisão do teto lê. */
export interface HabitCapState {
  activities: readonly unknown[];
  maxActivityCap: number;
}

/**
 * O prefixo de `novos` que cabe no teto, dado o estado.
 *
 * Prefixo, e não filtro: os candidatos são idênticos do ponto de vista do teto
 * (todo hábito ocupa uma vaga), então o primeiro que não couber encerra o lote.
 * Parar no primeiro também mantém a ordem que o tutorial escreveu.
 */
export function fitHabitCreates<A>(
  state: HabitCapState,
  novos: readonly A[],
  tier: AccountTier,
): A[] {
  const cabem: A[] = [];
  for (const novo of novos) {
    if (!canCreateActivity({
      tier,
      kind: 'habit',
      habitCount: state.activities.length + cabem.length,
      stageCap: state.maxActivityCap,
    })) break;
    cabem.push(novo);
  }
  return cabem;
}
