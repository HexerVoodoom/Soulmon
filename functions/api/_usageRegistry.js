/**
 * Registros de NOMES do tempo de uso (09/11/2026, `docs/PLANO-METRICAS.md`). O evento leva só o ÍNDICE (`item`); o nome vira chave
 * do agregado aqui. ESPELHO de `src/utils/usageTime.ts` (Pages Functions não importam de `src/`): `usageTime.test.ts` trava a paridade.
 * Só se ACRESCENTA no fim — o índice já gravado em `m:<dia>` não pode mudar de significado.
 */
export const TIME_KINDS = ['screen', 'feature', 'minigame'];
export const TIME_SCREENS = ['home', 'map', 'area:mercado', 'area:jogos', 'area:arena', 'area:exploracao', 'area:forja', 'area:laboratorio', 'area:hall', 'page:settings', 'page:oracle'];
export const TIME_FEATURES = [
  'mercado.itens', 'mercado.conquistas', 'mercado.decoracao', 'mercado.background', 'forja.ferreiro', 'forja.hexsmith',
  'jogos.salao', 'exploracao.dungeon', 'jogos.mente', 'arena.duelo', 'arena.torneio', 'arena.guerra',
  'exploracao.passeio', 'exploracao.fenda', 'forja.caderno', 'forja.oficina', 'forja.refugio',
  'laboratorio.evolucao', 'laboratorio.pet', 'laboratorio.stats', 'laboratorio.perfil', 'laboratorio.biblioteca', 'laboratorio.amigos',
  'hall.guilda', 'hall.feira', 'hall.grove',
];
export const TIME_MINIGAMES = ['masmorra', 'dino', 'ppt', 'match3', 'barrage', 'eco', 'zip', 'selo', 'respiracao', 'bolhas-calmas', 'chama'];
export const TIME_REGISTRY = [TIME_SCREENS, TIME_FEATURES, TIME_MINIGAMES];

/** Faixa do total (segundos): 0 <5 s · 1 <10 · 2 <20 · 3 <30 · 4 <60 · 5 <2 min · 6 <3 · 7 <5 · 8 <10 · 9 <20 · 10 <40 · 11 40 min+. */
export const TIME_BAND_EDGES = [5, 10, 20, 30, 60, 120, 180, 300, 600, 1200, 2400];
/** Ponto médio de cada faixa, para estimar a soma de segundos (a faixa é tudo o que sai do aparelho). */
export const TIME_BAND_MID = [2, 7, 15, 25, 45, 90, 150, 240, 450, 900, 1800, 3000];
