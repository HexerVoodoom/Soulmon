// Derive a stable save id from an email so the same email = the same cloud
// save on any device, no manual code copying. Matches the server's VALID_ID
// regex (^[a-zA-Z0-9_-]{8,64}$): we return 32 hex chars.
//
// The salt namespaces the hash to THIS product. Soulmon's KV binding
// (DIGIAPP_SAVES) still points at the same underlying namespace as the old
// DigiApp product it was forked from — with a shared "digiapp:" salt, the
// same email hashed to the SAME key in both apps, so logging into Soulmon
// with an email already used in DigiApp loaded DigiApp's (foreign-shaped)
// save instead of creating a fresh Soulmon one. "soulmon:" makes the two
// products derive different keys even while the raw KV storage is shared.
import { authHeaders } from './auth';
import { STORAGE_KEYS } from './storageKeys';
import { writeLocal } from './safeStorage';

export async function emailToSaveId(email: string): Promise<string> {
  const norm = email.trim().toLowerCase();
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`soulmon:${norm}`));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

/**
 * Envia o save para a nuvem. Devolve `true` só quando o SERVIDOR confirmou.
 *
 * O carimbo `digiapp-last-cloud-sync` é o que o app mostra como "sincronizado":
 * gravá-lo sem checar `res.ok` fazia o app afirmar que o progresso estava na
 * nuvem depois de um 401 (token expirado), 403 ou 500 — o jogador trocava de
 * aparelho confiando nisso e perdia tudo. Falhou = não carimba, e quem chama
 * recebe `false` para reagendar/avisar.
 */
export async function cloudSave(saveId: string, state: unknown): Promise<boolean> {
  try {
    const res = await fetch(`/api/save?id=${saveId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ state }),
    });
    if (!res.ok) {
      console.warn('cloudSave: servidor recusou o save', { status: res.status });
      return false;
    }
    // `writeLocal`, não `setItem` cru: com o storage cheio o `setItem` lançava
    // DENTRO deste try e o `catch` devolvia `false` — o servidor tinha aceitado
    // o save e o app relatava falha. O carimbo é conveniência; o resultado da
    // gravação na nuvem é o que a função promete.
    writeLocal(STORAGE_KEYS.LAST_CLOUD_SYNC, new Date().toISOString());
    return true;
  } catch {
    // Silent — local save already persisted
    return false;
  }
}

export async function cloudLoad(saveId: string): Promise<unknown | null> {
  try {
    const res = await fetch(`/api/save?id=${saveId}`, { headers: await authHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    return data.found ? data.state : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// ADOÇÃO DE SAVE DA NUVEM — o único caminho que SUBSTITUI o save inteiro.
//
// Quatro call sites faziam isto à mão (`App.tsx` no onboarding, no "proteger
// progresso", no restaurar e no login por e-mail), todos com `setItem` cru e na
// ordem errada:
//
//   localStorage.setItem(SAVE_ID, novoId);        // pequeno, sempre passa
//   localStorage.setItem(GAME_STATE, gigante);    // ← lança com storage cheio
//   window.location.reload();                     // ← nunca acontece
//
// Com o storage cheio (origem COMPARTILHADA com o DigiApp) ou bloqueado, o
// `QuotaExceededError` subia numa função async passada como prop: rejeição não
// tratada, sem reload, sem mensagem — o botão parecia não fazer nada. E o dano
// não era só cosmético: a IDENTIDADE já tinha trocado sem o dado. O provider
// seguia com o estado ANTIGO e, no próximo `setGameState`, subia esse estado
// antigo para o `saveId` novo — sobrescrevendo, em silêncio, o save do outro
// aparelho. Perda de save é o moat.
//
// Aqui a ordem é invertida (dado primeiro, identidade depois) e nada lança.
// ---------------------------------------------------------------------------

/** `true` só para objeto simples — array/primitivo viram `{}` e apagam tudo. */
function isPlainState(state: unknown): state is Record<string, unknown> {
  return typeof state === 'object' && state !== null && !Array.isArray(state);
}

export type AdoptResult = 'ok' | 'invalid' | 'storage';

/**
 * Grava o save vindo da nuvem e só então troca a identidade local.
 * Nunca lança. Quem chama só deve recarregar a página com `'ok'`.
 */
export function adoptCloudSave(
  saveId: string,
  state: unknown,
  email?: string,
): AdoptResult {
  if (!isPlainState(state)) {
    console.warn('[cloudSave] adoção recusada: state da nuvem não é objeto', {
      type: Array.isArray(state) ? 'array' : typeof state,
    });
    return 'invalid';
  }
  let serialized: string;
  try {
    serialized = JSON.stringify(state);
  } catch {
    return 'invalid';
  }
  // DADO PRIMEIRO. Se isto falhar, a identidade NÃO troca e o jogador continua
  // no save que ele já tinha, em vez de ficar apontado para um save vazio.
  if (!writeLocal(STORAGE_KEYS.GAME_STATE, serialized)) return 'storage';
  writeLocal(STORAGE_KEYS.SAVE_ID, saveId);
  if (email) writeLocal(STORAGE_KEYS.USER_EMAIL, email.trim().toLowerCase());
  return 'ok';
}
