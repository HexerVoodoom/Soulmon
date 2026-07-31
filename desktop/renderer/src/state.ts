// Estado local do overlay. Fica num namespace PRÓPRIO do desktop
// (`soulmon_desktop_v1`) de propósito: enquanto a escrita de volta não existir
// (fase 2b do docs/PLANO-DESKTOP-STEAM.md), as ações feitas aqui NÃO podem
// tocar no save real — uma mutação incompatível com as regras do jogo
// corromperia o progresso do celular sem chance de desfazer.
//
// A partir da sincronização, os campos vindos da nuvem (pet/hearts/energia/…)
// são um CACHE de leitura; os campos de ação local ficam claramente separados.
import { STORAGE_KEY } from './config';
import type { GenericLine } from './sprites';

export interface DesktopTask {
  id: string;
  name: string;
  completed: boolean;
  createdAt: string;
}

export interface DesktopState {
  // --- espelho do save real (preenchido pela sincronização) ---
  /** Id da forma na árvore do jogador ('rookie' | 'champion-virus' | 'ultra' …). */
  stage: string;
  /** Nome de exibição da forma atual, vindo do oráculo. */
  stageName: string;
  /** Linha de sprite genérico (`eggType` do save). */
  genericLine: GenericLine;
  /** Personagem pronto da conta demo, se houver. */
  demoCharacterId?: string;
  hearts: number;
  maxHearts: number;
  energy: number;
  maxEnergy: number;
  /** Comida no bolso: soma do `foodInventory` do save. */
  food: number;

  // --- só do desktop ---
  language: 'pt-BR' | 'en';
  tasks: DesktopTask[];
  sleeping: boolean;
  /** Timestamps (ms) das últimas comidas — janela deslizante de 5/hora, igual ao mobile. */
  feedTimes: number[];
  /** Dia (YYYY-MM-DD) em que o carinho já curou — máx. 1×/dia, igual ao mobile. */
  rubHealDay: string | null;
  /** E-mail usado pro cloud save (mesmo do app mobile/web) — null = nunca configurado. */
  syncEmail: string | null;
  /** ISO da última vez que puxamos o GameState real da nuvem. */
  lastSyncAt: string | null;
}

// Regras espelhadas do mobile (CLAUDE.md): 5 comidas/hora, carinho cura 1×/dia.
export const FOOD_LIMIT_PER_HOUR = 5;
const HOUR = 60 * 60 * 1000;

function defaults(): DesktopState {
  return {
    stage: 'rookie',
    stageName: 'Soulmon',
    genericLine: 'tapirmon',
    demoCharacterId: undefined,
    hearts: 3,
    maxHearts: 3,
    energy: 0,
    maxEnergy: 4,
    food: 0,
    language: 'pt-BR',
    tasks: [],
    sleeping: false,
    feedTimes: [],
    rubHealDay: null,
    syncEmail: null,
    lastSyncAt: null,
  };
}

export function loadState(): DesktopState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as Partial<DesktopState>;
    // Campos novos entram com fallback (mesma convenção do cloud save do app).
    return { ...defaults(), ...parsed };
  } catch {
    return defaults();
  }
}

export function saveState(state: DesktopState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Sem espaço/modo privado: segue só em memória.
  }
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Quantas comidas ainda cabem na janela de 1h. */
export function feedsLeft(state: DesktopState, now = Date.now()): number {
  state.feedTimes = state.feedTimes.filter(t => now - t < HOUR);
  return Math.max(0, FOOD_LIMIT_PER_HOUR - state.feedTimes.length);
}

export function newTaskId(): string {
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
