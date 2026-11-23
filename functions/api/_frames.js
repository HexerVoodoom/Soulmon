// A LISTA FECHADA de molduras de avatar (ids), espelho do catalogo `FRAMES` de `src/utils/frames.ts`.
// O servidor guarda/devolve so ids desta lista (moldura equipada do save e do perfil publico); qualquer outra coisa
// vira null. A paridade com o cliente e travada em `functions/api/avatarPerfil.parity.test.js` (mudou um lado, mude os dois).
export const FRAME_IDS = new Set([
  'basico', 'rank-madeira', 'rank-bronze', 'rank-prata', 'rank-ouro', 'rank-platina', 'rank-diamante', 'rank-mestre', 'rank-grao-mestre',
  'loja-folhagem', 'loja-cristal', 'loja-brasa', 'conquista-constancia', 'evento-lua-colheita', 'evento-primeira-season',
  // Temas e elementos (04/11/2026) — espelho de `COSMETICOS_NOVOS` (utils/cosmeticosNovos.ts); as 32 molduras estão instaladas.
  'frame-cerejeira-galhos-em-flor',
  'frame-cerejeira-petalas-em-espiral',
  'frame-el-agua',
  'frame-el-ar',
  'frame-el-arcano',
  'frame-el-eletricidade',
  'frame-el-espaco',
  'frame-el-fada',
  'frame-el-fogo',
  'frame-el-gravidade',
  'frame-el-industrial',
  'frame-el-luz',
  'frame-el-marcial',
  'frame-el-morte',
  'frame-el-planta',
  'frame-el-som',
  'frame-el-sombra',
  'frame-el-tempo',
  'frame-el-terra',
  'frame-el-vida',
  'frame-el-vigor',
  'frame-el-vileza',
  'frame-jardim-guirlanda-silvestre',
  'frame-jardim-hera-e-margaridas',
  'frame-lava-basalto-rachado',
  'frame-lava-coroa-de-brasas',
  'frame-mar-profundo-coral-e-concha',
  'frame-mar-profundo-tentaculos-de-luz',
  'frame-neve-coroa-de-pinheiro',
  'frame-neve-geada-cristalina',
  'frame-ruinas-concreto-e-vergalhao',
  'frame-ruinas-sucata-florida',
  // Conjunto Fundador (23/11/2026): moldura de concessão (2º dia com tarefa). Espelho de `fundadorCatalogo.ts`.
  'founder-moldura',
]);

/** Id de moldura do catalogo ou `null`. */
export function frameIdOrNull(raw) {
  return typeof raw === 'string' && FRAME_IDS.has(raw) ? raw : null;
}
