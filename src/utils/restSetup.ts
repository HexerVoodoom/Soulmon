/**
 * O HORÁRIO DE DORMIR É OBRIGATÓRIO (D-24, dono, 18/10/2026).
 *
 * Antes (G8, 01/10/2026) o convite do sono era opcional e esperava o 2º dia de
 * uso. Agora o intersticial `restSetup` está pronto SEMPRE que a pessoa ainda
 * não confirmou o horário (`rest.windowConfirmed !== true`) — jogador novo
 * (logo depois do tour) e save antigo — e só fecha confirmando.
 *
 * Por que obrigatório: sem horário escolhido, o lembrete, o sono automático, a
 * noite e o pesadelo da manhã rodam em cima de um padrão que a pessoa nunca viu.
 *
 * Função PURA.
 */
export function shouldShowRestSetup({ confirmed }: { confirmed: boolean | undefined }): boolean {
  return confirmed !== true;
}

/** "Manhã" para efeito de texto (o convite aparece de qualquer jeito). */
export const REST_SETUP_MORNING_END_HOUR = 12;

/** É manhã? Só muda o "bom dia" do texto, nunca se o convite aparece. */
export function isMorning(now: Date): boolean {
  return now.getHours() < REST_SETUP_MORNING_END_HOUR;
}
