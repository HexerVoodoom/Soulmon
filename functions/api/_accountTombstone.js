// LÁPIDE de conta apagada — `del:done:<saveId>`.
//
// Por que existe (QA rodada 1, `03-arquitetura-r1.md` §2.5): depois que
// `account.js` › `delete-confirm` apaga o save, qualquer OUTRO aparelho do
// titular ainda logado (token Firebase vale 1 h; o cliente faz `POST /api/save`
// 3 s depois de qualquer mutação) recriava o save inteiro. A exclusão virava
// "apaguei por 3 segundos" — e a pessoa, que pediu para sumir, continuava no
// servidor sem saber.
//
// A lápide é gravada ANTES da primeira destruição e lida por `_auth.js` ›
// `authorizeSaveAccess` (logo, por TODA rota que autoriza em nome de um
// saveId: save, community, generate-sprite, entitlements, billing, chat,
// subscribe com saveId): com ela presente, a resposta é **410 `account-deleted`**, e o cliente
// trata 410 como "limpe o local e deslogue" (lado do cliente é da `alpha-frontend`;
// aqui só o contrato). Nada mais é gravado sob aquele `saveId` enquanto ela
// viver.
//
// TTL de 30 dias (pedido do QA; a review propunha 24 h). O prazo é o teto da
// janela em que um aparelho esquecido pode voltar com token válido e estado
// local — 24 h cobria só o token, não o aparelho que fica um fim de semana
// desligado. Depois dos 30 dias o mesmo e-mail cria conta nova do zero, que é
// o prometido em `COPY.deleteDone` ("a porta fica aberta").
//
// Mora num módulo próprio porque tem DOIS leitores (`account.js` grava e lê;
// `save.js` só lê) e `save.js` não pode importar `account.js` — arrastaria a
// rota de conta inteira, com `_auth.js` fail-closed, para dentro do cloud save.

import { kvOrThrow } from './_kv.js';

export const TOMBSTONE_PREFIX = 'del:done:';
export const TOMBSTONE_TTL_SECONDS = 30 * 24 * 60 * 60;

export function tombstoneKey(saveId) {
  return `${TOMBSTONE_PREFIX}${saveId}`;
}

/** Grava a lápide. Lança se o KV falhar — quem chama decide (em `account.js`
 *  a falha aqui acontece ANTES de qualquer destruição, então é 500 e retry). */
export async function writeTombstone(env, saveId, now = Date.now()) {
  await kvOrThrow(env).put(
    tombstoneKey(saveId),
    JSON.stringify({ at: now }),
    { expirationTtl: TOMBSTONE_TTL_SECONDS },
  );
}

/** Apaga a lápide — só usado para DESFAZER quando um passo reversível falhou
 *  depois dela e antes da primeira destruição. */
export async function clearTombstone(env, saveId) {
  await kvOrThrow(env).delete(tombstoneKey(saveId));
}

/**
 * Lê a lápide crua: `{ at }` (epoch ms da exclusão) ou `null`. Lápide gravada
 * antes de `at` existir (ou ilegível) vale como `at: 0` — bloqueia qualquer
 * sessão antiga e reabre para qualquer login com `auth_time` real, que é o
 * comportamento certo para uma lápide de idade desconhecida.
 * @returns {Promise<{ at: number } | null>}
 */
export async function readTombstone(env, saveId) {
  const raw = await kvOrThrow(env).get(tombstoneKey(saveId));
  if (raw === null) return null;
  try {
    const t = JSON.parse(raw);
    return { at: Number.isFinite(t?.at) ? t.at : 0 };
  } catch {
    return { at: 0 };
  }
}

/**
 * O PORTÃO da lápide, com a regra de reabertura (QA rodada 2, `00-skeptic-r2`
 * #1 — FATAL): a lápide bloqueava o MESMO e-mail por 30 dias, e o cliente,
 * ao receber 410, limpava o local e deslogava — em loop, porque a pessoa
 * logava de novo e criava conta nova sob o mesmo saveId.
 *
 * Regra: `authTime` (claim `auth_time` do JWT, em SEGUNDOS) posterior ao
 * instante da exclusão = a pessoa LOGOU DE NOVO depois de apagar. Login
 * posterior é intenção de voltar ("a porta fica aberta", `COPY.deleteDone`):
 * a lápide sai e a chamada segue. Token cuja sessão nasceu ANTES da exclusão
 * (o aparelho esquecido, que é o caso que a lápide existe para barrar)
 * continua 410. Sem `authTime` (auth desligada, token sem o claim) nunca
 * reabre.
 *
 * FAIL-OPEN na leitura do KV, como `isAccountDeleted`: KV fora do ar já vai
 * derrubar a operação seguinte com o erro certo. A falha ao APAGAR a lápide
 * na reabertura também não bloqueia: a chamada segue e a próxima tenta de
 * novo.
 *
 * @param {number} [authTime] segundos (epoch) do login; 0/undefined = desconhecido
 * @returns {Promise<{ deleted: boolean, reopened: boolean, at?: number }>}
 */
export async function gateTombstone(env, saveId, authTime) {
  let t = null;
  try {
    t = await readTombstone(env, saveId);
  } catch {
    return { deleted: false, reopened: false };
  }
  if (!t) return { deleted: false, reopened: false };
  const loginMs = typeof authTime === 'number' && authTime > 0 ? authTime * 1000 : 0;
  if (loginMs > t.at) {
    try {
      await clearTombstone(env, saveId);
    } catch (err) {
      console.warn('tombstone: reabertura não conseguiu apagar a lápide, chamada segue', {
        saveIdPrefix: String(saveId).slice(0, 8), err: String(err),
      });
    }
    console.info('tombstone: conta reaberta por login posterior à exclusão', {
      saveIdPrefix: String(saveId).slice(0, 8), deletedAt: t.at, loginAt: loginMs,
    });
    return { deleted: false, reopened: true };
  }
  // `at` sai junto para o cliente dizer "excluída em DD/MM" (contrato `deletedAt`, 22/09/2026).
  return { deleted: true, reopened: false, at: t.at };
}

/**
 * `true` se a conta foi apagada e ainda está no prazo da lápide. FAIL-OPEN de
 * propósito: se o KV explodir na leitura, a resposta é `false` e a rota segue
 * o caminho normal — a lápide é proteção extra, não o portão do save, e um KV
 * fora do ar já vai derrubar a operação seguinte com o erro certo.
 */
export async function isAccountDeleted(env, saveId) {
  try {
    return (await kvOrThrow(env).get(tombstoneKey(saveId))) !== null;
  } catch {
    return false;
  }
}
