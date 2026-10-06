// ---------------------------------------------------------------------------
// AVATAR DE PERFIL (Tarefa C, 06/10/2026) — a foto de perfil é um NPC da arte do jogo.
//
// O save e o servidor guardam SÓ o id (`GameState.avatarId`), nunca URL nem texto livre: o id vale se
// estiver na LISTA FECHADA `src/assets/avatares/catalogo.json` (gerada por `scripts/gerar-avatares.mjs`,
// espelhada no servidor em `functions/api/_avatares.js`; `avatar.test.ts` trava a paridade). Este módulo é
// leve de propósito (fica no chunk de entrada): não importa o catálogo nem as imagens. A MOLDURA reusa
// `equippedFrame` (`utils/frames.ts`).
// ---------------------------------------------------------------------------

/** Formato do id (o catálogo inteiro cabe nele; o servidor confere o id contra a lista, não só o formato). */
export const AVATAR_ID_RE = /^[a-z0-9-]{1,48}$/;

/** Padrões possíveis para quem nunca escolheu: poucos NPCs ativos e simpáticos, conferidos contra o catálogo no teste. */
export const DEFAULT_AVATAR_IDS: readonly string[] = [
  'ativo-onboarding', 'ativo-hall', 'ativo-laboratorio', 'ativo-mercado', 'ativo-arena', 'ativo-exploracao',
];

/** Id saneado na FORMA (o save nunca guarda lixo); quem decide se está no catálogo é o servidor / a grade. */
export function sanitizeAvatarId(raw: unknown): string | null {
  return typeof raw === 'string' && AVATAR_ID_RE.test(raw) ? raw : null;
}

function hash(seed: string): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Padrão DETERMINÍSTICO por semente (saveId do dono, ou id público de outra pessoa): mesma semente, mesmo NPC. */
export function defaultAvatarId(seed: string | null | undefined): string {
  return DEFAULT_AVATAR_IDS[hash(String(seed ?? '')) % DEFAULT_AVATAR_IDS.length];
}

/** O id a mostrar: o escolhido (se bem formado) ou o padrão da semente. */
export function resolveAvatarId(avatarId: unknown, seed: string | null | undefined): string {
  return sanitizeAvatarId(avatarId) ?? defaultAvatarId(seed);
}
