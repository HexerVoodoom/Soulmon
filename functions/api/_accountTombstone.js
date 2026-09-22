// LÁPIDE de conta apagada — `del:done:<saveId>`.
//
// Por que existe (QA rodada 1, `03-arquitetura-r1.md` §2.5): depois que
// `account.js` › `delete-confirm` apaga o save, qualquer OUTRO aparelho do
// titular ainda logado (token Firebase vale 1 h; o cliente faz `POST /api/save`
// 3 s depois de qualquer mutação) recriava o save inteiro. A exclusão virava
// "apaguei por 3 segundos" — e a pessoa, que pediu para sumir, continuava no
// servidor sem saber.
//
// A lápide é gravada ANTES da primeira destruição e lida por `save.js` em GET
// e POST: com ela presente, a resposta é **410 `account-deleted`**, e o cliente
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
