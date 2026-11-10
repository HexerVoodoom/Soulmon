/**
 * Contas GM/admin FORA dos rankings do Torneio (pedido do dono, 06/11/2026).
 *
 * Quem é admin é decidido SÓ no servidor, por `ADMIN_EMAILS` (`_admin.js`). O saveId é derivado do e-mail
 * (`emailToSaveId`), então a lista de e-mails dá, sem token, o conjunto de saveIds que ficam de fora. O admin:
 *   · luta normalmente (a linha `rank:<season>:<saveId>` continua existindo, com a cota diária);
 *   · NÃO entra no índice ordenável (`indexarPontos` é pulado) e é filtrado na LEITURA de índice/lista que já
 *     existia — nada é apagado do KV;
 *   · NÃO ocupa posição (os outros sobem um lugar), NÃO aparece em `rank`/`seasonResult`/oponentes,
 *     NÃO leva troféu nem a carta de Honra da temporada.
 * Falha fechada para o ranking: sem `ADMIN_EMAILS` o conjunto é vazio e nada muda.
 */
import { parseAdminEmails } from './_admin.js';
import { emailToSaveId } from './_auth.js';

/** `ADMIN_EMAILS` (texto) → Set de saveIds. Cache por valor do secret: o hash é refeito só se a lista mudar. */
const cache = new Map();
export async function adminSaveIds(env) {
  const raw = typeof env?.ADMIN_EMAILS === 'string' ? env.ADMIN_EMAILS : '';
  if (!raw) return new Set();
  const hit = cache.get(raw);
  if (hit) return hit;
  const emails = [...parseAdminEmails(raw)];
  const ids = new Set(await Promise.all(emails.map(e => emailToSaveId(e))));
  cache.clear();
  cache.set(raw, ids);
  return ids;
}

/** `true` se o saveId é de uma conta GM/admin. */
export async function isAdminSaveId(env, saveId) {
  return (await adminSaveIds(env)).has(saveId);
}
