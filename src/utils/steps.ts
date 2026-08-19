/**
 * CONTADOR DE PASSOS (opcional, leve, com degradação graciosa)
 * ===========================================================
 *
 * Camada fininha sobre `@capgo/capacitor-pedometer` (Android:
 * `Sensor.TYPE_STEP_COUNTER`; iOS: `CMPedometer`) mais as funções PURAS que
 * transformam a leitura crua do sensor num agregado diário confiável.
 *
 * REGRAS DE PRODUTO — LEIA ANTES DE LIGAR ISTO EM QUALQUER PONTUAÇÃO
 * -----------------------------------------------------------------
 * 1. **PASSOS NUNCA PONTUAM SOZINHOS.** O princípio do app é
 *    *"declarado pontua, inferido confirma e enriquece"* (`docs/PLANO-TAREFAS.md`,
 *    Parte 3). Passo é sinal INFERIDO. Os dois usos legítimos são:
 *      (a) **selo de "verificado" + bônus pequeno** num hábito de
 *          Fitness/Health que o usuário JÁ marcou como feito — o hábito
 *          marcado é que vale; o passo só confirma;
 *      (b) **missões corporais OPCIONAIS com teto diário** — conteúdo extra,
 *          nunca requisito de meta, de coração, de dia perfeito ou de evolução.
 *    Nenhuma função deste arquivo devolve HP, energia, `perfectDays` ou peso de
 *    esforço, e nenhuma delas deve passar a devolver.
 * 2. **Quem não tem sensor não pode ficar em desvantagem ESTRUTURAL.** A maior
 *    parte da base joga na PWA, onde não existe sensor nenhum. Tudo aqui
 *    degrada em silêncio: `isStepsAvailable()` responde `false`,
 *    `readStepsToday()` responde `null`, e o app segue idêntico — só sem
 *    passos. Se um dia uma recompensa só alcançável com sensor aparecer, a
 *    regra 1 já foi quebrada.
 * 3. **Consentimento explícito ANTES de pedir a permissão.** `ACTIVITY_RECOGNITION`
 *    é permissão de runtime simples (não é Health Connect), mas a política do
 *    Play e a LGPD exigem dizer, em texto, O QUE é lido e PARA QUÊ antes do
 *    diálogo do sistema. Esse texto é `stepsConsentCopy(language)` — EN e
 *    PT-BR, como todo texto do app. Chamar `requestStepsPermission()` sem ter
 *    mostrado essa tela é bug de conformidade, não de UX.
 * 4. **Guarda-se só o AGREGADO DIÁRIO** (`{ date, baseline, today }`), nunca a
 *    série bruta, nunca horário de passo, nunca localização. Minimização de
 *    dados; e sem série não há como inferir rotina de ninguém.
 *
 * POR QUE NÃO HEALTH CONNECT E NÃO GOOGLE FIT (decisão fechada)
 * ------------------------------------------------------------
 * - **Health Connect**: exige conta de organização verificada no Play,
 *   declaração de acesso a dados de saúde e política de privacidade dedicada.
 *   Custo de conformidade desproporcional para um bônus cosmético.
 * - **Google Fit**: está sendo desligado — cadastros novos fechados desde
 *   mai/2024 e as APIs morrem no fim de 2026. Não se escreve linha nova
 *   contra ele.
 *
 * O RESET DO CONTADOR — O BUG QUE MORA AQUI
 * -----------------------------------------
 * `TYPE_STEP_COUNTER` conta ACUMULADO DESDE O BOOT e **zera no reboot**. E o
 * plugin acrescenta um segundo reset: no Android ele entrega passos desde o
 * `startMeasurementUpdates()` da SESSÃO, então relançar o app também derruba o
 * número para 0. Os dois casos têm exatamente a mesma assinatura — *a leitura
 * crua caiu abaixo da última leitura* — e por isso são tratados pelo mesmo
 * caminho, em função pura e testável (`stepsDeltaFrom` / `updateStepBaseline`).
 * Consequência prática, e é ela que garante o invariante: **nunca devolvemos
 * passo negativo**, e uma queda do acumulado só pode ADICIONAR ao total do
 * dia, jamais subtrair.
 *
 * Limitação honesta do desenho leve: passos dados com o app morto e o aparelho
 * não reiniciado ficam de fora (a sessão do plugin começa do zero). Isso é
 * aceitável exatamente porque passo não pontua sozinho — subcontar não tira
 * nada de ninguém.
 */

import { Capacitor } from '@capacitor/core';
import type { Language } from './i18n';

/** Meta diária padrão. Referência de caminhada regular, não meta médica. */
export const DEFAULT_STEP_GOAL = 7000;

/**
 * O ÚNICO formato persistido (opcional no GameState: `steps?: StepsRecord`).
 * Agregado diário e nada mais.
 */
export interface StepsRecord {
  /** dayKey do dia agregado (`Date.prototype.toDateString`, convenção do repo). */
  date: string;
  /**
   * Última leitura CRUA vista do sensor. É o offset: o que entra em `today` é
   * sempre a diferença contra ele. Guardar a última leitura (e não o valor do
   * início do dia) é o que faz reboot e relançamento caírem no mesmo caso.
   */
  baseline: number;
  /** Total de passos atribuídos a este dia. Monotônico dentro do dia. */
  today: number;
}

/** dayKey do repo (mesma convenção de `habitRhythm`/`restWindow`). */
export function stepsDayKey(date: Date): string {
  return date.toDateString();
}

function sane(n: unknown): number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/**
 * Quantos passos NOVOS uma leitura crua representa, dado o último acumulado
 * visto. Função pura — é aqui que o reboot é decidido.
 *
 * - `raw >= baseline`: caminhada normal → `raw - baseline`.
 * - `raw <  baseline`: o contador zerou (reboot do aparelho ou nova sessão do
 *   plugin) → o próprio `raw` é tudo o que foi andado desde o zero.
 * - Entrada inválida (NaN, negativa, indefinida) → 0.
 *
 * NUNCA devolve número negativo.
 */
export function stepsDeltaFrom(baseline: number, raw: number): number {
  const r = sane(raw);
  const b = sane(baseline);
  if (r < b) return r; // contador reiniciou
  return r - b;
}

/**
 * Aplica uma leitura crua ao registro do dia. Pura; `dayKey` entra por
 * parâmetro (nunca `Date.now()` aqui dentro).
 *
 * - Sem registro, ou registro de OUTRO dia → começa o dia zerado ancorado na
 *   leitura atual (`today = 0`, `baseline = raw`). A virada do dia não herda
 *   passo de ontem nem tenta adivinhar quanto do acumulado foi de hoje.
 * - Mesmo dia → soma o delta de `stepsDeltaFrom` e reancora o baseline.
 *
 * `today` só cresce dentro de um mesmo dia.
 */
export function updateStepBaseline(
  record: StepsRecord | null | undefined,
  raw: number,
  dayKey: string,
): StepsRecord {
  const r = sane(raw);

  if (!record || record.date !== dayKey) {
    return { date: dayKey, baseline: r, today: 0 };
  }

  const delta = stepsDeltaFrom(record.baseline, r);
  return {
    date: dayKey,
    baseline: r,
    today: Math.max(0, sane(record.today) + delta),
  };
}

/**
 * Progresso da meta, de 0 a 1 (nunca acima de 1, nunca abaixo de 0).
 * Meta inválida (0 ou negativa) devolve 0 — sem meta não há progresso, e
 * dividir por zero não vira 100%.
 */
export function stepsGoalProgress(steps: number, goal: number = DEFAULT_STEP_GOAL): number {
  const g = sane(goal);
  if (g <= 0) return 0;
  const s = sane(steps);
  return Math.min(1, s / g);
}

// ── Consentimento (mostrar ANTES de requestStepsPermission) ────────────────

export interface StepsConsentCopy {
  title: string;
  /** O que é lido. */
  what: string;
  /** Para que serve — e o limite: passo não pontua sozinho. */
  why: string;
  /** O que NÃO é guardado. */
  privacy: string;
  accept: string;
  decline: string;
}

/**
 * Texto de consentimento, EN + PT-BR. Precisa dizer o que é lido, para quê e
 * o que não sai do aparelho — exigência da política do Play e da LGPD.
 */
export function stepsConsentCopy(language: Language): StepsConsentCopy {
  if (language === 'pt-BR') {
    return {
      title: 'Contar seus passos?',
      what: 'O Soulmon leria o contador de passos do próprio aparelho (nenhuma conta de saúde, nenhum app de terceiros).',
      why: 'Serve só para confirmar um hábito de saúde que você JÁ marcou como feito e para missões extras opcionais. Passos nunca valem ponto sozinhos: quem não ativa isso não perde nada.',
      privacy: 'Guardamos apenas o total do dia, no seu aparelho. Nada de horários, trajetos ou localização — e nada disso é vendido ou compartilhado.',
      accept: 'Pode contar',
      decline: 'Agora não',
    };
  }
  return {
    title: 'Count your steps?',
    what: "Soulmon would read your phone's own step counter (no health account, no third-party app).",
    why: 'It only confirms a health habit you ALREADY marked as done, plus optional side quests. Steps never score on their own: turning this off costs you nothing.',
    privacy: 'We keep only the daily total, on your device. No timestamps, no routes, no location — and none of it is sold or shared.',
    accept: 'Count them',
    decline: 'Not now',
  };
}

// ── Camada nativa (import DINÂMICO, degradação graciosa) ───────────────────
// Mesmo padrão de `utils/notifications.ts`: fora do app nativo nada é
// carregado e toda função responde com o valor "não tem sensor".

type Pedometer = typeof import('@capgo/capacitor-pedometer')['CapacitorPedometer'];

let pedometerPromise: Promise<Pedometer | null> | null = null;
let updatesStarted = false;

async function loadPedometer(): Promise<Pedometer | null> {
  if (!Capacitor.isNativePlatform()) return null;
  if (!pedometerPromise) {
    pedometerPromise = import('@capgo/capacitor-pedometer')
      .then((mod) => mod.CapacitorPedometer ?? null)
      .catch(() => null);
  }
  return pedometerPromise;
}

/** O aparelho tem contador de passos? Web/PWA e aparelho sem sensor → false. */
export async function isStepsAvailable(): Promise<boolean> {
  const pedometer = await loadPedometer();
  if (!pedometer) return false;
  try {
    const result = await pedometer.isAvailable();
    return result?.stepCounting === true;
  } catch {
    return false;
  }
}

/** Já temos permissão? Não abre diálogo nenhum. */
export async function hasStepsPermission(): Promise<boolean> {
  const pedometer = await loadPedometer();
  if (!pedometer) return false;
  try {
    const status = await pedometer.checkPermissions();
    return status?.activityRecognition === 'granted';
  } catch {
    return false;
  }
}

/**
 * Pede a permissão de reconhecimento de atividade.
 * **Só chame depois de mostrar `stepsConsentCopy`** (ver regra 3 no topo).
 */
export async function requestStepsPermission(): Promise<boolean> {
  const pedometer = await loadPedometer();
  if (!pedometer) return false;
  try {
    if (!(await isStepsAvailable())) return false;
    const status = await pedometer.requestPermissions();
    return status?.activityRecognition === 'granted';
  } catch {
    return false;
  }
}

/**
 * Lê a leitura crua do sensor. `null` = sem sensor, sem permissão ou erro —
 * e `null` NUNCA é 0: zerar o dia por causa de uma leitura que falhou seria
 * apagar passo que o usuário deu.
 */
async function readRawSteps(now: Date): Promise<number | null> {
  const pedometer = await loadPedometer();
  if (!pedometer) return null;
  try {
    if (!(await hasStepsPermission())) return null;

    // No Android o `getMeasurement` só responde algo útil com as atualizações
    // ligadas (o valor é relativo ao início da sessão). Idempotente.
    if (!updatesStarted) {
      await pedometer.startMeasurementUpdates();
      updatesStarted = true;
    }

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    // `start`/`end` são usados pelo CMPedometer no iOS; o Android ignora.
    const measurement = await pedometer.getMeasurement({
      start: start.getTime(),
      end: now.getTime(),
    });
    const steps = measurement?.numberOfSteps;
    return typeof steps === 'number' && Number.isFinite(steps) ? Math.max(0, Math.floor(steps)) : null;
  } catch {
    updatesStarted = false;
    return null;
  }
}

/**
 * Agregado de passos de hoje. Recebe o registro anterior (o que estaria no
 * GameState) e devolve o registro atualizado, ou `null` quando não há sensor /
 * permissão / leitura — caso em que o chamador deve manter o registro que já
 * tinha, sem tocar em nada.
 */
export async function readStepsToday(
  now: Date,
  previous?: StepsRecord | null,
): Promise<StepsRecord | null> {
  const raw = await readRawSteps(now);
  if (raw === null) return null;
  return updateStepBaseline(previous, raw, stepsDayKey(now));
}

/** Só para os testes: esquece o módulo carregado e o estado da sessão. */
export function __resetStepsRuntime(): void {
  pedometerPromise = null;
  updatesStarted = false;
}
