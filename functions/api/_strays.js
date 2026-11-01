// DESGARRADOS DE JOGADORES (01/11/2026, REGISTRO §213) — regra do dono: desgarrado = o Soulmon de um jogador que ficou
// 90 DIAS sem entrar. Antes disto o servidor não guardava "último acesso": o `t` do metadata do save só renova a cada 30 dias
// e o `updatedAt` do perfil só muda quando o app grava o perfil. Agora:
//  · `profile.lastLoginAt` (ms) é tocado no GET do save (= abrir o app logado), no máximo 1 escrita por dia por conta
//    (`touchLastLogin`), e também a cada POST do perfil (`community.js`, action=profile);
//  · o último acesso conhecido é o MAIOR de `lastLoginAt` e `updatedAt` (perfil anterior ao campo usa só `updatedAt`);
//    sem nenhuma data → NUNCA é desgarrado (não se inventa inatividade);
//  · escondido (`publicHidden`) e jogador simulado nunca entram (consentimento de lista pública; bot não "some");
//  · o dono volta → o GET do save toca `lastLoginAt` → sai do pool na hora (o Soulmon nunca saiu do save dele).
// O que sai para o cliente é ANÔNIMO: `sid` (hash do pid aleatório, nunca o saveId nem o pid), estágio, sprite (allowlist) e
// elemento. Sem nome, apelido, pid, amigos ou datas.
import { getProfile, putProfile } from './_profile.js';
import { spriteUrlOrNull } from './_artLine.js';
import { isSimuladoId } from './_simulados.js';

export const STRAY_INACTIVE_DAYS = 90;
export const STRAY_INACTIVE_MS = STRAY_INACTIVE_DAYS * 86_400_000;
/** Intervalo mínimo entre dois toques de `lastLoginAt` (custo: no máximo 1 escrita de KV por dia por conta). */
export const LAST_LOGIN_TOUCH_MS = 86_400_000;
/** Teto do pool devolvido por `action=strays`. */
export const STRAY_POOL_MAX = 30;

const ts = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

/** Último acesso conhecido (ms) do perfil, ou 0 se não há data nenhuma. */
export function lastActiveAt(p) {
  if (!p || typeof p !== 'object') return 0;
  return Math.max(ts(p.lastLoginAt), ts(p.updatedAt));
}

/** O perfil é de um desgarrado AGORA? (puro) */
export function isStrayProfile(p, now, saveId = p?.id) {
  if (!p || typeof p !== 'object' || p.publicHidden === true) return false;
  if (isSimuladoId(saveId) || isSimuladoId(p.id)) return false;
  if (typeof p.pid !== 'string' || !p.pid) return false;
  const t = lastActiveAt(p);
  return t > 0 && now - t >= STRAY_INACTIVE_MS;
}

/** Id público do desgarrado: 24 hex de SHA-256 do pid (o pid é aleatório; o caminho inverso não existe). */
export async function strayIdOf(pid) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`soulmon-stray:${pid}`));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}

const STAGE = /^[A-Za-z0-9_.-]{1,40}$/;
const ELEMENT = /^[a-z][a-z0-9_-]{0,31}$/;

/** A face pública (anônima) do desgarrado. */
export async function strayView(p) {
  const out = { sid: await strayIdOf(p.pid), stage: STAGE.test(String(p.stage ?? '')) ? p.stage : 'rookie' };
  const sprite = spriteUrlOrNull(p.spriteUrl);
  if (sprite) out.spriteUrl = sprite;
  if (typeof p.element === 'string' && ELEMENT.test(p.element)) out.element = p.element;
  return out;
}

/**
 * Toca `lastLoginAt` do perfil da conta (GET do save). Sem perfil = nada (quem nunca gravou perfil não tem Soulmon público).
 * Falha nunca derruba quem chamou. Devolve `true` se escreveu.
 */
export async function touchLastLogin(env, saveId, now = Date.now()) {
  try {
    const p = await getProfile(env, saveId);
    if (!p || now - ts(p.lastLoginAt) < LAST_LOGIN_TOUCH_MS) return false;
    await putProfile(env, saveId, { ...p, lastLoginAt: now });
    return true;
  } catch (err) {
    console.warn('strays: toque de último acesso falhou', { saveIdPrefix: String(saveId).slice(0, 8), err: String(err) });
    return false;
  }
}
