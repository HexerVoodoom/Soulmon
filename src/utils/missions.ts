// 🏅 Missions — permanent achievements that UNLOCK THE PURCHASE of exclusive
// shop items (the mission backgrounds). Locked items show in the shop with a
// padlock; completing the mission makes them buyable. Progress is derived
// from GameState counters.
import { getStageLevel, type EvolutionStage } from '../types/progression';
import type { ShopItem } from './shop';
import type { Feats } from './feats';
// Missão é INTERFACE (aparece na aba da loja), não conteúdo do visor: o ícone
// deixou de ser PNG emoldurado e virou o nome de uma ligature da Material
// Symbols Rounded, desenhada pelo `<Icon>`. Este módulo é de DADOS e não
// importa React — ele carrega só o NOME; quem renderiza é a tela.
// Os seis nomes foram conferidos no inventário de `src/styles/tokens.md`;
// nome fora dele não renderiza glifo nenhum e não dá erro.

export interface MissionState {
  evolutionStage: string;
  unlockedEvolutions: string[];
  /** Total dungeon enemies defeated (lifetime). */
  dungeonKills: number;
  /** Full 5-floor dungeon runs completed (lifetime). */
  dungeonRunsCompleted: number;
  /** Best Obstacle Run score (id `dino` kept). */
  dinoBest: number;
  /** Perfect days earned in total (lifetime — does not reset on evolution).
   *  ⚠️ Só dias completos REAIS desde a decisão #41/#60 (22/09/2026). */
  totalPerfectDays: number;
  /**
   * Dias completos vitalícios PARA A MISSÃO — reais **mais** os 🌀.
   *
   * Decisão do dono #41/#60 (`docs/PERGUNTAS-DO-DONO.md`, 22/09/2026):
   * *"🌀 não conta para conquistas: `totalPerfectDays` só por dia
   * completo real (**segue contando para a missão**)"*. São duas perguntas
   * diferentes — "você cumpriu 30 dias?" (conquista) e "você acumulou 30
   * marcas?" (missão) — e por isso são dois contadores, em vez de um número
   * com dois significados.
   *
   * `?? totalPerfectDays` em quem monta o objeto: save anterior à decisão não
   * tem o campo, e ali o vitalício antigo JÁ incluía os 🌀 — ou seja, a missão
   * nunca anda para trás.
   */
  missionPerfectDays: number;
  /** Feitos vitalícios dos recursos sem contador próprio (`utils/feats.ts`). Ausente = save antigo = tudo zero. */
  feats?: Feats;
}

/**
 * Categoria da conquista — o filtro da folha de Conquistas do Mercado
 * (minimal-ui F5: "Conquistas filtra por categoria em vez de moeda"). Dado da
 * missão, não da tela: acrescentar uma missão sem categoria não compila.
 */
export type MissionCategory = 'evolution' | 'dungeon' | 'games' | 'constancy';

export const MISSION_CATEGORIES: readonly MissionCategory[] = ['evolution', 'dungeon', 'games', 'constancy'];

export interface Mission {
  id: string;
  category: MissionCategory;
  /** Emoji — chave curta para TEXTO. Não é o visual da loja. */
  icon: string;
  /** Ligature da Material Symbols (inventário de `styles/tokens.md`) — é
   *  ISTO que a loja desenha, via `<Icon name={iconName} />`. */
  iconName: string;
  namePt: string;
  nameEn: string;
  descPt: string;
  descEn: string;
  target: number;
  /** Shop item whose PURCHASE this mission unlocks (id into SHOP_ITEMS). Ausente = conquista de RECONHECIMENTO (rodada 6): sem cenário,
   *  sem resgate — fica marcada como feita e pronto (nada a cobrar, nada a "esquecer de pegar"). */
  bgReward?: string;
  progress: (s: MissionState) => number;
}

// Numeric rank per stage level, to check "reached at least X".
const LEVEL_RANK: Record<EvolutionStage, number> = {
  rookie: 0, champion: 1, ultimate: 2, mega: 3, ultra: 4,
};

/** 1 when the pet has EVER reached the given level (current or unlocked form). */
function reachedLevel(s: MissionState, level: EvolutionStage): number {
  const forms = [s.evolutionStage, ...s.unlockedEvolutions];
  return forms.some(f => LEVEL_RANK[getStageLevel(f)] >= LEVEL_RANK[level]) ? 1 : 0;
}

export const MISSIONS: Mission[] = [
  {
    id: 'mission-champion', category: 'evolution', icon: '🥋', iconName: 'military_tech', target: 1, bgReward: 'bg-mission-filecity',
    namePt: 'Primeiro Campeão', nameEn: 'First Champion',
    descPt: 'Evolua até o nível CAMPEÃO', descEn: 'Evolve to CHAMPION level',
    progress: s => reachedLevel(s, 'champion'),
  },
  {
    id: 'mission-mega', category: 'evolution', icon: '👑', iconName: 'emoji_events', target: 1, bgReward: 'bg-mission-infinity',
    namePt: 'Lenda Mega', nameEn: 'Mega Legend',
    descPt: 'Evolua até o nível MEGA', descEn: 'Evolve to MEGA level',
    progress: s => reachedLevel(s, 'mega'),
  },
  {
    id: 'mission-kills-100', category: 'dungeon', icon: '⚔️', iconName: 'swords', target: 100, bgReward: 'bg-mission-coliseum',
    namePt: 'Gladiador', nameEn: 'Gladiator',
    descPt: 'Derrote 100 inimigos na Fenda', descEn: 'Defeat 100 Endless Rift enemies',
    progress: s => s.dungeonKills,
  },
  {
    id: 'mission-runs-3', category: 'dungeon', icon: '🏰', iconName: 'flag', target: 3, bgReward: 'bg-mission-abyss',
    namePt: 'Conquistador do Abismo', nameEn: 'Abyss Conqueror',
    descPt: 'Conclua 3 descidas completas da Fenda', descEn: 'Complete 3 full Endless Rift runs',
    progress: s => s.dungeonRunsCompleted,
  },
  {
    id: 'mission-dino-1000', category: 'games', icon: '🏃', iconName: 'bolt', target: 1000, bgReward: 'bg-mission-dinoland',
    namePt: 'Maratonista Jurássico', nameEn: 'Jurassic Marathoner',
    descPt: 'Faça 1000 de score na Corrida com obstáculos', descEn: 'Score 1000 in the Obstacle Run',
    progress: s => s.dinoBest,
  },
  {
    id: 'mission-perfect-30', category: 'constancy', icon: '⭐', iconName: 'star', target: 30, bgReward: 'bg-mission-aurora',
    namePt: 'Trinta Dias Completos', nameEn: 'Thirty Full Days',
    descPt: 'Acumule 30 dias completos (total)', descEn: 'Earn 30 complete days (lifetime)',
    // #41/#60: a MISSÃO segue contando o 🌀 (decisão literal do dono); quem
    // deixou de contá-lo é `utils/achievements.ts`, que lê `totalPerfectDays`.
    progress: s => s.missionPerfectDays,
  },
  // ── Rodada 6 (L4): conquistas de RECONHECIMENTO dos recursos (sem cenário, sem resgate). Poucas, metas razoáveis, nenhuma premia contagem
  // de tarefas nem cobra: só registram que o recurso foi usado. ─────────────────────────────────────────────────────────────────────
  { id: 'mission-barrage-1000', category: 'games', icon: '🌧️', iconName: 'grain', target: 1000,
    namePt: 'Chuva sob controle', nameEn: 'Barrage Tamer', descPt: 'Faça 1000 de score na Chuva de Almas', descEn: 'Score 1000 in the Soul Barrage',
    progress: s => s.feats?.barrageBest ?? 0 },
  { id: 'mission-zip-10', category: 'games', icon: '🧵', iconName: 'route', target: 10,
    namePt: 'Fio da meada', nameEn: 'Thread Finder', descPt: 'Resolva 10 Trilhas do Pet', descEn: 'Solve 10 Pet Trails',
    progress: s => s.feats?.zipSolved ?? 0 },
  { id: 'mission-patches-10', category: 'games', icon: '🧶', iconName: 'grid_view', target: 10,
    namePt: 'Colcha de retalhos', nameEn: 'Patchwork Maker', descPt: 'Monte 10 Colchas', descEn: 'Piece together 10 Patchworks',
    progress: s => s.feats?.patchesSolved ?? 0 },
  { id: 'mission-dino-normal-500', category: 'games', icon: '⚡', iconName: 'speed', target: 500,
    namePt: 'Corrida no Normal', nameEn: 'Normal Runner', descPt: 'Faça 500 de score na Corrida com obstáculos no Normal', descEn: 'Score 500 in the Obstacle Run on Normal',
    progress: s => s.feats?.dinoNormalBest ?? 0 },
  { id: 'mission-dino-dash-30', category: 'games', icon: '💨', iconName: 'bolt', target: 30,
    namePt: 'Campo de força', nameEn: 'Force Field', descPt: 'Destrua 30 obstáculos com o dash (Normal)', descEn: 'Smash 30 obstacles with the dash (Normal)',
    progress: s => s.feats?.dinoDashSmashed ?? 0 },
  { id: 'mission-ppt-normal-5', category: 'games', icon: '✂️', iconName: 'back_hand', target: 5,
    namePt: 'Mão de mestre', nameEn: 'Steady Hand', descPt: 'Vença 5 partidas de Pedra, papel e tesoura no Normal', descEn: 'Win 5 Rock, paper, scissors matches on Normal',
    progress: s => s.feats?.pptNormalWins ?? 0 },
  { id: 'mission-rogue-floors-3', category: 'dungeon', icon: '🕯️', iconName: 'stairs', target: 3,
    namePt: 'Primeiros andares', nameEn: 'First Floors', descPt: 'Conclua 3 andares do Calabouço', descEn: 'Finish 3 Dungeon floors',
    progress: s => s.feats?.rogueFloors ?? 0 },
  { id: 'mission-rogue-floors-15', category: 'dungeon', icon: '🗝️', iconName: 'vpn_key', target: 15,
    namePt: 'Fundo do Calabouço', nameEn: 'Deep Dungeon', descPt: 'Conclua 15 andares do Calabouço', descEn: 'Finish 15 Dungeon floors',
    progress: s => s.feats?.rogueFloors ?? 0 },
  { id: 'mission-rift-runs-15', category: 'dungeon', icon: '🌀', iconName: 'cyclone', target: 15,
    namePt: 'Habitante da Fenda', nameEn: 'Rift Dweller', descPt: 'Conclua 15 descidas completas da Fenda', descEn: 'Complete 15 full Endless Rift runs',
    progress: s => s.dungeonRunsCompleted },
  { id: 'mission-rift-kills-500', category: 'dungeon', icon: '🛡️', iconName: 'shield', target: 500,
    namePt: 'Guardião da Fenda', nameEn: 'Rift Warden', descPt: 'Derrote 500 inimigos na Fenda', descEn: 'Defeat 500 Endless Rift enemies',
    progress: s => s.dungeonKills },
  { id: 'mission-clan-shop-3', category: 'constancy', icon: '🏪', iconName: 'storefront', target: 3,
    namePt: 'Cliente do clã', nameEn: 'Clan Regular', descPt: 'Compre 3 itens na Loja do Clã', descEn: 'Buy 3 items from the Clan Shop',
    progress: s => s.feats?.clanShopBuys ?? 0 },
  { id: 'mission-regen-1', category: 'constancy', icon: '🎨', iconName: 'brush', target: 1,
    namePt: 'Outro traço', nameEn: 'Another Stroke', descPt: 'Use "Gerar de novo" na aparência do seu Soulmon', descEn: 'Use "Generate again" on your Soulmon’s look',
    progress: s => s.feats?.regens ?? 0 },
  { id: 'mission-focus-prepared-10', category: 'constancy', icon: '🧭', iconName: 'self_improvement', target: 10,
    namePt: 'Espaço preparado', nameEn: 'Space Ready', descPt: 'Prepare o foco 10 vezes (não precisam ser seguidas)', descEn: 'Prepare to focus 10 times (they need not be consecutive)',
    progress: s => s.feats?.focusPrepared ?? 0 },
  { id: 'mission-rank-gold', category: 'constancy', icon: '🏅', iconName: 'leaderboard', target: 4,
    namePt: 'Faixa de ouro', nameEn: 'Gold Band', descPt: 'Alcance a faixa de ouro em qualquer ranking', descEn: 'Reach the gold band in any ranking',
    // `rankTier` guarda índice+1 (madeira 1 … ouro 4 … diamante 6).
    progress: s => s.feats?.rankTier ?? 0 },
];

/** Só as conquistas COM cenário pedem Resgatar; as de reconhecimento já nascem resolvidas. */
export const needsClaim = (m: Mission): boolean => !!m.bgReward;


/** Progress per mission id, clamped to the target. */
export function getMissionProgress(s: MissionState): Record<string, number> {
  return Object.fromEntries(MISSIONS.map(m => [m.id, Math.min(m.target, m.progress(s))]));
}

/** Whether a mission is complete, given a getMissionProgress record. */
export function isMissionComplete(missionId: string, progress: Record<string, number>): boolean {
  const m = MISSIONS.find(x => x.id === missionId);
  return !!m && (progress[missionId] ?? 0) >= m.target;
}

/**
 * Whether a shop item's purchase is unlocked. Locked items still render in
 * the shop (darkened + padlock) with a hint on how to unlock them —
 * mission-gated: unlocked once the mission is complete.
 *
 * `unlock.kind === 'subscription'` (D10): open only while the quarterly cosmetic
 * subscription is active. `subscriptionActive` is a PLAIN BOOLEAN handed in by
 * the caller — this is the vitrine gate, the only place the subscription may be
 * read, and the rule engine never sees the expiry (boundary guard test).
 */
export function isShopItemUnlocked(
  item: ShopItem,
  missionProgress: Record<string, number>,
  subscriptionActive = false,
  claimed?: readonly string[],
): boolean {
  if (!item.unlock) return true;
  if (item.unlock.kind === 'subscription') return subscriptionActive;
  if (!isMissionComplete(item.unlock.missionId, missionProgress)) return false;
  // RESGATE EXPLÍCITO (dono, 14/10/2026, REGISTRO §56): cumprir NÃO basta, a pessoa resgata a conquista no ícone "!" e só então a
  // compra abre — o resgate libera, NUNCA concede o item. `claimed` ausente = save ainda não migrado (a liberação segue automática).
  return claimed === undefined || claimed.includes(item.unlock.missionId);
}

/** Higienização do "resgatado" (load e servidor): só ids de conquistas do catálogo, sem repetição. Ausente/lixo = `undefined`. */
export function sanitizeMissionsClaimed(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const ids = MISSIONS.map(m => m.id);
  return [...new Set(raw.filter((x): x is string => typeof x === 'string' && ids.includes(x)))];
}

/** Os ids que já estão cumpridos agora — a MIGRAÇÃO: save antigo vira "já resgatado" e ninguém perde um item que já estava liberado. */
export function completedMissionIds(missionProgress: Record<string, number>): string[] {
  return MISSIONS.filter(m => needsClaim(m) && isMissionComplete(m.id, missionProgress)).map(m => m.id);
}

/** Há conquista cumprida e ainda não resgatada? (a marca "?" do ícone) */
export function hasUnclaimedMission(missionProgress: Record<string, number>, claimed: readonly string[] | undefined): boolean {
  return claimed !== undefined && MISSIONS.some(m => needsClaim(m) && isMissionComplete(m.id, missionProgress) && !claimed.includes(m.id));
}
