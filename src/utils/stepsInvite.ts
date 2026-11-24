/**
 * O CONVITE CURTO DA CONTAGEM DE PASSOS (REGISTRO §283, dono, 20/10/2026).
 *
 * "Perguntar de cara se o usuário quer contar passos, sem textão: deixa só contar passos e ativar a missão." Quando: logo depois do
 * onboarding (a Home já está de pé e o convite é um intersticial da fila central, `stepsInvite`, classe CONVITE: só numa abertura sem
 * nada do início de dia). Quem recusa NUNCA é cobrado: `'declined'` é definitivo (insistir depois de um "não" é assédio).
 *
 * Função PURA. O convite só existe quando TUDO isto é verdade:
 *  - o aparelho tem contador (Health Connect ou sensor; PWA/desktop/sem sensor = nunca aparece, sem aviso, sem culpa);
 *  - a pessoa ainda NÃO respondeu (`stepsConsent` ausente: quem já aceitou ou recusou, em qualquer tela, não vê de novo);
 *  - o onboarding terminou (a fila já é inerte durante ele, mas o gate fica explícito aqui também).
 */
export function shouldShowStepsInvite(input: {
  available: boolean | null;
  consent: 'granted' | 'declined' | undefined;
  onboarded: boolean;
}): boolean {
  return input.available === true && input.consent === undefined && input.onboarded;
}

/**
 * O CARTÃO DOS PASSOS EM CONFIGURAÇÕES (menu lateral) — a porta que fica aberta DEPOIS do "Agora não".
 *
 * O convite (acima) é UMA vez só e nunca volta; mas quem recusou tem de poder mudar de ideia por conta própria, sem ninguém
 * insistindo. Por isso o cartão aparece sempre que o aparelho tem contador, inclusive com `stepsConsent === 'declined'`: ele é
 * pedido pela pessoa (abrir Configurações), nunca empurrado. O consentimento continua vindo ANTES do diálogo do sistema.
 */
export function shouldShowStepsSettingsEntry(available: boolean | null): boolean {
  return available === true;
}
