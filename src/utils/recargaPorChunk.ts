// Chunk velho / import dinâmico que falha logo depois de um deploy (o index em cache aponta para um
// arquivo com hash que já não existe): UM reload resolve. A guarda em sessionStorage impede o laço
// de reloads se o erro persistir (aí a tela de erro aparece, com os detalhes).
export const CHAVE_RECARGA_CHUNK = 'soulmon-chunk-reload';

/** Padrões de mensagem de falha de import dinâmico nos WebViews/navegadores comuns. */
const PADRAO_CHUNK = /dynamically imported module|importing a module script failed|error loading dynamically imported|failed to fetch dynamically|unable to preload css|loading (css )?chunk [\w-]+ failed/i;

export function ehErroDeChunk(reason: unknown): boolean {
  const msg = reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : (reason as { message?: unknown } | null)?.message;
  return typeof msg === 'string' && PADRAO_CHUNK.test(msg);
}

/** `true` se disparou o reload; `false` se já recarregou nesta sessão ou o storage falhou. */
export function recarregarUmaVez(recarregar: () => void = () => window.location.reload()): boolean {
  try {
    if (sessionStorage.getItem(CHAVE_RECARGA_CHUNK)) return false;
    sessionStorage.setItem(CHAVE_RECARGA_CHUNK, String(Date.now()));
  } catch {
    // Sem sessionStorage não há como garantir o "uma vez": melhor não recarregar (evita laço).
    return false;
  }
  recarregar();
  return true;
}

export function installChunkReloadHandlers(target: Pick<Window, 'addEventListener'> = window, recarregar?: () => void): void {
  target.addEventListener('vite:preloadError', (e) => {
    if (recarregarUmaVez(recarregar)) (e as Event).preventDefault?.();
  });
  target.addEventListener('unhandledrejection', (e) => {
    if (ehErroDeChunk((e as PromiseRejectionEvent).reason)) recarregarUmaVez(recarregar);
  });
}
