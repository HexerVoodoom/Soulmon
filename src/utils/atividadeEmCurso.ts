/**
 * "O jogador está no meio de uma atividade?" (12/11/2026, pedido do dono) — dono único do gate OCIOSO.
 *
 * Quem quer interromper com uma conversa (a oferta da Vesca, e o que vier depois) NÃO decide sozinho se pode: pergunta aqui. Uma
 * atividade em curso é: (1) estar numa área de ATIVIDADE do Mapa (Arena, Jogos/minigames, Exploração: Calabouço, Fenda, Passeio,
 * combates); (2) o Soulmon estar na Masmorra; (3) um timer de foco rodando ou pausado (a sessão ainda não acabou); (4) qualquer
 * modal/folha aberto (inclui o início de dia e as celebrações da fila de apresentação). Home, Mapa e as áreas que não são atividade
 * (Mercado, Forja, Laboratório, Salão) são ociosas.
 *
 * Módulo PURO. A leitura reativa dos sinais vive em `hooks/useOcioso.ts`.
 */
import type { AreaId, ViewType } from '../navigation';
import type { FocoTimer } from './focoTimer';

/** As áreas onde o jogador JOGA algo que não se interrompe com uma pergunta. */
export const ATIVIDADE_AREAS: readonly AreaId[] = ['arena', 'jogos', 'exploracao'];

export type MotivoAtividade = 'area' | 'masmorra' | 'foco' | 'modal';

export interface SinaisAtividade {
  view: ViewType | string;
  naMasmorra: boolean;
  /** O timer de foco guardado no aparelho (ou `null`). */
  foco: Pick<FocoTimer, 'status'> | null;
  /** Quantos modais há abertos agora (`useModalDepth`). */
  modais: number;
}

/** Foco em andamento = rodando ou pausado; `ended` já acabou. */
export const focoEmAndamento = (t: Pick<FocoTimer, 'status'> | null | undefined): boolean => t?.status === 'running' || t?.status === 'paused';

/** O motivo pelo qual o jogador está ocupado, ou `null` se está ocioso. */
export function atividadeEmCurso(s: SinaisAtividade): MotivoAtividade | null {
  const v = String(s.view);
  if (v.startsWith('area:') && (ATIVIDADE_AREAS as readonly string[]).includes(v.slice(5))) return 'area';
  if (s.naMasmorra) return 'masmorra';
  if (focoEmAndamento(s.foco)) return 'foco';
  if (s.modais > 0) return 'modal';
  return null;
}

export const estaOcioso = (s: SinaisAtividade): boolean => atividadeEmCurso(s) === null;
