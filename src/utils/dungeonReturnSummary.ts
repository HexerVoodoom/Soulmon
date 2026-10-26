/** O resumo da volta SOZINHA do Soulmon (descida que acabou fora da tela). Mora no save (`dungeonReturnPending`) até o jogador fechar o aviso — fechar o app não o perde. */
export interface DungeonReturnSummary {
  layers: number;
  bits: number;
  fragments: number;
  hearts: number;
  glitchtama: number;
  ended: string | null;
}

const n = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1e9, Math.floor(v))) : 0);

/** Leitura tolerante (campo opcional: save antigo não o tem; lixo → `undefined`). */
export function sanitizeDungeonReturnSummary(raw: unknown): DungeonReturnSummary | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  return {
    layers: n(r.layers), bits: n(r.bits), fragments: n(r.fragments), hearts: n(r.hearts), glitchtama: n(r.glitchtama),
    ended: typeof r.ended === 'string' && r.ended.length <= 16 ? r.ended : null,
  };
}
