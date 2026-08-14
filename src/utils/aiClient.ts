import { STORAGE_KEYS } from './storageKeys';
import { authHeaders } from './auth';
import { readLocal } from './safeStorage';

// Único caminho do cliente para as rotas de IA que custam dinheiro
// (`/api/chat`, `/api/suggest-tasks`, `/api/generate-sprite`).
//
// Existe para que nenhuma chamada nova esqueça de mandar a identificação: o
// servidor recusa quem não manda `id` (ver functions/api/_aiGuard.js), então
// uma chamada montada à mão simplesmente pararia de funcionar — e o motivo
// (`missing-save-id`) não é óbvio de longe.

/** POST numa rota de IA, já com saveId e Authorization. `signal` para timeout. */
export async function aiFetch(
  path: string,
  body: Record<string, unknown>,
  init: { signal?: AbortSignal } = {},
): Promise<Response> {
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ ...body, id: readLocal(STORAGE_KEYS.SAVE_ID) }),
    signal: init.signal,
  });
}
