// O desktop NÃO tem tabela de sprites própria: reaproveita a do jogo
// (src/utils/sprites.ts) para que a criatura mostrada na barra de tarefas seja
// exatamente a mesma do celular.
//
// Diferença importante em relação ao overlay do DigiApp, de onde este código
// veio: lá as formas eram fixas (Agumon, Greymon...) e o desktop tinha uma
// grade pra escolher o bicho na mão. No Soulmon **cada jogador tem uma linha
// evolutiva única**, gerada pelo oráculo no onboarding — escolher a forma
// manualmente não faria sentido. Ela vem do save sincronizado, sempre.
//
// Precisa do alias `figma:asset/<hash>.png`, gerado em vite.config.ts.
import { getSpriteForStage, LEFT_FACING_STAGES } from '../../../src/utils/sprites';

export type GenericLine = 'tapirmon' | 'veemon' | 'salamon';

/**
 * @param stage        id da forma ('rookie' | 'champion-virus' | 'ultra' …)
 * @param genericLine  `eggType` do save — linha de sprite provisória
 * @param demoCharId   `demoCharacterId` do save (conta demo usa personagem pronto)
 */
export function petSprite(stage: string, genericLine: GenericLine = 'tapirmon', demoCharId?: string): string {
  return getSpriteForStage(stage, genericLine, demoCharId);
}

/** Sprites do jogo olham para a ESQUERDA por padrão, com estas exceções. */
export function facesLeft(stage: string): boolean {
  return LEFT_FACING_STAGES.includes(stage);
}
