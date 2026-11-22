// Allowlist de eventos do site. Cliente (src/scripts/app.ts) e servidor importam este arquivo.
export const SECOES = ['topo', 'ciclo', 'seu-soulmon', 'colete', 'universo', 'recursos', 'trailer', 'entrar', 'inscrever', 'perguntas', 'como-funciona', 'mundo'];
export const EVENTOS = ['view', 'scroll25', 'scroll50', 'scroll75', 'scroll100', 'tempo30', 'tempo90', 'cta', ...SECOES.map((s) => 'sec_' + s)];
export const REFS = ['instagram', 'reddit', 'google', 'facebook', 'discord', 'whatsapp', 'play', 'outro', ''];

// Reduz o referrer a uma categoria (nunca guarda a URL).
export function refCategoria(ref) {
  if (!ref) return '';
  let h = '';
  try { h = new URL(ref).hostname.toLowerCase(); } catch { return 'outro'; }
  if (h.endsWith('soulmon.pages.dev')) return '';
  for (const k of ['instagram', 'reddit', 'google', 'facebook', 'discord', 'whatsapp']) if (h.includes(k)) return h.includes('play.google') ? 'play' : k;
  return 'outro';
}
