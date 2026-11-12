import { readLocal } from '../../../utils/safeStorage';

/**
 * Interruptor PRÓPRIO da intro narrativa (docs/PLANO-INTRO-NARRATIVA.md §11.3). É independente do
 * `ONBOARDING_VELADO` (BB, paywall, monetização): ligar um não liga o outro. DESLIGADO por padrão:
 * desligado, o pós-criação segue exatamente o fluxo anterior (tutorial do jogo).
 * Liga com `VITE_INTRO_NARRATIVA=true` no build, pela lista de testers do servidor (`/api/intro-teste`),
 * ou, só em dev, pela chave local `soulmon-intro-narrativa=1`.
 */
export function introNarrativaBuildLigada(): boolean {
  try {
    if (import.meta.env?.VITE_INTRO_NARRATIVA === 'true') return true;
    if (import.meta.env?.DEV) return readLocal('soulmon-intro-narrativa') === '1';
  } catch { /* storage bloqueado: fica desligado */ }
  return false;
}

export const INTRO_NARRATIVA = introNarrativaBuildLigada();

let tester = false;
/** Interruptor por pessoa (`/api/intro-teste`): só `true` liga. */
export function setIntroTester(on: unknown): void { tester = on === true; }
export function isIntroNarrativa(): boolean { return INTRO_NARRATIVA || tester; }

export type PosCriacao = 'intro' | 'tutorial' | 'home';

/**
 * Qual é a tela depois da criação do Soulmon. Uma fonte só de tutorial por vez: a intro e o
 * `GameTutorialFlow` nunca coexistem (a intro, quando termina, marca o tutorial como feito).
 * `ONBOARDING_VELADO` não entra na conta de propósito.
 */
export function posCriacao(o: { introLigada: boolean; introVista: boolean; tutorialFeito: boolean; demo: boolean }): PosCriacao {
  if (o.introLigada && !o.introVista && !o.demo) return 'intro';
  return o.tutorialFeito ? 'home' : 'tutorial';
}
