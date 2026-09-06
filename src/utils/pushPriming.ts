// ---------------------------------------------------------------------------
// O SEGUNDO convite de notificação (WP1.5) — e por que existe um segundo.
//
// O primeiro convite já está certo: ele só aparece depois da PRIMEIRA
// conclusão real (`WelcomePromptModal`), que é permission priming contextual
// feito como manda o manual — nada de pedir permissão na tela de abertura,
// antes de a pessoa ter motivo para dizer sim.
//
// O que faltava era o SEGUNDO. Quem dispensou no dia 1 nunca mais era
// convidado, e no dia 1 ninguém ainda sabe se esse app vai importar. No D2–D3
// a pessoa já tem criatura, já concluiu coisas, e a pergunta ("posso te
// lembrar de mim amanhã?") passa a fazer sentido — é a mesma pergunta em outro
// momento, e o momento é a diferença inteira.
//
// Quatro travas, todas testadas:
//  · **nunca no D0/D1.** Cedo demais é a razão pela qual o primeiro pedido foi
//    recusado; repetir cedo é insistir, não convidar.
//  · **UMA vez só.** Dispensou o segundo, acabou. Não existe terceiro.
//  · **nunca em cima de quem voltou de uma ausência** — quem some e volta
//    encontra saudade, não um pedido de permissão.
//  · **nunca para quem já ligou.**
//
// Este módulo é PURO: `now`, a data do dispensa e o estado entram por
// parâmetro. Quem chama guarda a decisão.
// ---------------------------------------------------------------------------

/** Não antes do dia 2 de vida da criatura. */
export const PRIMING_MIN_DAYS = 2;
/** Nem depois do 3: passou disso, o momento já foi e insistir vira ruído. */
export const PRIMING_MAX_DAYS = 3;
/** E nunca menos de um dia depois de a pessoa ter dito "agora não". */
export const PRIMING_MIN_HOURS_AFTER_DISMISS = 24;

export interface PushPrimingInput {
  /** Dias desde o nascimento da criatura (`daysTogether`). `null` = sem
   *  `bornAt` no save, e aí NÃO se convida: sem idade não há momento certo. */
  daysWithPet: number | null;
  notificationsEnabled: boolean;
  /** A pessoa já dispensou o PRIMEIRO convite? (epoch ms, ou `null`.) */
  firstDismissedAt: number | null;
  /** A pessoa já dispensou ESTE convite? Se sim, não existe terceiro. */
  secondDismissed: boolean;
  /** Voltou de uma ausência nesta virada? Quem volta encontra saudade. */
  returningFromAbsence: boolean;
  now: number;
}

export function shouldPrimePush(input: PushPrimingInput): boolean {
  if (input.notificationsEnabled) return false;
  if (input.secondDismissed) return false;
  if (input.returningFromAbsence) return false;
  if (input.daysWithPet === null) return false;
  if (input.daysWithPet < PRIMING_MIN_DAYS || input.daysWithPet > PRIMING_MAX_DAYS) return false;
  // Sem o primeiro dispensa registrado não há segundo convite: este módulo é
  // o SEGUNDO pedido, e um segundo sem primeiro seria só um pedido cedo.
  if (input.firstDismissedAt === null) return false;
  const horas = (input.now - input.firstDismissedAt) / 3_600_000;
  return horas >= PRIMING_MIN_HOURS_AFTER_DISMISS;
}

/**
 * A frase. É do PET, na primeira pessoa, e pergunta — não anuncia benefício.
 * "Ative as notificações para não perder seu progresso" é o app falando de si;
 * "posso te lembrar de mim amanhã?" é a criatura pedindo, que é a única voz
 * que este produto tem para pedir alguma coisa.
 */
export function pushPrimingLine(isPt: boolean): string {
  return isPt
    ? 'Posso te lembrar de mim amanhã?'
    : 'Can I remind you about me tomorrow?';
}
