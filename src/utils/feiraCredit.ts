/**
 * Crédito da Feira do Chefe, UMA vez por recibo (`docs/PLANO-FEIRA-CHEFE.md` §5).
 *
 * O servidor já é idempotente (409 devolve o mesmo recibo), mas Emblemas e Bits moram no SAVE do cliente: quem credita
 * é o aparelho, e a memória de recibos (`guildClaimLocal`, a mesma do resgate semanal) é o que impede o duplo. Reabrir a
 * folha, perder a resposta do 200 e receber o 409 dão o MESMO recibo — e o segundo passa em silêncio.
 * `apply` roda FORA de qualquer updater do `setGameState`; o recibo só é gravado depois dele.
 */
import { hasClaimedReceipt, rememberClaimedReceipt } from './guildClaimLocal';

export interface FeiraCredit { receipt: string; emblems: number; bits: number; trophyId: string | null }

/** `true` = creditou agora; `false` = recibo repetido (ou vazio), nada a fazer. */
export function creditFeiraOnce(credit: FeiraCredit, apply: (c: FeiraCredit) => void): boolean {
  if (!credit.receipt || hasClaimedReceipt(credit.receipt)) return false;
  apply(credit);
  rememberClaimedReceipt(credit.receipt);
  return true;
}
