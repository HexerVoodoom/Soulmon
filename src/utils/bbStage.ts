/**
 * A FORMA BB — o estágio ANTES do rookie (Onboarding Velado, D3/D4/D5;
 * `docs/PLANO-ONBOARDING-VELADO.md` §4). Dono único das regras do BB; o resto
 * do app só pergunta aqui.
 *
 * Regras (todas pelo ID do estágio, `'bb'`, nunca por um segundo número):
 *  · HP máx 6 (`BB_MAX_HP`); NADA o tira: sem requisito diário, sem gauge, sem
 *    perda de coração, sem dreno de cocô/fome, sem folga a gastar
 *    (`computeDailyReset`, `applyHungerPenalty`, `applyPoopDrain`).
 *  · Evolui para rookie quando `bondLevelFor(totalXP) >= 2` (D4) — cerimônia
 *    manual, como hoje (`gaugeFull` abre pela mesma porta).
 *  · Trancado para Torneio, Duelo PvP e Guilda (D5), com recusa MOTIVADA no
 *    padrão de `rebirthRefusal` (`bbRefusal`).
 *
 * Interruptor `ONBOARDING_VELADO` (plano §7), DESLIGADO por padrão. Ele manda
 * em quem CHEGA a ser BB (o onboarding novo cria o save em `'bb'` só quando
 * ligado). As regras acima seguem o ID do estágio de propósito: o interruptor
 * chega do servidor depois do 1º render, e um save que JÁ é BB não pode virar
 * outra coisa (nem perder corações) por causa dessa corrida. Com ele desligado
 * ninguém tem `'bb'` no save, então nada do que existia muda.
 */
import { bondLevelFor } from './bond';
import { bbEvolveGate, BB_EVOLVE_MIN_BOND } from './gates';
import { BB_STAGE, BB_MAX_HP } from '../types/progression';

export { BB_STAGE, BB_MAX_HP };
export { BB_EVOLVE_MIN_BOND };

let onboardingVelado = false;

/** O interruptor `ONBOARDING_VELADO` (desligado por padrão). Quem liga é o servidor (`/api/config`). */
let veladoTester = false;
export function isOnboardingVelado(): boolean { return onboardingVelado || veladoTester; }
/** Interruptor por pessoa (plano §7, `/api/velado-teste`): só `true` liga. */
export function setVeladoTester(on: unknown): void { veladoTester = on === true; }
export function setOnboardingVelado(on: unknown): void { onboardingVelado = on === true; }

/** O estágio inicial de um save NOVO: `'bb'` só com o interruptor ligado. */
export function initialStageForNewSave(): 'bb' | 'rookie' {
  return isOnboardingVelado() ? BB_STAGE : 'rookie';
}

export function isBBStage(stage: unknown): boolean {
  return stage === BB_STAGE;
}

/**
 * Leitura tolerante do id do estágio vindo do save (localStorage/nuvem = dado não confiável).
 * IDEMPOTENTE: `'bb'` e variantes tortas (`'BB'`, `' bb '`, `'bb-power'`) viram `'bb'`;
 * qualquer outro id passa intacto (`getStageLevel` já degrada o desconhecido para rookie).
 */
export function sanitizeStageId(raw: string): string {
  const t = raw.trim().toLowerCase();
  return t === BB_STAGE || t.startsWith(BB_STAGE + '-') ? BB_STAGE : raw;
}

/** O BB já pode evoluir? (`totalXP` ausente = Vínculo 1.) */
export function bbEvolveReady(totalXP: number | undefined): boolean {
  return bbEvolveGate(bondLevelFor(totalXP ?? 0)).open;
}

export type BBFeature = 'torneio' | 'duelo' | 'guilda';
export type BBRefusal = 'bb-locked' | null;

/** Por que o BB não entra: o único motivo é ser BB. Mesmo desenho de `rebirthRefusal` (recusa com motivo, não booleano mudo). */
export function bbRefusal(input: { evolutionStage?: unknown }, _feature?: BBFeature): BBRefusal {
  return isBBStage(input.evolutionStage) ? 'bb-locked' : null;
}

/** Lote de cada prédio trancado ao BB (`<área>.<lote>`, o mesmo id de `BUILDING_GATES`). */
export const BB_LOCKED_BUILDINGS: Readonly<Record<string, BBFeature>> = {
  'arena.torneio': 'torneio',
  'arena.duelo': 'duelo',
  'hall.guilda': 'guilda',
};

export function bbRefusalText(isPt: boolean): string {
  return isPt
    ? 'Seu Velado ainda está pequeno demais para isto. Cresça o Vínculo e deixe-o evoluir.'
    : 'Your Veiled one is still too small for this. Grow your Bond and let it evolve.';
}
