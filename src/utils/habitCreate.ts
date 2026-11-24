import { canCreateActivity, habitCreateDecision, type AccountTier } from './monetization';
import { consomeCotaDeHabito, contaCotaDeHabitos } from './atividadesLista';

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
 * ⚠️ 24/11/2026 (dono, opção A): só o DEMO tem teto duro. O pagante NÃO é truncado: `fitHabitCreates` devolve o lote inteiro, e o
 * número do estágio vira SUGESTÃO (`habitOverRecommended` → modal de confirmação no App).
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
  /* Tarefa agendada (dias específicos) NÃO gasta cota (dono, 14/10/2026): entra
     sempre; só o hábito diário passa pelo teto. */
  let usadas = contaCotaDeHabitos(state.activities);
  for (const novo of novos) {
    if (!consomeCotaDeHabito(novo)) { cabem.push(novo); continue; }
    if (!canCreateActivity({
      tier,
      kind: 'habit',
      habitCount: usadas,
      stageCap: state.maxActivityCap,
    })) break;
    cabem.push(novo);
    usadas++;
  }
  return cabem;
}

/**
 * §385 (dono, 14/11/2026, "limites visíveis"): seleção múltipla cortada pelo teto (`fitHabitCreates` aceitou menos do que o pedido)
 * vira aviso, nunca corte calado. `null` = entrou tudo (ou nada foi pedido). Dono único do texto: o "Hoje" e o catálogo do
 * onboarding chamam ESTA.
 */
export function habitCapPartialText(added: number, asked: number, isPt: boolean): string | null {
  if (!(asked > 0) || added >= asked) return null;
  const x = Math.max(0, added);
  return isPt ? `Limite atingido: entraram ${x} de ${asked} hábitos` : `Limit reached: ${x} of ${asked} habits were added`;
}

/**
 * A SUGESTÃO do estágio (só pagante). Devolve `{ recommended }` quando criar `novos` deixaria a cota de hábitos ACIMA do
 * número recomendado do estágio (`maxActivityCap`); `null` quando cabe, quando o tier é demo (teto duro, já tratado por
 * `fitHabitCreates`) ou quando nada do lote gasta cota (tarefa agendada nunca conta). Pura: o App decide perguntar.
 */
export function habitOverRecommended<A>(
  state: HabitCapState,
  novos: readonly A[],
  tier: AccountTier,
): { recommended: number } | null {
  const adding = novos.filter(consomeCotaDeHabito).length;
  if (adding === 0) return null;
  const verdict = habitCreateDecision({
    tier,
    kind: 'habit',
    habitCount: contaCotaDeHabitos(state.activities),
    stageCap: state.maxActivityCap,
    adding,
  });
  return verdict === 'recomendado-excedido' ? { recommended: state.maxActivityCap } : null;
}
