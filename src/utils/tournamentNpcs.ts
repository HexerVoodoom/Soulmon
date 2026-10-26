// ---------------------------------------------------------------------------
// DESAFIANTES NPC DO TORNEIO (R8, 04/10/2026)
//
// Quando a lista de oponentes do Torneio vem VAZIA (poucos jogadores, season nova, ninguém do seu
// nível), a tela não fica em "volte mais tarde": mostra três desafiantes NPC (retrato próprio no cartão; na luta, a criatura de
// `duelo-oponente-*`, rodada 3). É o TREINO com outra roupa — a mesma sombra local de
// `TournamentPage` › `startTraining`, na mesma `DuelScreen`:
//   • NÃO conta partida do dia (não toca `matchesLeft`, não chama o servidor);
//   • NÃO rende Honra, pontos, XP de Vínculo nem missão semanal — o resultado diz "Sem prêmio e sem custo";
//   • roda no ESTÁGIO do jogador (a ficha é a do próprio pet, com o ataque da sombra a 0,85×).
// Nomes FIXOS (nada sorteado por sessão: a mesma pessoa vê os mesmos três). Não são jogadores reais e
// a tela não finge que são — o selo "Treino" fica na linha do cartão.
// ---------------------------------------------------------------------------
import { DUELO_OPONENTE_ART } from './dueloArt';
import type { StarterId } from './sprites';
import { getSpriteForStage } from './sprites';
// 04/10/2026: retratos PRÓPRIOS dos três desafiantes (`entrada-dono/npc-desafiante-*`, GPT Image 2.5 Flare,
// alfa real → 192², alfa binário). Entram só no CARTÃO (64 CSS px = 3× de densidade); na luta o oponente
// continua sendo a CRIATURA do desafiante (`art`, os `duelo-oponente-*`): o retrato é a pessoa, não o bicho.
import portraitEspina from '../assets/soulmon/desafiantes/npc-desafiante-espina.png';
import portraitQuartzo from '../assets/soulmon/desafiantes/npc-desafiante-quartzo.png';
import portraitMare from '../assets/soulmon/desafiantes/npc-desafiante-mare.png';
// 26/10/2026 (URGENTE, dono): SOULMON PRÓPRIO por desafiante, gerado pelo MESMO caminho do app (template do Oráculo → Higgsfield alpha → chroma-key do `_chroma.js`, 256²). Por ora SÓ a forma rookie da Espina existe (créditos do Higgsfield acabaram); as outras formas e os outros dois desafiantes usam o `starter` da demo como reserva até a arte sair.
// ORIENTAÇÃO: a arte olha para a DIREITA (igual a `novos/*`); NÃO entra em `LEFT_FACING_LINES`, então `spriteUrlFacesLeft` = false e o
// `BattleStage` espelha o lado do oponente sozinho — o NPC encara o jogador sem caso especial.
import espinaRookie from '../assets/soulmon/desafiantes/soulmon-espina-rookie.png';

export type NpcTier = 'rookie' | 'champion' | 'ultimate' | 'mega';
/** Arte própria por estágio de cada desafiante. */
export const TOURNAMENT_NPC_ART: Readonly<Record<string, Partial<Record<NpcTier, string>>>> = {
  'npc-espina': { rookie: espinaRookie },
};

export interface TournamentNpc {
  id: string;
  namePt: string;
  nameEn: string;
  /** A criatura do desafiante na luta (PNG 128², de `assets/soulmon/duelo/`). */
  art: string;
  /** O retrato do desafiante no cartão da lista (busto 192², ilustração — sem `pixelated`). */
  portrait: string;
  /** 26/10/2026 (URGENTE, dono): o desafiante É um Soulmon — o MESMO sprite no cartão e na luta (`getSpriteForStage(estágio, starter)`), do elenco da demo, até a arte própria do ChatGPT. `art`/`portrait` ficam só como reserva (as criaturas `duelo-oponente-*` antigas e o busto não aparecem mais). */
  starter: StarterId;
}

/** O sprite do desafiante no estágio do jogador (cartão E luta usam ESTA função → mesmo URL). Estágio desconhecido/ultra → mega; sem arte própria → `starter` (reserva). */
export function tournamentNpcSprite(npc: TournamentNpc, stage: string): string {
  const art = TOURNAMENT_NPC_ART[npc.id];
  if (!art) return getSpriteForStage(stage, npc.starter, 256);
  const key = stage.toLowerCase();
  const pre = key.split('-')[0];
  const lvl = pre === 'rookie' || pre === 'champion' || pre === 'ultimate' || pre === 'mega' ? pre : 'mega';
  const tier: NpcTier = lvl === 'rookie' || lvl === 'champion' || lvl === 'ultimate' ? lvl : 'mega';
  return art[tier] ?? getSpriteForStage(stage, npc.starter, 256);
}

/** Três retratos de elementos diferentes: planta espinhosa, cristal e aquática (índices 0, 3 e 4 da folha). */
export const TOURNAMENT_NPCS: readonly TournamentNpc[] = [
  { id: 'npc-espina', namePt: 'Espina', nameEn: 'Thorn', art: DUELO_OPONENTE_ART[0], portrait: portraitEspina, starter: 'vida' },
  { id: 'npc-quartzo', namePt: 'Quartzo', nameEn: 'Quartz', art: DUELO_OPONENTE_ART[3], portrait: portraitQuartzo, starter: 'industrial' },
  { id: 'npc-mare', namePt: 'Maré', nameEn: 'Tide', art: DUELO_OPONENTE_ART[4], portrait: portraitMare, starter: 'nascente' },
] as const;

/**
 * O desafiante NPC do treino no núcleo v3 (PR5, contexto §2.19; curva achatada em 21/10/2026, QA L04-01): o espelho
 * EQUILIBRADO do MESMO level do jogador, com um handicap pequeno de ataque (`NPC_ATK_HANDICAP`). A faixa de aceite é a
 * vitória do jogador entre 55% e 75% em CADA level amostrado, o 1º de cada estágio incluído (`combate/duel.test.ts`).
 */
export { NPC_LEVEL_GAP, NPC_ATK_HANDICAP, npcCombatant, npcSide } from './combate/duel';
