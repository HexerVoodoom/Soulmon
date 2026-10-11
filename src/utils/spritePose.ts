/**
 * Pose do sprite do Soulmon (virar no eixo X, voar/aterrissar).
 *
 * ⚠️ ASSINATURA MÍNIMA criada pela branch `feat/chat-soulmon-agente` só para o
 * chat poder importar `applySpritePose`. A DONA da implementação (persistência,
 * renderização, único ponto de escrita) é a branch `feat/sprite-pose`: na hora
 * do merge, o arquivo dela substitui este inteiro, mantendo estes nomes e tipos.
 */
export type SpritePose = { flipX: boolean; altitude: 'ground' | 'air' };

let current: SpritePose = { flipX: false, altitude: 'ground' };

export function getSpritePose(): SpritePose {
  return current;
}

/** Aplica um patch parcial e devolve a pose resultante. */
export function applySpritePose(patch: Partial<SpritePose>): SpritePose {
  current = { ...current, ...patch };
  return current;
}
