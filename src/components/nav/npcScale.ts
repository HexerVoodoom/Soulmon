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
 * Zoom do RETRATO do NPC (pedido do dono, 07/10/2026: "dar um zoom nos portraits dos NPCs"). A pegada na folha
 * não muda (a zona continua com 1/3 da tela): o `<img>` é ampliado a partir do canto SUPERIOR ESQUERDO da caixa,
 * então o rosto fica maior, o excesso desce para baixo da folha (a zona recorta ali — a folha está por cima) e
 * escorre um pouco sob o balão de fala (que fica acima, `z-index` 1). NÃO há moldura recortando: um recorte
 * retangular cortava o chapéu/ombro em linha reta (visto em 07/10/2026 com 1,5×), e a arte é busto 768²,
 * então 1,4× não borra.
 */
export const NPC_PORTRAIT_ZOOM = 1.4;
export const NPC_PORTRAIT_ORIGIN = '12% 0%';

/** Zoom das miniaturas de AVATAR (as fotos de perfil — NPCs recortados em círculo, `AvatarImg`). */
export const AVATAR_PORTRAIT_ZOOM = 1.3;
export const AVATAR_PORTRAIT_ORIGIN = '50% 38%';
