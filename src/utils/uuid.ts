/**
 * UUID v4 que NÃO derruba o app. Achado de 20/10/2026 (relatório de falha do APK): `crypto.randomUUID is not a
 * function` no 1º uso de um aparelho — a função some em WebView antigo ou fora de contexto seguro, e os dois pontos
 * que geravam o `SAVE_ID` a chamavam crua, dentro de um `useState`, o que derrubava a tela inteira (ErrorBoundary).
 *
 * Ordem: `randomUUID` quando existe → `getRandomValues` (v4 de verdade) → `Math.random` (último recurso; o id só precisa
 * ser único por aparelho, e o login troca o SAVE_ID pelo derivado do e-mail).
 */
export function newUuid(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  try {
    const u = c?.randomUUID?.();
    if (u) return u;
  } catch { /* segue */ }
  const b = new Uint8Array(16);
  try {
    if (c?.getRandomValues) c.getRandomValues(b);
    else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  } catch {
    for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  }
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
