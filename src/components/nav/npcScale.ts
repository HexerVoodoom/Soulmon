/**
 * Escala do NPC na folha do lote (pedido do dono, 29/09/2026: "os npcs podem
 * aumentar em uns 40%"). Multiplica o teto de largura que valia antes
 * (`NPC_BASE_MAX_WIDTH_PCT`, 46% da zona). A ALTURA continua limitada pela zona
 * de 1/3 da tela — o NPC nunca sobe sobre o título da área — então em telas
 * baixas o ganho real fica abaixo de 1,4×.
 */
export const NPC_SCALE = 1.4;
export const NPC_BASE_MAX_WIDTH_PCT = 46;
export const NPC_MAX_WIDTH_PCT = Math.round(NPC_BASE_MAX_WIDTH_PCT * NPC_SCALE * 100) / 100;

/**
 * ⚰️ `NPC_PORTRAIT_ZOOM` (1,4×, 07/10/2026) SAIU: o zoom do dono era para o AVATAR do usuário, não para os NPCs
 * dos mapas. O NPC da folha volta ao tamanho de antes (teto `NPC_MAX_WIDTH_PCT`, altura da zona) e, em vez de
 * ampliar, SOBE: a base da arte entra sob a folha só por `NPC_BASE_UNDER_SHEET` (fração da altura da arte).
 */
export const NPC_BASE_UNDER_SHEET = 0.04;

/** Zoom das miniaturas de AVATAR (as fotos de perfil — NPCs recortados em círculo, `AvatarImg`). */
export const AVATAR_PORTRAIT_ZOOM = 1.3;
export const AVATAR_PORTRAIT_ORIGIN = '50% 38%';

/**
 * Respiro do TOPO da zona do NPC acima do retrato (pedido do dono, 07/10/2026: "todos os NPCs estão muito baixos,
 * atrás do modal — mais acima, sem cropar em cima"). Antes a zona reservava 60px (a faixa inteira do ✕) e o busto
 * começava abaixo dele; agora o busto sobe até `NPC_TOP_PAD_PX` (sobre o `safe-area-inset-top`) e o ✕ passa a
 * flutuar sobre o canto superior esquerdo, onde a arte (busto centrado) é vazia. Fonte ÚNICA — o `AreaSheet` só lê.
 * A zona tem `overflow: hidden`, então o piso (`safe-area` + este valor) é o que garante que o topo nunca corta.
 */
export const NPC_TOP_PAD_PX = 18;

/**
 * Margem VAZIA no topo da arte (fração 0–1 da altura), medida do alfa — as artes têm proporções diferentes (os NPCs
 * de domínio têm a cabeça bem abaixo do topo do quadrado) e com a margem vazia o busto parecia afundado atrás da folha.
 * O `AreaSheet` sobe o retrato por esta fração (× zoom), PARADO em `NPC_TOP_TRIM_KEEP` de folga: o topo da cabeça
 * nunca encosta no corte. Cache por `src`; sem canvas (teste/SSR) devolve 0 e nada muda.
 */
export const NPC_TOP_TRIM_KEEP = 0.012;
export const NPC_TOP_TRIM_MAX = 0.5;
const trimCache = new Map<string, number>();
export function npcTopTrimCached(src: string): number | undefined { return trimCache.get(src); }
export function measureNpcTopTrim(src: string): Promise<number> {
  const hit = trimCache.get(src);
  if (hit !== undefined) return Promise.resolve(hit);
  return new Promise(resolve => {
    try {
      const img = new Image();
      img.onload = () => {
        let t = 0;
        try {
          const w = 96, h = 96;
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          const ctx = c.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const d = ctx.getImageData(0, 0, w, h).data;
            let row = 0;
            outer: for (; row < h; row++) for (let x = 0; x < w; x++) if (d[(row * w + x) * 4 + 3] > 24) break outer;
            t = Math.min(NPC_TOP_TRIM_MAX, Math.max(0, row / h - NPC_TOP_TRIM_KEEP));
          }
        } catch { t = 0; }
        trimCache.set(src, t); resolve(t);
      };
      img.onerror = () => resolve(0);
      img.src = src;
    } catch { resolve(0); }
  });
}
