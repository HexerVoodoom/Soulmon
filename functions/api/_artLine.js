// A LINHA DE ARTE pública de um perfil (D-60, 19/10/2026): só um id de lista FECHADA — sem dado pessoal.
// Existe para o cliente desenhar o oponente com a arte DELE (starter, linha ou o corvinho) e não com a
// árvore genérica descartada. Paridade com `src/utils/sprites.ts` (`DEMO_CHARACTER_IDS` + linhas da masmorra)
// e `corvoPet.ts` travada em `src/utils/artLine.test.ts`.
export const ART_LINE_IDS = new Set([
  'industrial', 'nascente', 'alento', 'vida', 'meteoro',
  'kaelen', 'orrin', 'thalindra', 'igni', 'nautilu', 'astrase',
  // Linhas APOSENTADAS (20/10/2026): aceitas só na LEITURA (perfil/save antigo); o servidor nunca as produz.
  'ignar', 'lumel', 'serah',
  'corvo',
]);

/** Id de linha de arte da lista fechada ou `null`. */
export function artLineOrNull(raw) {
  return typeof raw === 'string' && ART_LINE_IDS.has(raw) ? raw : null;
}

const HOSTS_DE_SPRITE = new Set([
  'd8j0ntlcm91z4.cloudfront.net',
  'images.higgs.ai',
  'platform.higgsfield.ai',
]);

/**
 * URL pública de um sprite gerado pelo jogador, ou `null`.
 * Aceita APENAS:
 *  - o nosso próprio endpoint de blob (`/api/sprite-image?k=<32 hex>`, normalizando URLs absolutas que terminam nele), ou
 *  - URLs `https:` cujo `hostname` exato está em `HOSTS_DE_SPRITE` (mesma allowlist de `src/utils/spriteLibrary.ts`).
 * Rejeita qualquer outro host/esquema para impedir beacon/SSRF.
 */
export function spriteUrlOrNull(raw) {
  if (typeof raw !== 'string') return null;
  const limpa = raw.replace(/[\t\n\r]/g, '').trim().slice(0, 500);
  if (!limpa) return null;
  const blobMatch = /^(?:https?:\/\/[^/]+)?(\/api\/sprite-image\?k=[0-9a-f]{32})$/i.exec(limpa);
  if (blobMatch) return `/api/sprite-image?k=${blobMatch[1].slice('/api/sprite-image?k='.length).toLowerCase()}`;
  try {
    const u = new URL(limpa);
    if (u.protocol !== 'https:' || u.username || u.password) return null;
    if (!HOSTS_DE_SPRITE.has(u.hostname.toLowerCase())) return null;
    return limpa;
  } catch {
    return null;
  }
}

/**
 * Extrai `{ spriteUrl, artLine }` de um estado de save já parseado (quando o perfil público ainda não tem o sprite gravado).
 */
export function spriteFromSaveState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return { spriteUrl: null, artLine: null };
  const isCorvo = state.soulmonMeta && typeof state.soulmonMeta === 'object' && state.soulmonMeta.creature === 'corvo';
  const artLine = isCorvo ? 'corvo' : artLineOrNull(state.demoCharacterId);
  if (isCorvo) return { spriteUrl: null, artLine: 'corvo' };
  const lib = state.spriteLibrary && typeof state.spriteLibrary === 'object' ? state.spriteLibrary : null;
  const sprites = lib?.sprites && typeof lib.sprites === 'object' ? lib.sprites : null;
  if (!sprites) return { spriteUrl: null, artLine };
  const stage = typeof state.evolutionStage === 'string' ? state.evolutionStage : 'rookie';
  const reverted = Array.isArray(lib?.reverted) ? lib.reverted : [];
  const pendingForm = lib?.pendingTune && typeof lib.pendingTune === 'object' ? lib.pendingTune.formId : null;
  const prevSprites = lib?.previousSprites && typeof lib.previousSprites === 'object' ? lib.previousSprites : null;
  let entry = null;
  if (pendingForm === stage || reverted.includes(stage)) {
    entry = prevSprites?.[stage] ?? null;
  } else {
    entry = sprites[stage] ?? null;
  }
  const fallbackEntry = Object.values(sprites).find(e => e && typeof e === 'object' && typeof e.url === 'string');
  const rawUrl = (entry && typeof entry === 'object' && typeof entry.url === 'string' ? entry.url : null)
    ?? (fallbackEntry && typeof fallbackEntry.url === 'string' ? fallbackEntry.url : null);
  return { spriteUrl: spriteUrlOrNull(rawUrl), artLine };
}
