import { recentFeeds, rubHealRecordFor, type RubHealRecord } from './careRules';

/**
 * Onde os TETOS DE CUIDADO moram.
 *
 * As regras em si continuam em `utils/careRules.ts` — este arquivo não decide
 * nada sobre elas, e não pode. O que muda aqui é a PROCEDÊNCIA do estado que
 * elas recebem por parâmetro.
 *
 * Por que existe (D-33): os dois contadores de teto — `FOOD_FEED_TIMES` e
 * `RUB_HEAL_DAY` — moravam só no `localStorage` do aparelho. Como o mesmo
 * jogador usa PWA e APK ao mesmo tempo (é o cenário real do dono hoje), cada
 * aparelho tinha o próprio contador: **2 corações/dia e 12 comidas/hora** em vez
 * de 1 e 6. O teto existe como regra de CUIDADO, e um teto que se fura trocando
 * de aparelho não é detalhe cosmético — é a regra do produto se desfazendo.
 *
 * ⚠️ Mover para o save fecha o furo **enquanto os dois aparelhos estiverem no
 * MESMO save**. Ele não fecha o caso de dois aparelhos escrevendo o save em
 * paralelo — isso depende de save na nuvem confiável (fatia 1). Ver o artefato
 * `squad-alpha-runs/soulmon-02/builder/tetos-cuidado-no-save.md`.
 */
export interface CareCaps {
  /** Timestamps (ms) das comidas comuns — janela deslizante de 1h. */
  feedTimes?: number[];
  /** Cura por carinho já concedida no dia civil. */
  rubHeal?: RubHealRecord;
}

/** O que morava no `localStorage` antes desta migração. */
export interface LegacyCareCaps {
  feedTimes?: unknown;
  rubHeal?: unknown;
}

/** Aceita só número finito; qualquer outra coisa some (um `NaN` na janela
 *  passaria pelo filtro de 1h para sempre e travaria a comida do jogador). */
function sanitizeFeedTimes(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  return v.filter((t): t is number => typeof t === 'number' && Number.isFinite(t));
}

function sanitizeRubHeal(v: unknown): RubHealRecord | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const e = v as Record<string, unknown>;
  if (typeof e.date !== 'string') return undefined;
  const healed = typeof e.healed === 'number' && Number.isFinite(e.healed) ? e.healed : 0;
  return { date: e.date, healed: Math.max(0, healed) };
}

/** Higieniza o que veio do save (local ou nuvem) — nunca lança. */
export function hydrateCareCaps(v: unknown): CareCaps {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const e = v as Record<string, unknown>;
  const feedTimes = sanitizeFeedTimes(e.feedTimes);
  const rubHeal = sanitizeRubHeal(e.rubHeal);
  const out: CareCaps = {};
  if (feedTimes.length) out.feedTimes = feedTimes;
  if (rubHeal) out.rubHeal = rubHeal;
  return out;
}

/**
 * Funde o teto que está no SAVE com o que sobrou no `localStorage` deste
 * aparelho. Roda no load, uma vez por save carregado.
 *
 * **É IDEMPOTENTE de propósito**, e isso é o que torna a migração segura: ela
 * roda no save local E de novo quando o save da nuvem é adotado, e rodar duas
 * vezes dá exatamente o mesmo resultado que rodar uma. Sem isso, apagar as
 * chaves antigas viraria um ponto de não retorno no meio da inicialização.
 *
 * Os dois campos usam operadores diferentes, e a razão não é estética:
 *
 * - `feedTimes` é uma lista de EVENTOS identificáveis (o próprio instante da
 *   comida). União com deduplicação é a leitura honesta: um instante já gasto
 *   continua gasto, e o mesmo instante presente nos dois lados conta uma vez.
 * - `rubHeal` é um CONTADOR opaco — não há identidade de evento para deduplicar.
 *   Somar os dois lados cobraria duas vezes o mesmo carinho no dia da migração
 *   (perda de cuidado); ignorar o legado devolveria carinho já gasto (ganho).
 *   `max` é o único operador que não faz nem uma coisa nem outra. Registro de
 *   dia diferente de hoje é descartado pela regra pura (`rubHealRecordFor`), e
 *   não aqui.
 *
 * Nada é PODADO na migração: a poda da janela de 1h é da regra
 * (`recentFeeds`), e duplicá-la aqui criaria a 7ª cópia de regra do projeto.
 * A única exceção é o descarte de duplicatas exatas, que é da fusão, não da regra.
 */
export function mergeCareCaps(fromSave: unknown, legacy: LegacyCareCaps): CareCaps {
  const saved = hydrateCareCaps(fromSave);
  const legacyFeed = sanitizeFeedTimes(legacy.feedTimes);
  const legacyRub = sanitizeRubHeal(legacy.rubHeal);

  const feedTimes = Array.from(new Set([...(saved.feedTimes ?? []), ...legacyFeed]))
    .sort((a, b) => a - b);

  let rubHeal = saved.rubHeal;
  if (legacyRub) {
    if (!rubHeal) rubHeal = legacyRub;
    else if (rubHeal.date === legacyRub.date) {
      rubHeal = { date: rubHeal.date, healed: Math.max(rubHeal.healed, legacyRub.healed) };
    }
    // Datas diferentes: o registro do SAVE manda. Um registro de ontem no
    // aparelho não pode sobrescrever o de hoje que veio do save.
  }

  const out: CareCaps = {};
  if (feedTimes.length) out.feedTimes = feedTimes;
  if (rubHeal) out.rubHeal = rubHeal;
  return out;
}

/**
 * A janela viva de comidas, já podada pela regra pura. Existe para quem chama
 * não precisar decidir de onde ler nem repetir o `?? []`.
 */
export function feedTimesFor(caps: CareCaps | undefined, now: number): number[] {
  return recentFeeds(caps?.feedTimes ?? [], now);
}

/** O registro de carinho de HOJE, normalizado pela regra pura. */
export function rubHealFor(caps: CareCaps | undefined, todayKey: string): RubHealRecord {
  return rubHealRecordFor(caps?.rubHeal ?? null, todayKey);
}
