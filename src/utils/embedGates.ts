/**
 * OS PORTÕES DE ABERTURA NO EMBED (13/11/2026, pedido do dono): a demo do portfólio
 * (`/embed`, ver `embedMode.ts`) vai DIRETO para a demo — sem o vídeo de marca
 * (`IntroScreen`), sem a cinemática da 1ª abertura (`IntroCinematica`) e sem o termo de
 * consentimento (`ConsentGate`). Fora do embed as três decisões são as de sempre.
 *
 * Pular o termo NÃO grava consentimento nenhum: a condição do dono foi que nada saia do
 * aparelho no embed, e isso é garantido à parte (`installEmbedNetworkGuard` e o guard duro
 * em `isTelemetryEnabled`). Funções puras com o `embed` por parâmetro, para o teste
 * cobrir os dois modos sem mexer em `window.location`.
 */
import { isConsentCurrent, type ConsentRecord } from './consent';
import { deveTocarIntro } from '../components/onboarding/intro/introGate';
import { isEmbedMode } from './embedMode';

/** O vídeo de marca (`IntroScreen`) abre? Sempre, menos no embed. */
export function mostraVideoDeMarca(embed: boolean = isEmbedMode()): boolean {
  return !embed;
}

/** A cinemática da 1ª abertura toca sozinha? A regra de `deveTocarIntro`, menos no embed. */
export function tocaCinematicaInicial(onboardingCompleto: boolean, embed: boolean = isEmbedMode()): boolean {
  return !embed && deveTocarIntro(onboardingCompleto);
}

/** O termo de consentimento (`ConsentGate`) bloqueia? Sem registro vigente, menos no embed. */
export function exigeTermo(consent: ConsentRecord | null | undefined, embed: boolean = isEmbedMode()): boolean {
  return !embed && !isConsentCurrent(consent);
}
