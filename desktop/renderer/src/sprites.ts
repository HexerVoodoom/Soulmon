// O desktop NÃO tem tabela de sprites própria: reaproveita a do jogo
// (src/utils/sprites.ts) para que a criatura mostrada na barra de tarefas seja
// exatamente a mesma do celular.
//
// Diferença importante em relação ao overlay do DigiApp, de onde este código
// veio: lá as formas eram fixas (Agumon, Greymon...) e o desktop tinha uma
// grade pra escolher o bicho na mão. No Soulmon **cada jogador tem uma linha
// evolutiva única**, gerada pelo oráculo no onboarding — escolher a forma
// manualmente não faria sentido. Ela vem do save sincronizado, sempre.
import { getSpriteForStage, artFacesLeft } from '../../../src/utils/sprites';

/**
 * `eggType` do save. Ainda existe no save e no snapshot (cloudSync/state), mas
 * NÃO é mais parâmetro de sprite: desde `1b14d2b8` a arte vem toda de
 * `src/assets/soulmon/`, e a linha provisória deixou de existir como conceito.
 */
export type GenericLine = 'tapirmon' | 'veemon' | 'salamon';

/**
 * @param stage       id da forma ('rookie' | 'champion-power' | 'ultra' …)
 * @param demoCharId  `demoCharacterId` do save (conta demo usa personagem pronto)
 */
export function petSprite(stage: string, demoCharId?: string): string {
  return getSpriteForStage(stage, demoCharId);
}

/**
 * Para onde a arte olha — o MESMO dono do app (`artFacesLeft`, src/utils/sprites.ts).
 * Antes isto era um `false` fixo e o overlay andava de costas com as linhas de arte
 * que olham para a esquerda (11/10/2026). O overlay espelha o sprite ao andar
 * (`main.ts`) e precisa saber a orientação natural.
 */
export function facesLeft(stage: string, demoCharId?: string): boolean {
  return artFacesLeft(stage, demoCharId);
}
