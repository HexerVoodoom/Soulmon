import type { AccountTier } from './monetization';

/**
 * A CURA INSTANTÂNEA POR CRÉDITOS, aplicada sobre o `prev` — extraída do
 * updater inline de `handleInstantHealWithCredits` no `App.tsx`.
 *
 * ⚠️ Família X-6, terceira varredura, instância 1 — a mais cara das três,
 * porque a moeda aqui é DINHEIRO REAL. Era o coraçãozinho (`applySpecialItem`)
 * outra vez, só que em Créditos: a recusa de vida cheia vivia SÓ FORA do
 * `setGameState`, e o updater se limitava ao `Math.min` — literalmente a linha
 * que `applySpecialItem` foi criado para consertar. Com 4/5 de vida, dois
 * toques liam `4 < 5`, cobravam 10 Créditos DUAS vezes, e a segunda curava
 * ZERO.
 *
 * ## Por que esta é diferente das outras duas: o `await` no meio
 *
 * `handleShopBuy` e `commitHabitCreate` são síncronos — a janela do defeito é
 * um lote do React. Aqui há um `await spendCredits(...)` entre a checagem e o
 * updater, e a janela é a viagem inteira até o servidor. Pior: **o gasto
 * acontece no servidor ANTES de o updater rodar**. Reconferir dentro do
 * updater impede a cura dupla, mas NÃO devolve o Crédito já gasto.
 *
 * Por isso o conserto tem DUAS peças, e só a segunda mora aqui:
 *
 *  1. **Travar antes de gastar** (no `App.tsx`): um sinalizador de "já tem uma
 *     cura em voo" fecha a janela na origem, e o segundo toque nem chega a
 *     chamar `spendCredits`. É a única peça que impede a COBRANÇA dupla no
 *     cliente. Não pode viver aqui porque não é estado do jogo — é estado do
 *     pedido em voo.
 *  2. **Reconferir sobre o `prev`** (esta função): defesa em profundidade para
 *     tudo que a trava não cobre — duas abas, dois aparelhos, recarga no meio
 *     do pedido. Se a vida já está cheia quando o updater roda, a cura NÃO é
 *     aplicada.
 *
 * ⚠️ E o Crédito já gasto, no caso (2)? O saldo devolvido pelo servidor (`ent`)
 * é escrito no estado DE QUALQUER JEITO, inclusive na recusa. O `credits` do
 * GameState é espelho do servidor, e um espelho que se recusa a mostrar um
 * débito que aconteceu é pior que o débito: a UI passaria a mentir o saldo até
 * o próximo sync. Estornar de verdade exige idempotência no servidor
 * (`functions/**`, fora do alcance desta frente) — ver o relatório do commit.
 *
 * ⚠️ NENHUM número mudou: `HEART_COST_CREDITS` e o `+1` de vida continuam
 * exatamente onde estavam. O conserto tira o duplo, não muda o custo.
 */

export type InstantHealRefusal = 'already-full';

/** O saldo confirmado PELO SERVIDOR. Nunca calculado no cliente. */
export interface HealEntitlement {
  credits: number;
  tier: AccountTier;
}

/** Fatia do GameState que a cura instantânea lê e escreve. */
export interface InstantHealState {
  healthPoints: number;
  maxHealthPoints: number;
  credits?: number;
  accountTier?: AccountTier;
}

/**
 * A cura seria recusada? Lida de fora ANTES de gastar (é o que evita a
 * cobrança), e de novo de dentro, sobre o `prev`.
 */
export function instantHealRefusal(state: InstantHealState): InstantHealRefusal | undefined {
  if (state.healthPoints >= state.maxHealthPoints) return 'already-full';
  return undefined;
}

/**
 * Uma cura instantânea aplicada ao `prev`, com o saldo que o servidor
 * confirmou.
 *
 * Na recusa, o espelho do saldo é escrito assim mesmo (ver o cabeçalho): o
 * débito já aconteceu lá fora, e esconder isso do usuário seria mentir.
 */
export function applyInstantHeal<T extends InstantHealState>(
  prev: T,
  ent: HealEntitlement,
): { state: T; refused?: InstantHealRefusal } {
  const sincronizado: T = { ...prev, credits: ent.credits, accountTier: ent.tier };
  const refused = instantHealRefusal(prev);
  if (refused) return { state: sincronizado, refused };
  return {
    state: {
      ...sincronizado,
      // O `Math.min` continua como segunda trava; quem barra o desperdício
      // agora é a recusa acima.
      healthPoints: Math.min(prev.maxHealthPoints, prev.healthPoints + 1),
    },
  };
}
