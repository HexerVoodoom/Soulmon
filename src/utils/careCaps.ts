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

/**
 * Aceita só número finito **e não posterior a `now`**; qualquer outra coisa some.
 *
 * As duas metades existem pelo MESMO motivo, e a segunda foi paga com o achado
 * X-5 do gate da fatia 2: um `NaN` na janela passaria pelo filtro de 1h para
 * sempre — e um timestamp NO FUTURO também, porque `now - t < HOUR_MS`
 * (`careRules.ts`) é verdadeiro para todo `t` futuro. O filtro original pegou
 * só o `NaN`; a classe de defeito era a mesma.
 *
 * **Por que isto virou urgente na fatia 2:** enquanto os tetos moravam no
 * `localStorage`, um aparelho com o relógio adiantado só travava a si mesmo.
 * Agora eles moram no SAVE — 6 comidas gravadas com relógio 3h adiantado
 * VIAJAM para a nuvem e travam a comida do aparelho de relógio certo por até
 * 4 horas, sem explicação nenhuma na tela (o pet só diz que está cheio).
 *
 * **Qual `now`, e por que ele é PARÂMETRO** (a escolha, declarada): é o relógio
 * do aparelho que está CARREGANDO o save, no instante do load — o mesmo relógio
 * que `recentFeeds` vai usar depois para medir a janela de 1h. Um timestamp que
 * sobrevive à higienização é, por construção, comparável com o `now` da regra.
 * Não existe relógio melhor disponível aqui: o aparelho que gravou pode ter sido
 * qualquer um, e não há carimbo de servidor no save. No aparelho de relógio
 * errado nada é perdido — o `Date.now()` dele também está adiantado, então os
 * registros dele continuam `t <= now`. Fica por parâmetro (e não `Date.now()`
 * aqui dentro) porque este módulo é puro e os testes precisam de relógio fixo.
 *
 * **O que este filtro NÃO é:** não é a janela de 1h nem um teto. Ele não sabe
 * quantas comidas cabem nem por quanto tempo um registro vale — isso continua
 * inteiro em `careRules.ts`, que segue intocado. Aqui só se decide se um
 * registro é um registro: instante futuro não é registro de coisa que aconteceu.
 *
 * Assimetria com `rubHeal`, de propósito: um `date` de dia futuro não trava
 * nada, porque `rubHealRecordFor` compara igualdade de dia e um dia que não é
 * hoje simplesmente vira `{healed: 0}`. Não há o que higienizar lá.
 */
function sanitizeFeedTimes(v: unknown, now: number): number[] {
  if (!Array.isArray(v)) return [];
  return v.filter((t): t is number => typeof t === 'number' && Number.isFinite(t) && t <= now);
}

function sanitizeRubHeal(v: unknown): RubHealRecord | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const e = v as Record<string, unknown>;
  if (typeof e.date !== 'string') return undefined;
  const healed = typeof e.healed === 'number' && Number.isFinite(e.healed) ? e.healed : 0;
  return { date: e.date, healed: Math.max(0, healed) };
}

/**
 * Higieniza o que veio do save (local ou nuvem) — nunca lança.
 *
 * `now` é o relógio de quem está carregando; ver `sanitizeFeedTimes`.
 */
export function hydrateCareCaps(v: unknown, now: number): CareCaps {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const e = v as Record<string, unknown>;
  const feedTimes = sanitizeFeedTimes(e.feedTimes, now);
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
 * A única exceção é o descarte de duplicatas exatas, que é da fusão, não da regra
 * — e o de instantes no FUTURO, que não são registro de nada (ver
 * `sanitizeFeedTimes`; `now` é o relógio de quem está carregando o save).
 */
export function mergeCareCaps(fromSave: unknown, legacy: LegacyCareCaps, now: number): CareCaps {
  const saved = hydrateCareCaps(fromSave, now);
  const legacyFeed = sanitizeFeedTimes(legacy.feedTimes, now);
  const legacyRub = sanitizeRubHeal(legacy.rubHeal);

  const feedTimes = Array.from(new Set([...(saved.feedTimes ?? []), ...legacyFeed]))
    .sort((a, b) => a - b);

  let rubHeal = saved.rubHeal;
  if (legacyRub) {
    if (!rubHeal) rubHeal = legacyRub;
    else if (rubHeal.date === legacyRub.date) {
      rubHeal = { date: rubHeal.date, healed: Math.max(rubHeal.healed, legacyRub.healed) };
    } else {
      // Datas diferentes: manda o dia mais RECENTE, não o save por ser save
      // (X-4). Igualdade cega aqui tinha o mesmo defeito da leitura: com dois
      // aparelhos em fusos diferentes, "o save manda" podia enterrar o registro
      // mais novo do aparelho e devolver teto. Data ilegível perde para a legível.
      const s = Date.parse(rubHeal.date);
      const l = Date.parse(legacyRub.date);
      if (Number.isNaN(s) && !Number.isNaN(l)) rubHeal = legacyRub;
      else if (!Number.isNaN(s) && !Number.isNaN(l) && l > s) rubHeal = legacyRub;
    }
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
