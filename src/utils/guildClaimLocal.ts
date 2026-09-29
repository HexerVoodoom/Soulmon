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
 * Só guarda o recibo (opaco): sem semana, sem guilda, sem quantia.
 *
 * ⚠️ FALHA DE STORAGE (M2, L3): o `safeStorage` engole o erro e devolve `false` — modo privado,
 * quota cheia. O cabeçalho antigo dizia "pior caso o servidor recusa com 409 e nada é creditado
 * duas vezes", e isso era FALSO: o KV pode devolver 200 duas vezes, e o 409 agora TRAZ o resgate
 * (`claimed`) para que quem perdeu a resposta o credite. Por isso o recibo também vive numa
 * memória do MÓDULO (vale enquanto o app estiver aberto): sem storage, um segundo toque na mesma
 * execução ainda não credita de novo.
 *
 * RESÍDUO DECLARADO: com storage indisponível, fechar e reabrir o app esquece o recibo, e dois
 * aparelhos da MESMA conta têm listas separadas — cada um credita o SEU save uma vez (o cloud
 * save é último-a-gravar-vence, então a conta não soma dois). O que o servidor NÃO impede é o
 * aparelho B, com uma tela velha, tocar em "colher" depois de o A ter colhido: por isso o 409 só
 * credita quem TENTOU antes neste aparelho (`markClaimAttempt`), que é a única situação em que a
 * resposta do 200 pode ter se perdido aqui.
 */
import { STORAGE_KEYS } from './storageKeys';
import { readJson, writeJson } from './safeStorage';
import { isGuildReward } from './shop';

/** Poucas semanas em jogo (a janela do servidor é de 3): 24 entradas são anos de folga. */
const CAP = 24;
/** Marca de "tentei colher esta semana": mora na MESMA chave, com prefixo que nenhum recibo tem. */
const ATTEMPT = '~';

/** A memória da execução: SÓ o que o storage recusou guardar (fallback de M2). */
const memoria = new Set<string>();
/** Só para teste: a memória acima é do módulo. */
export const resetClaimMemoryForTests = () => memoria.clear();

function readDisk(): string[] {
  const raw = readJson<unknown>(STORAGE_KEYS.GUILD_CLAIMED, []);
  return Array.isArray(raw) ? raw.filter((r): r is string => typeof r === 'string' && r.length > 0 && r.length <= 80) : [];
}

const readEntries = (): string[] => [...new Set([...readDisk(), ...memoria])].slice(-CAP);

export function readClaimedReceipts(): string[] {
  return readEntries().filter(e => !e.startsWith(ATTEMPT));
}

export const hasClaimedReceipt = (receipt: string): boolean => readEntries().includes(receipt);

/** Disco primeiro; se o storage recusar (quota, modo privado — `safeStorage` devolve `false`), memória da execução. */
function guardar(entry: string): void {
  const disco = readDisk();
  if (disco.includes(entry)) return;
  if (!writeJson(STORAGE_KEYS.GUILD_CLAIMED, [...disco, entry].slice(-CAP), { silent: true })) memoria.add(entry);
}

/** Idempotente. Devolve `false` se o recibo JÁ estava (quem chama NÃO credita). */
export function rememberClaimedReceipt(receipt: string): boolean {
  if (readClaimedReceipts().includes(receipt)) return false;
  guardar(receipt);
  return true;
}

/** Este aparelho vai pedir o resgate da semana: se a resposta se perder, o 409 seguinte é dele. */
export function markClaimAttempt(week: string): void {
  guardar(ATTEMPT + week);
}

export const hadClaimAttempt = (week: string): boolean => readEntries().includes(ATTEMPT + week);

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
