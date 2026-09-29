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
