/**
 * A LINHA DE APOIO — dono ÚNICO dos números e do link de ajuda que o app mostra
 * (30/09/2026, parecer do `soulmon-behavioral-psychologist` sobre o Refúgio).
 *
 * Antes, o `ChatBox` e o Refúgio escreviam cada um a sua cópia do CVV. Um
 * número errado numa tela de crise pune justamente quem pediu ajuda, e duas
 * cópias divergem em silêncio (footgun 9). Nenhum número sai de modelo de IA:
 * sai DAQUI, e o teste trava os valores.
 *
 * O que NÃO mora aqui: a frase de crise do chat (`crisisLineText`, em
 * `chatSafety.ts`), que é resposta a uma mensagem, não aviso de tela.
 */

/** Diretório internacional de linhas de apoio — cobre quem não está nos países abaixo. */
export const HELPLINE_DIRECTORY_URL = 'https://findahelpline.com';

/** Rótulo do link do diretório. */
export function helplineDirectoryLabel(isPt: boolean): string {
  return isPt ? 'Encontrar uma linha de apoio' : 'Find a helpline';
}

/** Os números fixos, por idioma (PT = Brasil; EN = EUA/Canadá e Reino Unido/Irlanda). */
export function helplineNumbers(isPt: boolean): string {
  return isPt ? 'No Brasil: CVV, 188 (24h, gratuito).' : 'US/Canada: 988. UK/IE: 116 123.';
}

/** O `tel:` do atalho "Preciso de ajuda agora" (só existe para o número BR). */
export const HELPLINE_TEL_BR = 'tel:188';

/** A frase-base do aviso do Refúgio. */
export function notProfessionalHelp(isPt: boolean): string {
  return isPt ? 'Isto não substitui ajuda profissional.' : 'This does not replace professional help.';
}
