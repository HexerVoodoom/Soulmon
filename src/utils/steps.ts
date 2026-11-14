/**
 * CONTADOR DE PASSOS (opcional, leve, com degradação graciosa)
 * ===========================================================
 *
 * Camada fininha sobre o Health Connect (Android, plugin `SoulmonSteps`) e, de reserva, `@capgo/capacitor-pedometer` (Android:
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
 *          nunca requisito de meta, de coração, de dia perfeito ou de evolução
 *          (a missão especial diária vive em `utils/specialMissions.ts`).
 *    Nenhuma função deste arquivo devolve HP, energia, `perfectDays` ou peso de
 *    esforço, e nenhuma delas deve passar a devolver.
 *    REVISTA EM PARTE (dono, 12/11/2026, beta12 §J, Q1–Q9): um terceiro uso é o CHECK AUTOMÁTICO de hábito ADOTADO do catálogo com
 *    recurso `steps` (`corpo-caminhar`): meta batida (a das Configurações) marca o hábito sozinho, com o MESMO pagamento do toque manual,
 *    sem bônus e 1×/dia (`utils/tarefaLink.ts`). O passo só CONFIRMA o que a pessoa já declarou ao adotar; sugestão não aceita nunca marca.
 * 2. **Quem não tem sensor não pode ficar em desvantagem ESTRUTURAL.** A maior
 *    parte da base joga na PWA, onde não existe sensor nenhum. Tudo aqui
 *    degrada em silêncio: `isStepsAvailable()` responde `false`,
 *    `readStepsToday()` responde `null`, e o app segue idêntico — só sem
 *    passos. Se um dia uma recompensa só alcançável com sensor aparecer, a
 *    regra 1 já foi quebrada.
 *    REVOGADA EM PARTE (dono, 19/10/2026, REGISTRO §106): a missão especial de
 *    passos existe só para quem tem sensor; quem não tem recebe a missão de
 *    descanso no lugar, com o MESMO peso e o mesmo teto (1/dia) — a alternativa
 *    recomendada que perdeu era uma missão equivalente declarada.
 * 3. **Consentimento explícito ANTES de pedir a permissão.** `ACTIVITY_RECOGNITION` (contador do aparelho) e `READ_STEPS` (Health
 *    Connect) são permissões de runtime, e a política do Play e a LGPD exigem dizer, em texto, O QUE é lido e PARA QUÊ antes do
 *    diálogo do sistema. Esse texto é `stepsConsentCopy(language)` — EN e PT-BR, como todo texto do app. Chamar
 *    `requestStepsPermission()` sem ter mostrado essa tela é bug de conformidade, não de UX.
 * 4. **Guarda-se só o AGREGADO DIÁRIO** (`{ date, baseline, today }`), nunca a
 *    série bruta, nunca horário de passo, nunca localização. Minimização de
 *    dados; e sem série não há como inferir rotina de ninguém.
 *
 * HEALTH CONNECT (REGISTRO §283, dono, 20/10/2026 — REVOGA "não Health Connect") E O GOOGLE FIT
 * ---------------------------------------------------------------------------------------------
 * - **Health Connect** é a fonte PREFERIDA no Android: o total do dia vem do próprio Health Connect, que continua somando com o app
 *   FECHADO (o contador do aparelho só conta com o app vivo). Uma permissão só, `READ_STEPS`, só leitura, só "passos de hoje"
 *   (plugin nativo `SoulmonSteps`, `plugins/SoulmonStepsPlugin.ts`). O APK antigo não tem o plugin: o feature detect cai no contador do
 *   aparelho, que segue como reserva (aparelho sem Health Connect, Android antigo, quem já tinha concedido o contador).
 * - **Google Fit** segue PROIBIDO: está sendo desligado (cadastros novos fechados desde mai/2024, APIs mortas no fim de 2026) e a linha
 *   vermelha do `CLAUDE.md` continua valendo para ele. Health Connect é outra API do Android.
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
import { SoulmonSteps } from '../plugins/SoulmonStepsPlugin';

/** Meta diária padrão. Referência de caminhada regular, não meta médica. */
export const DEFAULT_STEP_GOAL = 7000;
export const STEP_GOAL_MIN = 1000;
export const STEP_GOAL_MAX = 30000;
/** Metas oferecidas ao jogador (qualquer inteiro em [MIN, MAX] é aceito ao carregar). */
export const STEP_GOAL_OPTIONS = [3000, 5000, 7000, 10000] as const;

/** Meta escolhida → inteiro em [MIN, MAX]; inválida → padrão. */
export function sanitizeStepGoal(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return DEFAULT_STEP_GOAL;
  return Math.min(STEP_GOAL_MAX, Math.max(STEP_GOAL_MIN, Math.floor(v)));
}

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
      title: 'Quer usar a contagem de passos?',
      what: 'Ao ligar, você ativa uma missão bônus. O Soulmon lê só o total de passos do dia, pelo Health Connect (ou pelo contador do aparelho), mesmo com o app fechado.',
      why: 'Passos nunca valem ponto sozinhos e não contam para o dia completo. Quem não liga não perde nada.',
      privacy: 'Guardamos só o total do dia, no seu save. Nada de horários, trajetos ou localização, e nada é vendido.',
      accept: 'Pode contar',
      decline: 'Agora não',
    };
  }
  return {
    title: 'Want to use step counting?',
    what: "Turning it on unlocks a bonus mission. Soulmon reads just the day's step total, from Health Connect (or your phone's step counter), even while the app is closed.",
    why: 'Steps never score on their own and do not count toward a complete day. If you skip it, you lose nothing.',
    privacy: 'We keep only the daily total, in your save. No timestamps, no routes, no location, and none of it is sold.',
    accept: 'Count them',
    decline: 'Not now',
  };
}

// ── Camada nativa (import DINÂMICO, degradação graciosa) ───────────────────
// Mesmo padrão de `utils/notifications.ts`: fora do app nativo nada é
// carregado e toda função responde com o valor "não tem sensor".
// Duas fontes, nesta ordem: (1) Health Connect (`SoulmonSteps`, conta com o app fechado) e (2) o contador do aparelho
// (`@capgo/capacitor-pedometer`, só com o app vivo). O Health Connect só entra se o plugin existir NESTE APK (feature detect).

type Pedometer = typeof import('@capgo/capacitor-pedometer')['CapacitorPedometer'];

/** O plugin vai DENTRO de uma caixa: devolver o proxy do Capacitor direto por uma Promise (`.then`/`async`/`await`) faz o JS chamar `.then` nele,
 *  e o Capacitor responde `"CapacitorPedometer.then()" is not implemented on android` — o `.catch` engolia isso e o contador de passos ficava
 *  desligado no Android (33 relatórios por dia, 20/10/2026). Quem usa lê `box.plugin` e nunca devolve o plugin por uma Promise. */
interface PedometerBox { plugin: Pedometer }

let pedometerPromise: Promise<PedometerBox | null> | null = null;
let updatesStarted = false;

async function loadPedometer(): Promise<PedometerBox | null> {
  if (!Capacitor.isNativePlatform()) return null;
  if (!pedometerPromise) {
    pedometerPromise = import('@capgo/capacitor-pedometer')
      .then((mod) => (mod.CapacitorPedometer ? { plugin: mod.CapacitorPedometer } : null))
      .catch(() => null);
  }
  return pedometerPromise;
}

/** O Health Connect só existe no app nativo E num APK que trouxe o plugin (o APK antigo não traz: feature detect). */
function healthPluginPresent(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('SoulmonSteps');
  } catch {
    return false;
  }
}

/** Estado do Health Connect: `null` = sem plugin neste APK, sem Health Connect no aparelho ou erro. Nunca lança. */
async function healthStatus(): Promise<{ available: boolean; granted: boolean } | null> {
  if (!healthPluginPresent()) return null;
  try {
    const r = await SoulmonSteps.status();
    if (r?.available !== true) return null;
    return { available: true, granted: r.granted === true };
  } catch {
    return null;
  }
}

/** O aparelho tem contador de passos (Health Connect OU sensor)? Web/PWA e aparelho sem nenhum dos dois → false. */
export async function isStepsAvailable(): Promise<boolean> {
  if (await healthStatus()) return true;
  const pedometer = (await loadPedometer())?.plugin;
  if (!pedometer) return false;
  try {
    const result = await pedometer.isAvailable();
    return result?.stepCounting === true;
  } catch {
    return false;
  }
}

async function hasSensorPermission(): Promise<boolean> {
  const pedometer = (await loadPedometer())?.plugin;
  if (!pedometer) return false;
  try {
    const status = await pedometer.checkPermissions();
    return status?.activityRecognition === 'granted';
  } catch {
    return false;
  }
}

/** Já temos permissão (Health Connect OU sensor)? Não abre diálogo nenhum. */
export async function hasStepsPermission(): Promise<boolean> {
  const hc = await healthStatus();
  if (hc?.granted) return true;
  return hasSensorPermission();
}

/**
 * Pede a permissão. Com Health Connect no aparelho, pede `READ_STEPS` (e só ela); sem Health Connect, cai no
 * reconhecimento de atividade do contador do aparelho.
 * **Só chame depois de mostrar `stepsConsentCopy`** (ver regra 3 no topo).
 */
export async function requestStepsPermission(): Promise<boolean> {
  const hc = await healthStatus();
  if (hc) {
    if (hc.granted) return true;
    try {
      const r = await SoulmonSteps.requestPermission();
      return r?.granted === true;
    } catch {
      return false;
    }
  }
  const pedometer = (await loadPedometer())?.plugin;
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
  const pedometer = (await loadPedometer())?.plugin;
  if (!pedometer) return null;
  try {
    if (!(await hasSensorPermission())) return null;

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
 * Aplica o TOTAL DO DIA que o Health Connect devolveu. Pura. Diferente do sensor, o total já é "hoje" (o Health Connect agrega de 00:00
 * até agora, de todas as fontes, sem duplicar), então não há baseline: `baseline` fica 0 só para manter o formato do `StepsRecord`.
 * Dentro do mesmo dia `today` só cresce (uma leitura menor, de uma fonte que atrasou, nunca tira passo); outro dia começa do total lido.
 */
export function applyHealthTotal(
  record: StepsRecord | null | undefined,
  total: number,
  dayKey: string,
): StepsRecord {
  const t = sane(total);
  if (!record || record.date !== dayKey) return { date: dayKey, baseline: 0, today: t };
  return { date: dayKey, baseline: 0, today: Math.max(sane(record.today), t) };
}

/** Total de hoje no Health Connect, ou `null` (sem plugin, sem Health Connect, sem permissão, leitura falha). Nunca 0 por erro. */
async function readHealthTotal(): Promise<number | null> {
  const hc = await healthStatus();
  if (!hc?.granted) return null;
  try {
    const r = await SoulmonSteps.readToday();
    return typeof r?.steps === 'number' && Number.isFinite(r.steps) ? Math.max(0, Math.floor(r.steps)) : null;
  } catch {
    return null;
  }
}

/**
 * Agregado de passos de hoje. Recebe o registro anterior (o que estaria no
 * GameState) e devolve o registro atualizado, ou `null` quando não há sensor /
 * permissão / leitura — caso em que o chamador deve manter o registro que já
 * tinha, sem tocar em nada. Health Connect primeiro (conta com o app fechado);
 * sem ele, o contador do aparelho.
 */
export async function readStepsToday(
  now: Date,
  previous?: StepsRecord | null,
): Promise<StepsRecord | null> {
  const total = await readHealthTotal();
  if (total !== null) return applyHealthTotal(previous, total, stepsDayKey(now));
  const raw = await readRawSteps(now);
  if (raw === null) return null;
  return updateStepBaseline(previous, raw, stepsDayKey(now));
}

/** Só para os testes: esquece o módulo carregado e o estado da sessão. */
export function __resetStepsRuntime(): void {
  pedometerPromise = null;
  updatesStarted = false;
}
