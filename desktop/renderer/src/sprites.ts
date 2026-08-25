// O desktop NÃO tem tabela de sprites própria: reaproveita a do jogo
// (src/utils/sprites.ts) para que a criatura mostrada na barra de tarefas seja
// exatamente a mesma do celular.
//
// Diferença importante em relação ao overlay do DigiApp, de onde este código
// veio: lá as formas eram fixas (Agumon, Greymon...) e o desktop tinha uma
// grade pra escolher o bicho na mão. No Soulmon **cada jogador tem uma linha
// evolutiva única**, gerada pelo oráculo no onboarding — escolher a forma
// manualmente não faria sentido. Ela vem do save sincronizado, sempre.
import { getSpriteForStage } from '../../../src/utils/sprites';

/**
 * `eggType` do save. Ainda existe no save e no snapshot (cloudSync/state), mas
 * NÃO é mais parâmetro de sprite: desde `1b14d2b8` a arte vem toda de
 * `src/assets/soulmon/`, e a linha provisória deixou de existir como conceito.
 */
export type GenericLine = 'tapirmon' | 'veemon' | 'salamon';

/**
 * @param stage       id da forma ('rookie' | 'champion-virus' | 'ultra' …)
 * @param demoCharId  `demoCharacterId` do save (conta demo usa personagem pronto)
 */
export function petSprite(stage: string, demoCharId?: string): string {
  return getSpriteForStage(stage, demoCharId);
}

/**
 * Os sprites do jogo já são desenhados na orientação final. `LEFT_FACING_STAGES`
 * existia para as formas `digiegg`/`baby-i`, que sumiram quando a árvore passou a
 * nascer em rookie — a lista já era sempre falsa antes de ser removida em
 * `1b14d2b8`. Fica como função (e não some) porque o overlay espelha o sprite ao
 * andar (`main.ts:66`) e precisa saber qual é a orientação natural.
 */
export function facesLeft(_stage: string): boolean {
  return false;
}
