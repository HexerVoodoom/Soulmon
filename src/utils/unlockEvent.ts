/**
 * O pedido do jogo para abrir o desbloqueio de conta (o MESMO modal do "Gerar personagem", `App.tsx`).
 * Mora num módulo MINÚSCULO de propósito: `spriteGen.ts` puxa o pixelizador e não pode entrar no chunk de entrada
 * só para o `App` saber o nome de um evento (o orçamento de bytes da entrada é testado em `src/deploy`).
 */
export const UNLOCK_NEEDED_EVENT = 'soulmon:unlock-needed';
