// ---------------------------------------------------------------------------
// WP5.1 — QUANDO A OFERTA PODE APARECER.
//
// O convite de compra (`UnlockNudge`) existia em dois lugares e nenhum deles é
// o momento em que o produto prova o que vende. O *value moment* deste app não
// é o reveal (ali a pessoa ainda não sabe se isso vai servir para alguma
// coisa): é o **primeiro dia perfeito** — o dia em que ela cumpriu o que
// combinou consigo mesma e viu a criatura responder.
//
// Este módulo é a REGRA de quando oferecer, separada da tela, porque é uma
// regra de ética de produto e não de layout. Quatro travas:
//  · **nunca no D0.** Oferecer no primeiro dia é vender antes de entregar.
//  · **nunca em cima de quem voltou de uma ausência** (`welcomeBack`). Quem
//    some e volta encontra saudade, não uma vitrine.
//  · **no máximo uma vez por SEMANA.** Um convite repetido deixa de ser
//    convite; e a semana é a mesma unidade da métrica-norte.
//  · **só para quem ainda não comprou.** Óbvio, e mesmo assim é a trava que
//    mais quebra em refatoração.
// ---------------------------------------------------------------------------

export interface OfferMomentInput {
  /** 'demo' = ainda não comprou. Só ele recebe convite. */
  tier?: 'demo' | 'paid';
  /** O relatório do dia que acabou de ser mostrado. */
  wasPerfect: boolean;
  welcomeBack: boolean;
  /** Dias desde o nascimento da criatura (`daysTogether`). `null` = sem save. */
  daysWithPet: number | null;
  /** Semana ISO da última oferta mostrada (`offerShownWeek` no save). */
  lastShownWeek?: string | null;
  /** Semana ISO de hoje. */
  currentWeek: string;
}

export function shouldOfferAtValueMoment(input: OfferMomentInput): boolean {
  if (input.tier !== 'demo') return false;
  if (!input.wasPerfect) return false;
  // Quem volta de uma ausência encontra saudade, não vitrine — é a mesma
  // regra do perdão por ausência, aplicada à oferta.
  if (input.welcomeBack) return false;
  // Sem idade conhecida não há como saber se é o D0: na dúvida, não oferece.
  if (input.daysWithPet === null || input.daysWithPet < 1) return false;
  if (input.lastShownWeek && input.lastShownWeek === input.currentWeek) return false;
  return true;
}

/**
 * Semana ISO de um `dayKey` (`YYYY-MM-DD`), no formato `YYYY-Www`.
 *
 * A mesma partição de `telemetry.ts`: semana ISO começa na segunda e a virada
 * de ano cai na semana certa. Reusar a definição importa porque a métrica-norte
 * é semanal — se a oferta contasse a semana de outro jeito, "uma vez por
 * semana" mediria uma semana diferente da que o produto lê.
 */
export function isoWeekKey(dayKey: string): string | null {
  const t = Date.parse(`${dayKey}T00:00:00Z`);
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  const dayNum = (d.getUTCDay() + 6) % 7; // segunda = 0
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const isoYear = d.getUTCFullYear();
  const ft = new Date(Date.UTC(isoYear, 0, 4));
  ft.setUTCDate(ft.getUTCDate() - ((ft.getUTCDay() + 6) % 7) + 3);
  const week = 1 + Math.round((d.getTime() - ft.getTime()) / (7 * 86400000));
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}
