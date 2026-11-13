// ---------------------------------------------------------------------------
// MISSÕES DOS NPCs (pedido do dono, 12/11/2026, REGISTRO §314): cada NPC do jogo passa UMA missão simples, ligada ao papel dele, e
// elas ROTACIONAM POR SEMANA (REGISTRO §318, revisão do dono): a cada semana um conjunto de NPCs (`npcsOfWeek`) fica disponível na
// lista do dia, e só entram NPCs cujo prédio o jogador já abriu. O Trilho (Caderno) é a exceção: missão diária FIXA, fora do rodízio.
//
// Dado puro (sem React, sem imagem): as missões entram no catálogo de `dailyMissions.ts` (mesmo estado `dailyMissions`, mesmo
// `claimDaily`, mesma recompensa de 1 material do prédio do NPC — o padrão das outras diárias). O que o jogo EMITE como evento real
// continua sendo a única fonte da contagem (`bumpDaily`/`bumpDailyIn`); aqui só se diz qual evento e quantos.
//
// `npc` é a CHAVE do NPC: `area:lote` (o mesmo de `LOT_NPC_VOICE`/`LOT_NPC_ART`) ou um NPC de função (`papus`, `nuri`).
// ---------------------------------------------------------------------------

import type { BuildingId } from './gates';
import type { MaterialId } from './buildingQuests';
import type { DailyEvent } from './dailyMissions';

export interface NpcMissionDef {
  /** Estável (save e testes). */
  id: string;
  /** Quem passa a missão: `area:lote` ou `papus`/`nuri`. */
  npc: string;
  event: DailyEvent;
  target: number;
  /** O prédio que a missão abre (portão de Vínculo e destino do "Ir"). */
  building: BuildingId;
  material: MaterialId;
  namePt: string;
  nameEn: string;
  descPt: string;
  descEn: string;
  /** Fora do rodízio: aparece TODO dia (enquanto o prédio estiver aberto). Só o Trilho (Caderno). */
  fixa?: boolean;
}

/**
 * A ORDEM do rodízio: áreas alternadas, para duas semanas seguidas não saírem do mesmo canto do mapa. Cada semana pega `NPCS_POR_SEMANA`
 * NPCs seguidos a partir da vez dela; o ciclo fecha em `rodizio / NPCS_POR_SEMANA` semanas. Quem o Vínculo ainda não abriu é pulado.
 */
export const NPC_MISSIONS: readonly NpcMissionDef[] = [
  { id: 'n-vesca', npc: 'laboratorio:evolucao', event: 'essencia', target: 30, building: 'laboratorio.evolucao', material: 'essence',
    namePt: 'Tubo de essências', nameEn: 'Essence tube', descPt: 'Colete 30 essências elementais', descEn: 'Collect 30 elemental essences' },
  { id: 'n-pipo', npc: 'jogos:salao', event: 'salao', target: 2, building: 'jogos.salao', material: 'spark',
    namePt: 'Rodadas no Salão', nameEn: 'Hall rounds', descPt: 'Jogue 2 partidas no Salão de Jogos', descEn: 'Play 2 games in the Game Hall' },
  { id: 'n-lamela', npc: 'mercado:itens', event: 'compra', target: 1, building: 'mercado.itens', material: 'ribbon',
    namePt: 'Compra do dia', nameEn: 'Buy of the day', descPt: 'Compre 1 item no Mercado', descEn: 'Buy 1 item at the Market' },
  { id: 'n-tessaria', npc: 'arena:duelo', event: 'arena', target: 1, building: 'arena.duelo', material: 'fang',
    namePt: 'Duelo do dia', nameEn: 'Duel of the day', descPt: 'Faça 1 Duelo na Arena', descEn: 'Have 1 Duel in the Arena' },
  { id: 'n-yuzu', npc: 'forja:refugio', event: 'banho', target: 1, building: 'forja.refugio', material: 'moss',
    namePt: 'Banho na fonte', nameEn: 'Spring bath', descPt: 'Dê um banho no seu Soulmon', descEn: 'Give your Soulmon a bath' },
  { id: 'n-vitra', npc: 'forja:ferreiro', event: 'melhoria', target: 1, building: 'forja.ferreiro', material: 'gear',
    namePt: 'Peça aprimorada', nameEn: 'Upgraded piece', descPt: 'Aprimore 1 peça no Soulsmith', descEn: 'Upgrade 1 piece at the Soulsmith' },
  { id: 'n-tessela', npc: 'jogos:mente', event: 'mente', target: 2, building: 'jogos.mente', material: 'prism',
    namePt: 'Enigmas do Ateliê', nameEn: 'Studio puzzles', descPt: 'Jogue 2 rodadas no Ateliê da Mente', descEn: 'Play 2 rounds in the Mind Studio' },
  { id: 'n-zeph', npc: 'exploracao:fenda', event: 'masmorra', target: 3, building: 'exploracao.fenda', material: 'ore',
    namePt: 'Descida na Fenda', nameEn: 'Rift descent', descPt: 'Limpe 3 camadas da Fenda', descEn: 'Clear 3 Endless Rift layers' },
  { id: 'n-aurea', npc: 'hall:guilda', event: 'cla', target: 1, building: 'hall.guilda', material: 'crest',
    namePt: 'Missão do Clã', nameEn: 'Clan errand', descPt: 'Mande o Soulmon numa missão do Clã', descEn: 'Send your Soulmon on a Clan mission' },
  { id: 'n-lume', npc: 'forja:oficina', event: 'foco', target: 1, building: 'forja.oficina', material: 'gear',
    namePt: 'Ciclo de foco', nameEn: 'Focus cycle', descPt: 'Faça 1 ciclo de foco na Oficina', descEn: 'Do 1 focus cycle in the Workshop' },
  { id: 'n-sumi', npc: 'laboratorio:stats', event: 'humor', target: 1, building: 'laboratorio.stats', material: 'cipher',
    namePt: 'Como você está', nameEn: 'How you are', descPt: 'Conte ao seu Soulmon como você está', descEn: 'Tell your Soulmon how you are' },
  { id: 'n-vultrak', npc: 'arena:torneio', event: 'torneio', target: 1, building: 'arena.torneio', material: 'laurel',
    namePt: 'Partida de Torneio', nameEn: 'Tournament match', descPt: 'Dispute 1 partida do Torneio', descEn: 'Play 1 Tournament match' },
  { id: 'n-lasca', npc: 'mercado:decoracao', event: 'compra', target: 2, building: 'mercado.decoracao', material: 'ribbon',
    namePt: 'Duas compras', nameEn: 'Two buys', descPt: 'Compre 2 itens no Mercado', descEn: 'Buy 2 items at the Market' },
  { id: 'n-panora', npc: 'mercado:background', event: 'cenario', target: 1, building: 'mercado.background', material: 'ribbon',
    namePt: 'Horizonte novo', nameEn: 'New horizon', descPt: 'Compre 1 cenário no Mercado', descEn: 'Buy 1 backdrop at the Market' },
  { id: 'n-corva', npc: 'exploracao:dungeon', event: 'calabouco', target: 2, building: 'exploracao.dungeon', material: 'ore',
    namePt: 'Andares do Calabouço', nameEn: 'Dungeon floors', descPt: 'Conclua 2 andares do Calabouço', descEn: 'Finish 2 Dungeon floors' },
  { id: 'n-tinta', npc: 'laboratorio:pet', event: 'carinho', target: 1, building: 'laboratorio.pet', material: 'down',
    namePt: 'Carinho do dia', nameEn: 'Pet of the day', descPt: 'Faça carinho no seu Soulmon', descEn: 'Pet your Soulmon' },
  { id: 'n-snapjaw', npc: 'mercado:restaurante', event: 'prato', target: 1, building: 'mercado.itens', material: 'ribbon',
    namePt: 'Prato do dia', nameEn: 'Dish of the day', descPt: 'Peça 1 prato no Restaurante', descEn: 'Order 1 dish at the Restaurant' },
  { id: 'n-zumi', npc: 'laboratorio:amigos', event: 'presente', target: 2, building: 'laboratorio.amigos', material: 'keepsake',
    namePt: 'Dois presentes', nameEn: 'Two gifts', descPt: 'Envie 2 presentes a amigos', descEn: 'Send 2 gifts to friends' },
  { id: 'n-hexsmith', npc: 'forja:hexsmith', event: 'hex', target: 1, building: 'forja.hexsmith', material: 'gear',
    namePt: 'Forja de HEX', nameEn: 'HEX forging', descPt: 'Forje 1 HEX na Hexsmith', descEn: 'Forge 1 HEX at the Hexsmith' },
  { id: 'n-fanfare', npc: 'hall:feira', event: 'feira', target: 1, building: 'hall.feira', material: 'ribbon',
    namePt: 'Oferta da Feira', nameEn: 'Fair offer', descPt: 'Compre 1 oferta da Feira', descEn: 'Buy 1 offer at the Fair' },
  { id: 'n-lisel', npc: 'exploracao:passeio', event: 'passeio', target: 1, building: 'exploracao.passeio', material: 'pebble',
    namePt: 'Passeio do dia', nameEn: 'Stroll of the day', descPt: 'Conclua 1 passeio', descEn: 'Finish 1 stroll' },
  { id: 'n-medra', npc: 'mercado:conquistas', event: 'conquista', target: 1, building: 'mercado.conquistas', material: 'ribbon',
    namePt: 'Conquista no bolso', nameEn: 'Feat in hand', descPt: 'Resgate 1 conquista', descEn: 'Claim 1 achievement' },
  { id: 'n-trilho', npc: 'forja:caderno', event: 'journal', target: 1, building: 'forja.caderno', material: 'ink', fixa: true,
    namePt: 'Registro do dia', nameEn: 'Entry of the day', descPt: 'Faça 1 registro no Caderno', descEn: 'Write 1 entry in the Notebook' },
  { id: 'n-papus', npc: 'papus', event: 'presente', target: 1, building: 'laboratorio.amigos', material: 'keepsake',
    namePt: 'Entrega do Papus', nameEn: 'Papus delivery', descPt: 'Envie 1 presente a um amigo', descEn: 'Send 1 gift to a friend' },
  { id: 'n-nuri', npc: 'nuri', event: 'comida', target: 1, building: 'forja.refugio', material: 'moss',
    namePt: 'Lanchinho', nameEn: 'Snack time', descPt: 'Dê uma comidinha ao seu Soulmon', descEn: 'Give your Soulmon a snack' },
];

/** O rodízio semanal: as missões de NPC fora a fixa do Trilho. */
export const NPC_MISSIONS_RODIZIO: readonly NpcMissionDef[] = NPC_MISSIONS.filter(m => !m.fixa);
/** Quantos NPCs entram por semana no rodízio (REGISTRO §318). */
export const NPCS_POR_SEMANA = 2;

/** Os ids das missões de NPC (o catálogo de `dailyMissions` os trata à parte: nunca entram no sorteio comum). */
export const NPC_MISSION_IDS: readonly string[] = NPC_MISSIONS.map(m => m.id);

/** NPCs que HOJE não passam missão (sem ação real do jogo para contar) — documentado e travado por teste, para a lacuna não ser silenciosa. */
export const NPCS_SEM_MISSAO: Readonly<Record<string, string>> = {
  'laboratorio:biblioteca': 'Glifa: a Biblioteca só LÊ (sem ação que conte)',
  'arena:guerra': 'Mirevesper: a Guerra de Clãs rende na casa do clã, sem evento diário',
  'hall:grove': 'Ramo: o Grove é do clã, sem evento diário',
  'laboratorio:perfil': 'Corvo do Perfil: leitura da ficha, sem ação',
  'mercado:cambista': 'Farthing: o Cambista não passa missão (dono, 12/11/2026: a troca no bazar foi excluída)',
};
