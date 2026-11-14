/**
 * `opId` PENDENTE dos gestos de Créditos (Antislop P6, itens 2 e 3; REGISTRO §378). Dono único: `utils/entitlements.ts` usa.
 *
 * O servidor é idempotente por `opId` (`_bitsPacks.js` › `ent.bitsBuyOps`, `buy-essence` › `essbuy:`, `spend` › `spend:`):
 * o mesmo id reenviado devolve o resultado guardado sem debitar de novo. Isso só protege o jogador se o cliente REUSAR o id
 * quando não sabe se o servidor debitou. Antes o id nascia a cada chamada: resposta perdida + novo toque = outro id = débito
 * em dobro (Créditos são dinheiro real).
 *
 * Regra: o id de `chave` (conta + operação + item) nasce no 1º toque e é REUSADO em todo toque seguinte até o servidor dar uma
 * resposta DEFINITIVA (`confirmarOpId`): sucesso, ou recusa 4xx que não é "tente de novo" (`respostaDefinitiva`). Rede caída,
 * 5xx, `409 busy`/429 mantêm o pendente. Mora em memória e em `STORAGE_KEYS.PENDING_OP_IDS` (sobrevive a recarregar o app;
 * NUNCA no save). Vence em `PENDENTE_TTL_MS`, a janela em que o servidor ainda guarda o resultado (`spend:`/`essbuy:` = 24 h).
 */
import { readJson, writeJson } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';

export const PENDENTE_TTL_MS = 24 * 60 * 60 * 1000;

interface Pendente { op: string; at: number }

const memoria = new Map<string, Pendente>();

/** Um id novo. `crypto.randomUUID` quando existe; senão tempo + aleatório (basta ser único na janela de retry de um aparelho). */
export function novoOpId(): string {
  try {
    const uuid = globalThis.crypto?.randomUUID?.();
    if (uuid) return uuid.replace(/-/g, '');
  } catch { /* segue para o fallback */ }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

const OP_RE = /^[A-Za-z0-9_-]{8,64}$/;

function lerGuardados(agora: number): Record<string, Pendente> {
  const raw = readJson<unknown>(STORAGE_KEYS.PENDING_OP_IDS, {});
  const out: Record<string, Pendente> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const p = v as Partial<Pendente> | null;
    if (p && typeof p.op === 'string' && OP_RE.test(p.op) && typeof p.at === 'number' && agora - p.at < PENDENTE_TTL_MS) out[k] = { op: p.op, at: p.at };
  }
  return out;
}

/** A chave do gesto: conta + operação + item. Outra conta no mesmo aparelho nunca herda o pendente. */
export const chaveDeOp = (saveId: string, operacao: string, item: string): string => `${saveId}|${operacao}|${item}`;

/** O `opId` pendente de `chave`, ou um novo (que fica pendente até `confirmarOpId`). */
export function opIdPendente(chave: string, agora = Date.now()): string {
  const guardados = lerGuardados(agora);
  const vivo = memoria.get(chave);
  const atual = vivo && agora - vivo.at < PENDENTE_TTL_MS ? vivo : guardados[chave];
  if (atual) { memoria.set(chave, atual); return atual.op; }
  const novo = { op: novoOpId(), at: agora };
  memoria.set(chave, novo);
  guardados[chave] = novo;
  writeJson(STORAGE_KEYS.PENDING_OP_IDS, guardados);
  return novo.op;
}

/** O servidor deu a resposta definitiva para `opId`: o próximo toque de `chave` é um gesto novo. Só limpa se ainda for o mesmo id. */
export function confirmarOpId(chave: string, opId: string, agora = Date.now()): void {
  if (memoria.get(chave)?.op === opId) memoria.delete(chave);
  const guardados = lerGuardados(agora);
  if (guardados[chave]?.op !== opId) return;
  delete guardados[chave];
  writeJson(STORAGE_KEYS.PENDING_OP_IDS, guardados);
}

/**
 * Status HTTP que encerra o gesto: o servidor decidiu e não vai mudar de ideia com o MESMO id. 2xx entra aqui só junto com
 * `ok` no corpo (quem chama confere). 408/425/429 e `409 busy` (outra troca da conta em andamento, possivelmente ESTE gesto)
 * são "tente de novo", e 5xx é falha da plataforma: nos dois casos o servidor pode ter debitado, então o id fica. Os outros
 * 409 (`daily-cap`, `cap`) são recusa decidida.
 */
export function respostaDefinitiva(status: number, reason?: unknown): boolean {
  if (status < 400 || status >= 500) return false;
  if (status === 409) return reason !== 'busy';
  return status !== 408 && status !== 425 && status !== 429;
}
