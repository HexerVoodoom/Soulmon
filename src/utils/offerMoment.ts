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
//  · **e o `×` é para sempre.** Ver `dismissed`.
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
  /** O jogador fechou o card no `×` (`offerDismissed` no save). Terminal. */
  dismissed?: boolean;
  /** Semana ISO de hoje. */
  currentWeek: string;
}

export function shouldOfferAtValueMoment(input: OfferMomentInput): boolean {
  if (input.tier !== 'demo') return false;
  /* O `×` é TERMINAL, e essa é a quinta trava. Um "não" que o app pergunta de
     novo na semana seguinte não era um não — era um adiamento imposto. O card
     permanente da Loja continua existindo depois disto, e é a diferença entre
     as duas portas: aquela a pessoa ABRE, esta aparece sozinha. */
  if (input.dismissed) return false;
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
  const t = parseDayKey(dayKey);
  if (t === null) return null;
  const d = new Date(t);
  const dayNum = (d.getUTCDay() + 6) % 7; // segunda = 0
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const isoYear = d.getUTCFullYear();
  const ft = new Date(Date.UTC(isoYear, 0, 4));
  ft.setUTCDate(ft.getUTCDate() - ((ft.getUTCDay() + 6) % 7) + 3);
  const week = 1 + Math.round((d.getTime() - ft.getTime()) / (7 * 86400000));
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

/**
 * Os DOIS formatos de dia que circulam no app, lidos como UTC.
 *
 * ⚠️ Este parse existe por causa de um defeito encontrado em 06/09/2026, e ele
 * era **silencioso e total**: `isoWeekKey` só aceitava `YYYY-MM-DD`, mas os
 * dois chamadores do `App.tsx` passam `playerDayKey(...)`, que devolve
 * `"Mon Sep 07 2026"`. `Date.parse("Mon Sep 07 2026T00:00:00Z")` é `NaN`, a
 * função devolvia `null`, e o `shouldOfferAtValueMoment` saía por
 * `if (!semana) return false` — ou seja, **a oferta do primeiro dia perfeito
 * nunca apareceu para ninguém**, e o `offerShownWeek` nunca foi gravado.
 *
 * Nada ficava vermelho: os testes do módulo passam `YYYY-MM-DD`, que é o
 * formato que a função sempre soube ler. O defeito morava na JUNÇÃO entre dois
 * módulos corretos — que é onde teste de unidade não olha.
 *
 * Aceitar os dois é melhor que converter no chamador: chamador que converte é
 * a regra de novo espalhada, e o próximo a chamar erraria igual.
 */
function parseDayKey(dayKey: string): number | null {
  if (typeof dayKey !== 'string' || !dayKey) return null;
  // `YYYY-MM-DD` — o formato canônico, ancorado em UTC de propósito.
  const iso = Date.parse(`${dayKey}T00:00:00Z`);
  if (Number.isFinite(iso)) return iso;
  // `Www Mmm DD YYYY` — o que `playerDayKey` devolve (é o formato do
  // `Date.prototype.toDateString`, que ele imita para o dia do jogador).
  const nativo = Date.parse(`${dayKey} UTC`);
  return Number.isFinite(nativo) ? nativo : null;
}
