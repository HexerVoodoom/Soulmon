/**
 * OS RECIBOS DO RESGATE DA FEIRA que este aparelho já creditou (`docs/PLANO-GUILDA.md`
 * §3 "Recompensas"; `docs/reviews/guilda/qa/L2-backend.md` M3).
 *
 * O servidor devolve um recibo DETERMINÍSTICO por (conta, semana) no `claimed` e no 409.
 * Como o KV é eventualmente consistente entre regiões, dois aparelhos (ou um toque
 * repetido) podem receber 200 para a mesma semana; o que impede o segundo crédito de
 * Emblemas é este registro. Mora numa chave de conveniência de `storageKeys.ts`
 * (a terceira, `guildNoSave.contract.test.ts`) e NUNCA no GameState: é a fronteira de
 * "já creditei?" do aparelho, e o saldo é do save.
 *
 * Só guarda o recibo (opaco): sem semana, sem guilda, sem quantia. Falha de storage
 * (`safeStorage` já captura) NÃO trava o resgate: pior caso, o servidor recusa a segunda
 * tentativa com 409 e nada é creditado duas vezes por aqui.
 */
import { STORAGE_KEYS } from './storageKeys';
import { readJson, writeJson } from './safeStorage';
import { isGuildReward } from './shop';

/** Poucas semanas em jogo (a janela do servidor é de 3): 24 recibos são anos de folga. */
const CAP = 24;

export function readClaimedReceipts(): string[] {
  const raw = readJson<unknown>(STORAGE_KEYS.GUILD_CLAIMED, []);
  return Array.isArray(raw) ? raw.filter((r): r is string => typeof r === 'string' && r.length > 0 && r.length <= 80).slice(-CAP) : [];
}

export const hasClaimedReceipt = (receipt: string): boolean => readClaimedReceipts().includes(receipt);

/** Idempotente. Devolve `false` se o recibo JÁ estava (quem chama NÃO credita). */
export function rememberClaimedReceipt(receipt: string): boolean {
  const atual = readClaimedReceipts();
  if (atual.includes(receipt)) return false;
  writeJson(STORAGE_KEYS.GUILD_CLAIMED, [...atual, receipt].slice(-CAP), { silent: true });
  return true;
}

/**
 * A Concha da Maré no save: entra em `ownedFurniture` (é uma decoração possuída como qualquer
 * outra; equipar é do fluxo de sempre). Idempotente — a 8ª, 12ª… Concha devolvem `trophy:true` e
 * viram no-op. Só ids de `GUILD_ITEMS` passam: dado do servidor não inventa item no save.
 */
export function grantGuildTrophy<T extends { ownedFurniture?: string[] }>(prev: T, trophyId: string): T {
  if (!isGuildReward({ id: trophyId })) return prev;
  const owned = Array.isArray(prev.ownedFurniture) ? prev.ownedFurniture : [];
  return owned.includes(trophyId) ? prev : { ...prev, ownedFurniture: [...owned, trophyId] };
}
