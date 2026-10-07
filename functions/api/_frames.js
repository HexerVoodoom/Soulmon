// A LISTA FECHADA de molduras de avatar (ids), espelho do catalogo `FRAMES` de `src/utils/frames.ts`.
// O servidor guarda/devolve so ids desta lista (moldura equipada do save e do perfil publico); qualquer outra coisa
// vira null. A paridade com o cliente e travada em `functions/api/avatarPerfil.parity.test.js` (mudou um lado, mude os dois).
export const FRAME_IDS = new Set([
  'rank-madeira', 'rank-bronze', 'rank-prata', 'rank-ouro', 'rank-platina', 'rank-diamante', 'rank-mestre', 'rank-grao-mestre',
  'loja-folhagem', 'loja-cristal', 'loja-brasa', 'conquista-constancia', 'evento-lua-colheita', 'evento-primeira-season',
]);

/** Id de moldura do catalogo ou `null`. */
export function frameIdOrNull(raw) {
  return typeof raw === 'string' && FRAME_IDS.has(raw) ? raw : null;
}
