import type { ComponentType } from 'react';
import type { Language } from '../../../utils/i18n';
import type { AssetKey } from './assets';

export interface Bilingue { en: string; pt: string }
export type SlotId = 'puzzle' | 'tarefa' | 'duelo';

/** Props que TODA frente encaixa num slot. Chame `onDone` quando a etapa terminar. */
export interface SlotProps {
  language: Language;
  onDone: (resultado?: Record<string, unknown>) => void;
}
export type SlotRenderers = Partial<Record<SlotId, ComponentType<SlotProps>>>;

export type Efeito = 'glitch' | 'clarao';

export interface QuadroCena {
  tipo: 'cena';
  /** null/ausente + `preto` = tela preta. */
  fundo?: AssetKey;
  preto?: boolean;
  npc?: AssetKey;
  fala?: Bilingue;
  parallax?: boolean;
  efeito?: Efeito;
  /** Faixa de ambiente pedida ao app (o player só avisa via `onMusica`). */
  musica?: 'suspense' | null;
  /** Transição preta ao ENTRAR neste quadro. */
  transicaoPreta?: boolean;
}
export interface QuadroVideo {
  tipo: 'video';
  video: AssetKey; // mp4 mudo
  fala?: Bilingue;
  efeito?: Efeito;
}
export interface QuadroEscolha {
  tipo: 'escolha';
  fundo?: AssetKey;
  npc?: AssetKey;
  pergunta: Bilingue;
  opcoes: { id: string; rotulo: Bilingue }[];
}
export interface QuadroSlot { tipo: 'slot'; slot: SlotId }

export type Quadro = QuadroCena | QuadroVideo | QuadroEscolha | QuadroSlot;

/** Quadros que o Pular NÃO pula (D12: puzzle, tarefa, duelo e a escolha). */
export function ehInterativo(q: Quadro): boolean {
  return q.tipo === 'slot' || q.tipo === 'escolha';
}
