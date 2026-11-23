import { scrub } from './crashReport';
import { APP_VERSION, BUILD_ID } from '../components/FeedbackLink';

/** Linha curta para a tela de erro e o e-mail de feedback: mensagem + início do stack (scrub: sem e-mail/ids) + versão. */
export function detalhesDoErro(error: Error | null): string {
  const msg = scrub(error?.message || error?.name || 'erro', 160);
  const stack = scrub((error?.stack ?? '').split('\n').slice(1, 3).join(' '), 140);
  const corpo = stack ? `${msg} @ ${stack}` : msg;
  return `${corpo.slice(0, 300)} · v${APP_VERSION} · ${BUILD_ID}`;
}

/** Limpa os caches do service worker e o desregistra, depois recarrega. Nunca lança. */
export async function limparSwERecarregar(recarregar: () => void = () => window.location.reload()): Promise<void> {
  try {
    if (typeof caches !== 'undefined') {
      const nomes = await caches.keys();
      await Promise.all(nomes.map((n) => caches.delete(n)));
    }
  } catch { /* segue */ }
  try {
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch { /* segue */ }
  recarregar();
}
