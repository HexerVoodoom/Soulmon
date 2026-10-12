// ALERTA AO DONO por push FCM (release/beta-1; `abuso-e-custo.md` §3.4).
// Dispara quando um teto global passa de 80 % ou um disjuntor abre. No máximo
// 1×/tipo/dia (chave `alert:<dia>:<tipo>` com TTL de 2 dias). Sem dado pessoal
// no corpo — só o tipo e números agregados.
//
// Configuração (dono): `ADMIN_PUSH_TARGET` = o token FCM do aparelho do dono
// (pegue em Configurações → notificações do app, ou na chave `fcm:*`) e
// `FIREBASE_SERVICE_ACCOUNT` (o mesmo JSON do `workers/`) também na raiz.
// Sem os dois, o alerta só vai para o log (`console.warn`) — nunca derruba a rota.

import { kv } from './_kv.js';
import { getFcmAccessToken, sendFcmPush } from '../../workers/fcm.js';

export const ALERT_THRESHOLD = 0.8;
const TTL = 2 * 24 * 60 * 60;

/** Passou de 80 % AGORA (antes não tinha passado)? */
export function cruzouLimiar(antes, depois, limite, limiar = ALERT_THRESHOLD) {
  if (!(limite > 0)) return false;
  return antes < limite * limiar && depois >= limite * limiar;
}

/**
 * Manda (no máximo 1×/tipo/dia) um push ao dono. Nunca lança.
 * @param {string} tipo  ex.: `chat-80`, `sprite-day-80`, `disjuntor-groq`
 * @param {string} texto curto, sem dado pessoal
 * @returns {Promise<'sent'|'dup'|'log'|'error'>}
 */
export async function alertAdmin(env, tipo, texto, now = new Date()) {
  try {
    const store = kv(env);
    const key = `alert:${now.toISOString().slice(0, 10)}:${String(tipo).replace(/[^\w-]/g, '').slice(0, 40)}`;
    if (store) {
      if (await store.get(key)) return 'dup';
      await store.put(key, '1', { expirationTtl: TTL });
    }
    console.warn(`[alerta] ${tipo}: ${texto}`);
    const alvo = env?.ADMIN_PUSH_TARGET;
    const saRaw = env?.FIREBASE_SERVICE_ACCOUNT;
    if (!alvo || !saRaw) return 'log';
    const sa = JSON.parse(saRaw);
    const token = await getFcmAccessToken(sa);
    const r = await sendFcmPush(alvo, { title: 'Soulmon: alerta de uso', body: `${tipo}: ${texto}`.slice(0, 180), tag: `alerta-${tipo}` }, sa.project_id, token);
    return r.ok ? 'sent' : 'error';
  } catch (err) {
    console.error('[alerta] falhou', err?.message);
    return 'error';
  }
}
