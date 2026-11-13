import type { AssetKey } from './assets';
import type { Bilingue, FALANTE } from './copy';

export type SlotId = 'tarefa' | 'alimentar' | 'duelo' | 'corda';
export type QuemFala = keyof typeof FALANTE;

export interface Fala { quem: QuemFala; txt: Bilingue }

interface Base {
  /** Narração em texto do que se vê (leitor de tela; também é o que sobra com movimento reduzido). */
  aria: Bilingue;
  fala?: Fala;
}

/** Tela preta; a fala só aparece depois de `falaAposMs` (D-01: preto ≥ 1,2 s). */
export interface QPreto extends Base { tipo: 'preto'; falaAposMs: number }
/** Olho abrindo com desfoque (D-02): revela cenário + ancião; o toque só vale com o olho aberto. */
export interface QOlho extends Base { tipo: 'olho'; fundo: AssetKey; npc: AssetKey }
export interface QCena extends Base {
  tipo: 'cena';
  fundo?: AssetKey;
  /** Primeiro plano (ex.: a borda do despenhadeiro), com parallax próprio. */
  frente?: AssetKey;
  npc?: AssetKey;
  parallax?: boolean;
  efeito?: 'glitch';
  /** Avança sozinha depois deste tempo (cena sem fala). */
  autoMs?: number;
  /** Entra saindo de uma tela branca (D-13). */
  entradaBranco?: boolean;
  /** Mostra o cristal da praça (arte pendente = silhueta nomeada). */
  cristal?: boolean;
}
export interface QTunel extends Base { tipo: 'tunel'; ms: number }
export interface QSlot extends Base { tipo: 'slot'; slot: SlotId }
/** Cena 7: escuro, cristal, luz, branco (rampa ≥ 0,6 s), tudo automático. */
export interface QCristal extends Base { tipo: 'cristal' }
/** Fade final para preto; ao terminar, entrega para a Home. */
export interface QFade extends Base { tipo: 'fade' }

export type Quadro = QPreto | QOlho | QCena | QTunel | QSlot | QCristal | QFade;

/** Quadros que o Pular NÃO pula: as etapas jogáveis. */
export function ehInterativo(q: Quadro): boolean {
  return q.tipo === 'slot';
}

export interface Posicao { cena: number; quadro: number }

/** O que o aparelho guarda (§11.1): onde parou, qual tarefa e se já alimentou. */
export interface Progresso extends Posicao {
  tarefaId?: string;
  alimentou?: boolean;
}
