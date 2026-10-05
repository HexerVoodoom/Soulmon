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
// 04/10/2026: retratos PRÓPRIOS dos três desafiantes (`entrada-dono/npc-desafiante-*`, GPT Image 2.5 Flare,
// alfa real → 192², alfa binário). Entram só no CARTÃO (64 CSS px = 3× de densidade); na luta o oponente
// continua sendo a CRIATURA do desafiante (`art`, os `duelo-oponente-*`): o retrato é a pessoa, não o bicho.
import portraitEspina from '../assets/soulmon/desafiantes/npc-desafiante-espina.png';
import portraitQuartzo from '../assets/soulmon/desafiantes/npc-desafiante-quartzo.png';
import portraitMare from '../assets/soulmon/desafiantes/npc-desafiante-mare.png';

export interface TournamentNpc {
  id: string;
  namePt: string;
  nameEn: string;
  /** A criatura do desafiante na luta (PNG 128², de `assets/soulmon/duelo/`). */
  art: string;
  /** O retrato do desafiante no cartão da lista (busto 192², ilustração — sem `pixelated`). */
  portrait: string;
}

/** Três retratos de elementos diferentes: planta espinhosa, cristal e aquática (índices 0, 3 e 4 da folha). */
export const TOURNAMENT_NPCS: readonly TournamentNpc[] = [
  { id: 'npc-espina', namePt: 'Espina', nameEn: 'Thorn', art: DUELO_OPONENTE_ART[0], portrait: portraitEspina },
  { id: 'npc-quartzo', namePt: 'Quartzo', nameEn: 'Quartz', art: DUELO_OPONENTE_ART[3], portrait: portraitQuartzo },
  { id: 'npc-mare', namePt: 'Maré', nameEn: 'Tide', art: DUELO_OPONENTE_ART[4], portrait: portraitMare },
] as const;

/** A ficha do desafiante a partir da do jogador: o mesmo estágio, ataque a 0,85× (treino para aprender a torcer). */
export function npcAtk(atk: number): number {
  return Math.round(atk * 0.85 * 10) / 10;
}
