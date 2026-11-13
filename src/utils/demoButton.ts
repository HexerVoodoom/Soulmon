/**
 * Interruptor ÚNICO do botão DEMO do portão (12/11/2026, pedido do dono).
 *
 * `false` = o botão "DEMO — experimentar sem conta" NÃO aparece na tela de
 * abertura. É só a PORTA: a lógica da demo (`demoMode.ts`, `demoStart.ts`,
 * `handleStartDemo`) fica intacta, e quem já está numa demo local
 * continua jogando, com o selo DEMO e o botão de sair. O modo embed
 * (`isEmbedMode`, portfólio) abre a escolha dos iniciais direto e não depende
 * deste interruptor. Para religar: trocar para `true`.
 */
export const DEMO_BUTTON_ENABLED = false;
